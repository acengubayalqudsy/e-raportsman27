<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\AuditLog;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    /**
     * Get aggregate statistics for students master data.
     */
    public function stats(Request $request): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk melihat statistik siswa.',
            ], 403);
        }

        $total = Student::count();
        $male = Student::where('gender', 'L')->count();
        $female = Student::where('gender', 'P')->count();
        $active = Student::where('status', 'Aktif')->count();
        $alumni = Student::where('status', 'Alumni')->count();
        $mutated = Student::where('status', 'Mutasi')->count();

        // Transitional active classes count (distinct active class assignments)
        $activeClasses = Student::where('status', 'Aktif')
            ->whereNotNull('current_class_name')
            ->where('current_class_name', '!=', '')
            ->distinct('current_class_name')
            ->count('current_class_name');

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'male' => $male,
                'female' => $female,
                'active' => $active,
                'alumni' => $alumni,
                'mutated' => $mutated,
                'active_classes' => $activeClasses,
            ],
        ]);
    }

    /**
     * Display a paginated listing of students with search and filters.
     */
    public function index(Request $request, \App\Services\AcademicAuthorizationService $authService): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasAnyRole(['admin', 'guru', 'walikelas'])) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk melihat data siswa.',
            ], 403);
        }

        $query = Student::query()->filter($request->all());

        // Row-level authorization for teachers and homeroom teachers
        if (!$user->hasRole('admin')) {
            $allowedClassIds = $authService->getAllowedClassIds($user);
            if (empty($allowedClassIds)) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'from' => null,
                        'last_page' => 1,
                        'per_page' => (int)$request->input('per_page', 8),
                        'to' => null,
                        'total' => 0,
                    ],
                ]);
            }

            // If teacher explicitly requested a specific class, verify ownership
            if ($request->filled('class_id') && !$authService->canAccessClass($user, (int)$request->input('class_id'))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Anda tidak memiliki penugasan pada rombel yang dipilih.',
                ], 403);
            }

            if ($request->filled('class_name')) {
                $reqClass = \App\Models\SchoolClass::where('name', $request->input('class_name'))->first();
                if ($reqClass && !in_array($reqClass->id, $allowedClassIds, true)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Akses ditolak. Anda tidak memiliki penugasan pada rombel yang dipilih.',
                    ], 403);
                }
            }

            $allowedNames = \App\Models\SchoolClass::whereIn('id', $allowedClassIds)->pluck('name')->toArray();
            $query->where(function ($q) use ($allowedClassIds, $allowedNames) {
                $q->whereHas('classMembers', function ($cm) use ($allowedClassIds) {
                    $cm->whereIn('class_id', $allowedClassIds)->where('status', 'Aktif');
                })->orWhereIn('current_class_name', $allowedNames);
            });
        }

        // Sort configuration
        $allowedSorts = ['id', 'name', 'nis', 'nisn', 'current_class_name', 'status', 'created_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts) ? $request->input('sort_by') : 'name';
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        // Server-side pagination
        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => StudentResource::collection($paginator->items()),
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
     * Display the specified student's detailed profile.
     */
    public function show(Request $request, int $id, \App\Services\AcademicAuthorizationService $authService): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasAnyRole(['admin', 'guru', 'walikelas'])) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk melihat detail biodata siswa.',
            ], 403);
        }

        $student = Student::find($id);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Data siswa tidak ditemukan.',
            ], 404);
        }

        if (!$authService->canAccessStudent($user, $student)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Guru tidak memiliki hak akses terhadap data siswa di luar rombel yang ditugaskan.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new StudentResource($student),
        ]);
    }

    /**
     * Store a newly created student in storage.
     */
    public function store(StoreStudentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $student = Student::create($validated);

        // Record audit log
        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'CREATE_STUDENT',
            'description' => "Menambahkan data siswa: {$student->name} (NIS: {$student->nis}, Kelas: {$student->current_class_name})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data siswa berhasil ditambahkan.',
            'data' => new StudentResource($student),
        ], 201);
    }

    /**
     * Update the specified student in storage.
     */
    public function update(UpdateStudentRequest $request, int $id): JsonResponse
    {
        $student = Student::find($id);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Data siswa tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validated();
        $student->update($validated);

        // Record audit log
        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_STUDENT',
            'description' => "Memperbarui data siswa: {$student->name} (NIS: {$student->nis})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data siswa berhasil diperbarui.',
            'data' => new StudentResource($student),
        ]);
    }

    /**
     * Remove the specified student from storage using soft delete.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya administrator yang dapat menghapus data siswa.',
            ], 403);
        }

        $student = Student::find($id);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Data siswa tidak ditemukan.',
            ], 404);
        }

        $nis = $student->nis;
        $name = $student->name;

        // Perform soft delete
        $student->delete();

        // Record audit log (minimal sensitive info)
        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'SOFT_DELETE_STUDENT',
            'description' => "Menghapus (soft delete) data siswa ID {$id}: {$name} (NIS: {$nis})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data siswa berhasil dihapus.',
        ]);
    }
}
