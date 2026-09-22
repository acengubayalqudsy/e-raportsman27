<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Extracurricular;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExtracurricularController extends Controller
{
    /**
     * Display a listing of extracurriculars.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Extracurricular::with('teacher')->withCount('studentExtracurriculars');

        // Search by code or name
        if ($search = trim($request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status = $request->input('status')) {
            if ($status !== 'Semua Status' && $status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Sorting
        $allowedSorts = ['id', 'code', 'name', 'status', 'created_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts) ? $request->input('sort_by') : 'name';
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        if ($request->boolean('all')) {
            $items = $query->get()->map(fn($item) => $this->formatItem($item));
            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        }

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        $formatted = collect($paginator->items())->map(fn($item) => $this->formatItem($item));

        return response()->json([
            'success' => true,
            'data' => $formatted,
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
     * Display the specified extracurricular.
     */
    public function show(int $id): JsonResponse
    {
        $item = Extracurricular::with('teacher')->withCount('studentExtracurriculars')->find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Data ekstrakurikuler tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatItem($item),
        ]);
    }

    /**
     * Store a newly created extracurricular.
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->has('teacher_id') && ($request->input('teacher_id') === '' || $request->input('teacher_id') === '0' || $request->input('teacher_id') === 0)) {
            $request->merge(['teacher_id' => null]);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:30', 'unique:extracurriculars,code'],
            'name' => ['required', 'string', 'max:100', 'unique:extracurriculars,name'],
            'teacher_id' => ['nullable', 'integer', 'exists:teachers,id'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(['Aktif', 'Tidak Aktif'])],
        ], [
            'code.required' => 'Kode ekstrakurikuler wajib diisi.',
            'code.unique' => "Kode ':input' sudah terdaftar dalam sistem.",
            'name.required' => 'Nama ekstrakurikuler wajib diisi.',
            'name.unique' => "Ekstrakurikuler ':input' sudah terdaftar dalam sistem.",
            'teacher_id.exists' => 'Pembina guru yang dipilih tidak valid.',
        ]);

        $item = Extracurricular::create([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'teacher_id' => $validated['teacher_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'Aktif',
        ]);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'CREATE_EXTRACURRICULAR',
            'description' => "Menambahkan master ekstrakurikuler: {$item->name} ({$item->code}).",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Ekstrakurikuler {$item->name} berhasil ditambahkan.",
            'data' => $this->formatItem($item->refresh()->load('teacher')),
        ], 201);
    }

    /**
     * Update the specified extracurricular.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $item = Extracurricular::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Data ekstrakurikuler tidak ditemukan.',
            ], 404);
        }

        if ($request->has('teacher_id') && ($request->input('teacher_id') === '' || $request->input('teacher_id') === '0' || $request->input('teacher_id') === 0)) {
            $request->merge(['teacher_id' => null]);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:30', Rule::unique('extracurriculars', 'code')->ignore($item->id)],
            'name' => ['required', 'string', 'max:100', Rule::unique('extracurriculars', 'name')->ignore($item->id)],
            'teacher_id' => ['nullable', 'integer', 'exists:teachers,id'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(['Aktif', 'Tidak Aktif'])],
        ], [
            'code.required' => 'Kode ekstrakurikuler wajib diisi.',
            'code.unique' => "Kode ':input' sudah terdaftar dalam sistem.",
            'name.required' => 'Nama ekstrakurikuler wajib diisi.',
            'name.unique' => "Ekstrakurikuler ':input' sudah terdaftar dalam sistem.",
            'teacher_id.exists' => 'Pembina guru yang dipilih tidak valid.',
        ]);

        $oldName = $item->name;
        $item->update([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'teacher_id' => array_key_exists('teacher_id', $validated) ? $validated['teacher_id'] : $item->teacher_id,
            'description' => $validated['description'] ?? $item->description,
            'status' => $validated['status'] ?? $item->status,
        ]);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_EXTRACURRICULAR',
            'description' => "Memperbarui master ekstrakurikuler: {$oldName} -> {$item->name}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Ekstrakurikuler {$item->name} berhasil diperbarui.",
            'data' => $this->formatItem($item->refresh()->load('teacher')),
        ]);
    }

    /**
     * Toggle or update active status of extracurricular.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $item = Extracurricular::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Data ekstrakurikuler tidak ditemukan.',
            ], 404);
        }

        $targetStatus = $request->input('status');
        if (!$targetStatus) {
            $targetStatus = $item->status === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
        }

        if (!in_array($targetStatus, ['Aktif', 'Tidak Aktif'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Status tidak valid.',
            ], 422);
        }

        $item->update(['status' => $targetStatus]);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_EXTRACURRICULAR_STATUS',
            'description' => "Mengubah status ekstrakurikuler {$item->name} menjadi {$targetStatus}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Status ekstrakurikuler {$item->name} berhasil diubah menjadi {$targetStatus}.",
            'data' => $this->formatItem($item->load('teacher')),
        ]);
    }

    /**
     * Remove the specified extracurricular.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $item = Extracurricular::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Data ekstrakurikuler tidak ditemukan.',
            ], 404);
        }

        if ($item->isReferencedByStudents()) {
            return response()->json([
                'success' => false,
                'message' => "Ekstrakurikuler '{$item->name}' sedang diikuti atau memiliki rekap data siswa dan tidak dapat dihapus. Silakan nonaktifkan statusnya.",
            ], 422);
        }

        $name = $item->name;
        $item->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'DELETE_EXTRACURRICULAR',
            'description' => "Menghapus master ekstrakurikuler: {$name}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Ekstrakurikuler {$name} berhasil dihapus dari sistem.",
        ]);
    }

    /**
     * Formats extracurricular model for frontend display.
     */
    private function formatItem(Extracurricular $item): array
    {
        return [
            'id' => $item->id,
            'code' => $item->code,
            'name' => $item->name,
            'teacher_id' => $item->teacher_id,
            'supervisor' => $item->teacher?->name ?? '-',
            'description' => $item->description ?? '',
            'members' => $item->student_extracurriculars_count ?? $item->studentExtracurriculars()->count(),
            'status' => $item->status,
            'is_active' => $item->status === 'Aktif',
            'created_at' => $item->created_at?->toIso8601String(),
            'updated_at' => $item->updated_at?->toIso8601String(),
        ];
    }
}
