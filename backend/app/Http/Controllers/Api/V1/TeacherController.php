<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeacherRequest;
use App\Http\Requests\UpdateTeacherRequest;
use App\Http\Resources\TeacherResource;
use App\Models\AuditLog;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    /**
     * Get aggregate statistics for teachers master data.
     */
    public function stats(Request $request): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk melihat statistik guru.',
            ], 403);
        }

        $total = Teacher::count();
        $active = Teacher::where('status', 'Aktif')->count();
        $inactive = Teacher::where('status', 'Tidak Aktif')->count();
        $male = Teacher::where('gender', 'L')->count();
        $female = Teacher::where('gender', 'P')->count();
        $asn = Teacher::where('employment_status', 'ASN')->count();
        $pppk = Teacher::where('employment_status', 'PPPK')->count();
        $honorer = Teacher::where('employment_status', 'Honorer')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'male' => $male,
                'female' => $female,
                'asn' => $asn,
                'pppk' => $pppk,
                'honorer' => $honorer,
            ],
        ]);
    }

    /**
     * Display a paginated listing of teachers with search and filters.
     */
    public function index(Request $request): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk melihat data guru.',
            ], 403);
        }

        $query = Teacher::query()->filter($request->all());

        // Sort configuration
        $allowedSorts = ['id', 'name', 'nip', 'nuptk', 'gender', 'employment_status', 'status', 'created_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts) ? $request->input('sort_by') : 'name';
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        // Server-side pagination
        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => TeacherResource::collection($paginator->items()),
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
     * Display the specified teacher's detailed profile.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk melihat detail biodata guru.',
            ], 403);
        }

        $teacher = Teacher::find($id);

        if (!$teacher) {
            return response()->json([
                'success' => false,
                'message' => 'Data guru tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new TeacherResource($teacher),
        ]);
    }

    /**
     * Store a newly created teacher in storage.
     */
    public function store(StoreTeacherRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $teacher = Teacher::create($validated);

        // Record audit log
        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'CREATE_TEACHER',
            'description' => "Menambahkan data guru: {$teacher->name} (NIP: " . ($teacher->nip ?: '-') . ", Status Kepegawaian: {$teacher->employment_status})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data guru berhasil ditambahkan.',
            'data' => new TeacherResource($teacher),
        ], 201);
    }

    /**
     * Update the specified teacher in storage.
     */
    public function update(UpdateTeacherRequest $request, int $id): JsonResponse
    {
        $teacher = Teacher::find($id);

        if (!$teacher) {
            return response()->json([
                'success' => false,
                'message' => 'Data guru tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validated();
        $teacher->update($validated);

        // Record audit log
        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_TEACHER',
            'description' => "Memperbarui data guru ID {$id}: {$teacher->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data guru berhasil diperbarui.',
            'data' => new TeacherResource($teacher),
        ]);
    }

    /**
     * Remove the specified teacher from storage using soft delete.
     * Note: Does NOT delete or deactivate the associated user account.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya administrator yang dapat menghapus data guru.',
            ], 403);
        }

        $teacher = Teacher::find($id);

        if (!$teacher) {
            return response()->json([
                'success' => false,
                'message' => 'Data guru tidak ditemukan.',
            ], 404);
        }

        $name = $teacher->name;
        $nip = $teacher->nip ?: '-';

        // Soft delete teacher profile
        $teacher->delete();

        // Record audit log
        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'SOFT_DELETE_TEACHER',
            'description' => "Menghapus (soft delete) data guru ID {$id}: {$name} (NIP: {$nip})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data guru berhasil dihapus.',
        ]);
    }
}
