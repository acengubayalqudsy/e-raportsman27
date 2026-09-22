<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a paginated listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles', 'teacher']);

        // Search by username, name, email, or linked teacher nip
        if ($search = trim($request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('teacher', function ($tq) use ($search) {
                      $tq->where('nip', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by role
        if ($role = $request->input('role')) {
            if ($role !== 'Semua Role' && $role !== 'all') {
                $query->whereHas('roles', function ($rq) use ($role) {
                    $rq->where('name', $role)
                       ->orWhere('display_name', $role);
                });
            }
        }

        // Filter by active status
        if ($request->has('status') && $request->status !== 'Semua Status' && $request->status !== 'all') {
            $isActive = in_array($request->status, ['Aktif', 'active', '1', 1, true], true);
            $query->where('is_active', $isActive);
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 8)));
        $users = $query->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users->map(fn(User $u) => $this->formatUserRow($u)),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Display the specified user details.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with(['roles', 'teacher'])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatUserDetail($user),
        ]);
    }

    /**
     * Store a newly created user with hashed password and multi-role assignment.
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->has('roles') && $request->has('role')) {
            $request->merge(['roles' => $request->input('role')]);
        }
        if (!$request->has('email') && $request->has('username')) {
            $uname = (string) $request->input('username');
            $request->merge(['email' => filter_var($uname, FILTER_VALIDATE_EMAIL) ? $uname : $uname . '@sman27.sch.id']);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'username' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:100', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:25'],
            'roles' => ['required'],
            'status' => ['nullable', Rule::in(['Aktif', 'Tidak Aktif', 'active', 'inactive'])],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama lengkap pengguna wajib diisi.',
            'username.required' => 'Username wajib diisi.',
            'username.unique' => "Username ':input' sudah terdaftar.",
            'username.alpha_dash' => 'Username hanya boleh berisi huruf, angka, tanda strip, dan garis bawah.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => "Email ':input' sudah terdaftar.",
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 8 karakter.',
            'roles.required' => 'Role pengguna wajib dipilih.',
        ]);

        $isActive = true;
        if (isset($validated['is_active'])) {
            $isActive = (bool)$validated['is_active'];
        } elseif (isset($validated['status'])) {
            $isActive = in_array($validated['status'], ['Aktif', 'active', true], true);
        }

        $user = User::create([
            'name' => trim($validated['name']),
            'username' => strtolower(trim($validated['username'])),
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'is_active' => $isActive,
        ]);

        // Resolve and attach roles
        $roleIds = $this->resolveRoleIds($validated['roles']);
        $syncData = [];
        $first = true;
        foreach ($roleIds as $rId) {
            $syncData[$rId] = ['is_primary' => $first];
            $first = false;
        }
        $user->roles()->sync($syncData);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'CREATE_USER',
            'description' => "Membuat pengguna baru: {$user->username} ({$user->name}).",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengguna {$user->name} berhasil dibuat.",
            'data' => $this->formatUserDetail($user->load('roles')),
        ], 201);
    }

    /**
     * Update user profile, password, and multi-roles.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::with('roles')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        if (!$request->has('roles') && $request->has('role')) {
            $request->merge(['roles' => $request->input('role')]);
        }
        if (!$request->has('email')) {
            $request->merge(['email' => $user->email]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'username' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['required', 'string', 'email', 'max:100', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:25'],
            'roles' => ['nullable'],
            'status' => ['nullable', Rule::in(['Aktif', 'Tidak Aktif', 'active', 'inactive'])],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama lengkap pengguna wajib diisi.',
            'username.required' => 'Username wajib diisi.',
            'username.unique' => "Username ':input' sudah terdaftar.",
            'email.required' => 'Email wajib diisi.',
            'email.unique' => "Email ':input' sudah terdaftar.",
            'password.min' => 'Password minimal 8 karakter.',
        ]);

        // Status update resolution
        $isActive = $user->is_active;
        if (isset($validated['is_active'])) {
            $isActive = (bool)$validated['is_active'];
        } elseif (isset($validated['status'])) {
            $isActive = in_array($validated['status'], ['Aktif', 'active', true], true);
        }

        // Last Administrator Protection: cannot deactivate last admin
        if ($user->hasRole('admin') && !$isActive) {
            $otherActiveAdmins = User::where('id', '!=', $user->id)
                ->where('is_active', true)
                ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
                ->count();

            if ($otherActiveAdmins === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menonaktifkan akun karena pengguna ini adalah satu-satunya Administrator aktif pada sistem.',
                ], 422);
            }
        }

        // Last Administrator Protection: cannot strip admin role if last admin
        $roleIds = null;
        if (isset($validated['roles'])) {
            $roleIds = $this->resolveRoleIds($validated['roles']);
            $adminRole = Role::where('name', 'admin')->first();

            if ($user->hasRole('admin') && $adminRole && !in_array($adminRole->id, $roleIds, true)) {
                $otherActiveAdmins = User::where('id', '!=', $user->id)
                    ->where('is_active', true)
                    ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
                    ->count();

                if ($otherActiveAdmins === 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tidak dapat mencabut hak Administrator dari pengguna ini karena merupakan satu-satunya Administrator aktif pada sistem.',
                    ], 422);
                }
            }
        }

        $updateData = [
            'name' => trim($validated['name']),
            'username' => strtolower(trim($validated['username'])),
            'email' => strtolower(trim($validated['email'])),
            'phone' => $validated['phone'] ?? $user->phone,
            'is_active' => $isActive,
        ];

        // Hash new password if provided
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        // Sync roles if provided
        if ($roleIds !== null) {
            $syncData = [];
            $first = true;
            foreach ($roleIds as $rId) {
                $syncData[$rId] = ['is_primary' => $first];
                $first = false;
            }
            $user->roles()->sync($syncData);
        }

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_USER',
            'description' => "Memperbarui data pengguna: {$user->username}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Data pengguna {$user->name} berhasil diperbarui.",
            'data' => $this->formatUserDetail($user->fresh('roles')),
        ]);
    }

    /**
     * Toggle active status of user with Last Admin protection.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = User::with('roles')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $targetStatus = $request->has('status')
            ? in_array($request->input('status'), ['Aktif', 'active', true, 1], true)
            : !$user->is_active;

        // Protection: Last active administrator cannot be deactivated
        if ($user->hasRole('admin') && !$targetStatus) {
            $otherActiveAdmins = User::where('id', '!=', $user->id)
                ->where('is_active', true)
                ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
                ->count();

            if ($otherActiveAdmins === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menonaktifkan akun Administrator terakhir pada sistem.',
                ], 422);
            }
        }

        $user->update(['is_active' => $targetStatus]);

        $statusLabel = $targetStatus ? 'Aktif' : 'Tidak Aktif';

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_USER_STATUS',
            'description' => "Mengubah status pengguna {$user->username} menjadi {$statusLabel}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Status pengguna {$user->name} berhasil diubah menjadi {$statusLabel}.",
            'data' => $this->formatUserRow($user->fresh('roles')),
        ]);
    }

    /**
     * Remove user with protection for self, last admin, and academic data.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::with('roles')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        // Self-deletion block
        if ($request->user() && $request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.',
            ], 422);
        }

        // Last administrator block
        if ($user->hasRole('admin')) {
            $otherActiveAdmins = User::where('id', '!=', $user->id)
                ->where('is_active', true)
                ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
                ->count();

            if ($otherActiveAdmins === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus akun Administrator terakhir pada sistem.',
                ], 422);
            }
        }

        // Academic integrity protection: cannot delete user linked to teacher or student records
        if (Teacher::where('user_id', $user->id)->exists() || Student::where('user_id', $user->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => "Pengguna '{$user->name}' terhubung dengan data akademik Guru atau Siswa. Akun tidak dapat dihapus, silakan nonaktifkan statusnya.",
            ], 422);
        }

        $name = $user->name;
        $username = $user->username;
        $user->roles()->detach();
        $user->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'DELETE_USER',
            'description' => "Menghapus akun pengguna: {$username} ({$name}).",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengguna {$name} berhasil dihapus dari sistem.",
        ]);
    }

    /**
     * Get list of available system roles.
     */
    public function roles(): JsonResponse
    {
        $roles = Role::select('id', 'name', 'display_name', 'description')->get();

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }

    /**
     * Resolves role identifiers (IDs or names) to array of integer role IDs.
     */
    private function resolveRoleIds(mixed $roles): array
    {
        if (is_string($roles)) {
            $roles = array_map('trim', explode(',', $roles));
        }

        if (!is_array($roles)) {
            $roles = [$roles];
        }

        $ids = [];
        foreach ($roles as $r) {
            if (is_numeric($r)) {
                $ids[] = (int)$r;
            } elseif (is_string($r)) {
                $raw = trim($r);
                $lower = strtolower($raw);
                $canonical = match ($lower) {
                    'admin', 'administrator' => 'admin',
                    'guru', 'guru mata pelajaran', 'guru / wali kelas' => 'guru',
                    'walikelas', 'wali kelas' => 'walikelas',
                    'kepala_sekolah', 'kepala sekolah' => 'kepala_sekolah',
                    'siswa' => 'siswa',
                    default => $lower,
                };
                $found = Role::where('name', $canonical)
                    ->orWhere('name', $raw)
                    ->orWhere('display_name', $raw)
                    ->orWhere('display_name', 'like', "%{$raw}%")
                    ->value('id');
                if ($found) $ids[] = $found;
            } elseif (is_array($r) && isset($r['id'])) {
                $ids[] = (int)$r['id'];
            }
        }

        return array_values(array_unique(array_filter($ids)));
    }

    /**
     * Format user record for table display.
     */
    private function formatUserRow(User $user): array
    {
        $roleNames = $user->roles->pluck('display_name')->filter()->values()->all();
        if (empty($roleNames)) {
            $roleNames = $user->roles->pluck('name')->values()->all();
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone ?? '-',
            'role' => !empty($roleNames) ? implode(', ', $roleNames) : 'Belum diatur',
            'roles' => $user->roles->map(fn($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'display_name' => $r->display_name,
                'is_primary' => (bool)$r->pivot->is_primary,
            ]),
            'nip' => $user->teacher?->nip ?? '-',
            'lastLogin' => $user->last_login_at
                ? $user->last_login_at->translatedFormat('d M Y, H:i')
                : 'Belum pernah',
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'status' => $user->is_active ? 'Aktif' : 'Tidak Aktif',
            'is_active' => (bool)$user->is_active,
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }

    /**
     * Format user detail record.
     */
    private function formatUserDetail(User $user): array
    {
        $row = $this->formatUserRow($user);
        $row['teacher_id'] = $user->teacher?->id;
        return $row;
    }
}
