<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Religion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReligionController extends Controller
{
    /**
     * Display a listing of religions.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Religion::withCount('students');

        // Search by name
        if ($search = trim($request->input('search', ''))) {
            $query->where('name', 'like', "%{$search}%");
        }

        // Filter by status
        if ($status = $request->input('status')) {
            if ($status !== 'Semua Status' && $status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Sorting
        $sortBy = in_array($request->input('sort_by'), ['id', 'name', 'status', 'created_at'])
            ? $request->input('sort_by')
            : 'name';
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        if ($request->boolean('all')) {
            $religions = $query->get();
            return response()->json([
                'success' => true,
                'data' => $religions,
            ]);
        }

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Display the specified religion.
     */
    public function show(int $id): JsonResponse
    {
        $religion = Religion::withCount('students')->find($id);

        if (!$religion) {
            return response()->json([
                'success' => false,
                'message' => 'Data agama tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $religion,
        ]);
    }

    /**
     * Store a newly created religion.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:religions,name'],
            'status' => ['nullable', Rule::in(['Aktif', 'Tidak Aktif'])],
        ], [
            'name.required' => 'Nama agama wajib diisi.',
            'name.unique' => "Agama ':input' sudah terdaftar dalam sistem.",
            'name.max' => 'Nama agama maksimal 50 karakter.',
        ]);

        $religion = Religion::create([
            'name' => trim($validated['name']),
            'status' => $validated['status'] ?? 'Aktif',
        ]);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'CREATE_RELIGION',
            'description' => "Menambahkan master agama baru: {$religion->name}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Agama {$religion->name} berhasil ditambahkan.",
            'data' => $religion,
        ], 201);
    }

    /**
     * Update the specified religion.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $religion = Religion::find($id);

        if (!$religion) {
            return response()->json([
                'success' => false,
                'message' => 'Data agama tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50', Rule::unique('religions', 'name')->ignore($religion->id)],
            'status' => ['nullable', Rule::in(['Aktif', 'Tidak Aktif'])],
        ], [
            'name.required' => 'Nama agama wajib diisi.',
            'name.unique' => "Agama ':input' sudah terdaftar dalam sistem.",
            'name.max' => 'Nama agama maksimal 50 karakter.',
        ]);

        $oldName = $religion->name;
        $religion->update([
            'name' => trim($validated['name']),
            'status' => $validated['status'] ?? $religion->status,
        ]);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_RELIGION',
            'description' => "Memperbarui master agama dari '{$oldName}' menjadi '{$religion->name}'.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Agama {$religion->name} berhasil diperbarui.",
            'data' => $religion,
        ]);
    }

    /**
     * Toggle or update active status of religion.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $religion = Religion::find($id);

        if (!$religion) {
            return response()->json([
                'success' => false,
                'message' => 'Data agama tidak ditemukan.',
            ], 404);
        }

        $targetStatus = $request->input('status');
        if (!$targetStatus) {
            $targetStatus = $religion->status === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
        }

        if (!in_array($targetStatus, ['Aktif', 'Tidak Aktif'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Status tidak valid.',
            ], 422);
        }

        $religion->update(['status' => $targetStatus]);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_RELIGION_STATUS',
            'description' => "Mengubah status agama {$religion->name} menjadi {$targetStatus}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Status agama {$religion->name} berhasil diubah menjadi {$targetStatus}.",
            'data' => $religion,
        ]);
    }

    /**
     * Remove the specified religion.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $religion = Religion::find($id);

        if (!$religion) {
            return response()->json([
                'success' => false,
                'message' => 'Data agama tidak ditemukan.',
            ], 404);
        }

        if ($religion->isReferencedByStudents()) {
            return response()->json([
                'success' => false,
                'message' => "Agama '{$religion->name}' sedang digunakan oleh data siswa dan tidak dapat dihapus. Silakan nonaktifkan statusnya agar tidak muncul pada pilihan siswa baru.",
            ], 422);
        }

        $name = $religion->name;
        $religion->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'DELETE_RELIGION',
            'description' => "Menghapus master agama: {$name}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Agama {$name} berhasil dihapus dari sistem.",
        ]);
    }
}
