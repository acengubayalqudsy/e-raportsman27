<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAcademicYearRequest;
use App\Http\Requests\StoreClassRequest;
use App\Http\Requests\StoreSemesterRequest;
use App\Http\Requests\StoreSubjectRequest;
use App\Http\Requests\UpdateAcademicYearRequest;
use App\Http\Requests\UpdateClassRequest;
use App\Http\Requests\UpdateSemesterRequest;
use App\Http\Requests\UpdateSubjectRequest;
use App\Models\AcademicYear;
use App\Models\AuditLog;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Subject;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademicController extends Controller
{
    private function checkAdmin(Request $request): ?JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk mengelola master data akademik.',
            ], 403);
        }
        return null;
    }

    private function formatDateLabel(?Carbon $date): string
    {
        if (!$date) return '-';
        return $date->translatedFormat('d M Y');
    }

    // =========================================================================
    // 1. ACADEMIC YEARS
    // =========================================================================

    public function indexYears(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $query = AcademicYear::query()->filter($request->all());

        $allowedSorts = ['id', 'name', 'start_date', 'end_date', 'status', 'created_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts) ? $request->input('sort_by') : 'name';
        $sortDir = strtolower($request->input('sort_dir')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        $items = collect($paginator->items())->map(function (AcademicYear $year) {
            return [
                'id' => $year->id,
                'name' => $year->name,
                'startDate' => $year->start_date?->format('Y-m-d'),
                'start_date' => $year->start_date?->format('Y-m-d'),
                'endDate' => $year->end_date?->format('Y-m-d'),
                'end_date' => $year->end_date?->format('Y-m-d'),
                'startLabel' => $this->formatDateLabel($year->start_date),
                'endLabel' => $this->formatDateLabel($year->end_date),
                'status' => $year->status,
                'created_at' => $year->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
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

    public function showYear(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $year = AcademicYear::find($id);
        if (!$year) {
            return response()->json(['success' => false, 'message' => 'Tahun ajaran tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $year->id,
                'name' => $year->name,
                'startDate' => $year->start_date?->format('Y-m-d'),
                'endDate' => $year->end_date?->format('Y-m-d'),
                'startLabel' => $this->formatDateLabel($year->start_date),
                'endLabel' => $this->formatDateLabel($year->end_date),
                'status' => $year->status,
            ],
        ]);
    }

    public function storeYear(StoreAcademicYearRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $year = AcademicYear::create($validated);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'CREATE_ACADEMIC_YEAR',
            'description' => "Menambahkan tahun ajaran: {$year->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tahun ajaran {$year->name} berhasil ditambahkan.",
            'data' => $year,
        ], 201);
    }

    public function updateYear(UpdateAcademicYearRequest $request, int $id): JsonResponse
    {
        $year = AcademicYear::find($id);
        if (!$year) {
            return response()->json(['success' => false, 'message' => 'Tahun ajaran tidak ditemukan.'], 404);
        }

        $validated = $request->validated();
        $year->update($validated);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_ACADEMIC_YEAR',
            'description' => "Memperbarui tahun ajaran: {$year->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tahun ajaran {$year->name} berhasil diperbarui.",
            'data' => $year,
        ]);
    }

    public function destroyYear(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $year = AcademicYear::find($id);
        if (!$year) {
            return response()->json(['success' => false, 'message' => 'Tahun ajaran tidak ditemukan.'], 404);
        }

        // Prevent deletion if active semesters exist
        if ($year->semesters()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => "Tidak dapat menghapus tahun ajaran {$year->name} karena masih memiliki data semester terkait. Hapus atau pindahkan semester terlebih dahulu.",
            ], 422);
        }

        $year->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'SOFT_DELETE_ACADEMIC_YEAR',
            'description' => "Menghapus tahun ajaran: {$year->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tahun ajaran {$year->name} berhasil dihapus.",
        ]);
    }

    /**
     * Activate academic year with pessimistic lock and concurrency protection.
     * Note: Deactivates previously active year to 'Tidak Aktif' (NOT 'Selesai').
     */
    public function activateYear(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        return DB::transaction(function () use ($request, $id) {
            $targetYear = AcademicYear::where('id', $id)->lockForUpdate()->first();
            if (!$targetYear) {
                return response()->json(['success' => false, 'message' => 'Tahun ajaran tidak ditemukan.'], 404);
            }

            // Deactivate other active academic years to 'Tidak Aktif' (not 'Selesai')
            AcademicYear::where('status', 'Aktif')
                ->where('id', '!=', $id)
                ->lockForUpdate()
                ->update(['status' => 'Tidak Aktif']);

            $targetYear->update(['status' => 'Aktif']);

            // Deactivate any active semester belonging to a different academic year
            Semester::where('status', 'Aktif')
                ->where('academic_year_id', '!=', $id)
                ->lockForUpdate()
                ->update(['status' => 'Tidak Aktif']);

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'ACTIVATE_ACADEMIC_YEAR',
                'description' => "Mengaktifkan tahun ajaran: {$targetYear->name}",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Tahun ajaran {$targetYear->name} berhasil diaktifkan.",
                'data' => $targetYear,
            ]);
        });
    }

    // =========================================================================
    // 2. SEMESTERS
    // =========================================================================

    public function indexSemesters(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $query = Semester::with('academicYear')->filter($request->all());

        $allowedSorts = ['id', 'name', 'start_date', 'end_date', 'status', 'created_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts) ? $request->input('sort_by') : 'id';
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        $items = collect($paginator->items())->map(function (Semester $sem) {
            return [
                'id' => $sem->id,
                'academic_year_id' => $sem->academic_year_id,
                'academicYear' => $sem->academicYear?->name ?: '-',
                'name' => $sem->name,
                'startDate' => $sem->start_date?->format('Y-m-d'),
                'start_date' => $sem->start_date?->format('Y-m-d'),
                'endDate' => $sem->end_date?->format('Y-m-d'),
                'end_date' => $sem->end_date?->format('Y-m-d'),
                'startLabel' => $this->formatDateLabel($sem->start_date),
                'endLabel' => $this->formatDateLabel($sem->end_date),
                'status' => $sem->status,
                'created_at' => $sem->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
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

    public function showSemester(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $sem = Semester::with('academicYear')->find($id);
        if (!$sem) {
            return response()->json(['success' => false, 'message' => 'Semester tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $sem->id,
                'academic_year_id' => $sem->academic_year_id,
                'academicYear' => $sem->academicYear?->name ?: '-',
                'name' => $sem->name,
                'startDate' => $sem->start_date?->format('Y-m-d'),
                'endDate' => $sem->end_date?->format('Y-m-d'),
                'startLabel' => $this->formatDateLabel($sem->start_date),
                'endLabel' => $this->formatDateLabel($sem->end_date),
                'status' => $sem->status,
            ],
        ]);
    }

    public function storeSemester(StoreSemesterRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $sem = Semester::create($validated);
        $sem->load('academicYear');

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'CREATE_SEMESTER',
            'description' => "Menambahkan semester: {$sem->name} ({$sem->academicYear?->name})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Semester {$sem->name} berhasil ditambahkan.",
            'data' => $sem,
        ], 201);
    }

    public function updateSemester(UpdateSemesterRequest $request, int $id): JsonResponse
    {
        $sem = Semester::find($id);
        if (!$sem) {
            return response()->json(['success' => false, 'message' => 'Semester tidak ditemukan.'], 404);
        }

        $validated = $request->validated();
        $sem->update($validated);
        $sem->load('academicYear');

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_SEMESTER',
            'description' => "Memperbarui semester ID {$id}: {$sem->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Semester {$sem->name} berhasil diperbarui.",
            'data' => $sem,
        ]);
    }

    public function destroySemester(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $sem = Semester::find($id);
        if (!$sem) {
            return response()->json(['success' => false, 'message' => 'Semester tidak ditemukan.'], 404);
        }

        $name = $sem->name;
        $sem->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'SOFT_DELETE_SEMESTER',
            'description' => "Menghapus semester ID {$id}: {$name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Semester {$name} berhasil dihapus.",
        ]);
    }

    /**
     * Activate semester with strict constraint: parent academic year must be active.
     */
    public function activateSemester(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        return DB::transaction(function () use ($request, $id) {
            $targetSemester = Semester::where('id', $id)->lockForUpdate()->first();
            if (!$targetSemester) {
                return response()->json(['success' => false, 'message' => 'Semester tidak ditemukan.'], 404);
            }

            $academicYear = AcademicYear::where('id', $targetSemester->academic_year_id)->lockForUpdate()->first();
            if (!$academicYear || $academicYear->status !== 'Aktif') {
                return response()->json([
                    'success' => false,
                    'message' => "Tidak dapat mengaktifkan Semester {$targetSemester->name}. Tahun ajaran induk ({$academicYear?->name}) belum berstatus Aktif. Aktifkan tahun ajaran induk terlebih dahulu.",
                ], 422);
            }

            // Deactivate previously active semester to 'Tidak Aktif' (not 'Selesai')
            Semester::where('status', 'Aktif')
                ->where('id', '!=', $id)
                ->lockForUpdate()
                ->update(['status' => 'Tidak Aktif']);

            $targetSemester->update(['status' => 'Aktif']);

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'ACTIVATE_SEMESTER',
                'description' => "Mengaktifkan semester: {$targetSemester->name} ({$academicYear->name})",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Semester {$targetSemester->name} ({$academicYear->name}) berhasil diaktifkan.",
                'data' => $targetSemester,
            ]);
        });
    }

    // =========================================================================
    // 3. CLASSES (ROMBEL REFERENSI)
    // =========================================================================

    public function indexClasses(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $query = SchoolClass::with('academicYear')->filter($request->all());

        $allowedSorts = ['id', 'code', 'name', 'grade', 'capacity', 'status', 'created_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts) ? $request->input('sort_by') : 'name';
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        $items = collect($paginator->items())->map(function (SchoolClass $cls) {
            return [
                'id' => $cls->id,
                'academic_year_id' => $cls->academic_year_id,
                'academicYear' => $cls->academicYear?->name ?: '-',
                'code' => $cls->code,
                'name' => $cls->name,
                'grade' => $cls->grade,
                'capacity' => $cls->capacity,
                'capacityLabel' => "{$cls->capacity} siswa",
                'status' => $cls->status,
                'created_at' => $cls->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
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

    public function showClass(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $cls = SchoolClass::with('academicYear')->find($id);
        if (!$cls) {
            return response()->json(['success' => false, 'message' => 'Data kelas tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $cls->id,
                'academic_year_id' => $cls->academic_year_id,
                'academicYear' => $cls->academicYear?->name ?: '-',
                'code' => $cls->code,
                'name' => $cls->name,
                'grade' => $cls->grade,
                'capacity' => $cls->capacity,
                'capacityLabel' => "{$cls->capacity} siswa",
                'status' => $cls->status,
            ],
        ]);
    }

    public function storeClass(StoreClassRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $cls = SchoolClass::create($validated);
        $cls->load('academicYear');

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'CREATE_CLASS',
            'description' => "Menambahkan kelas: {$cls->name} (Kode: {$cls->code})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Kelas {$cls->name} berhasil ditambahkan.",
            'data' => $cls,
        ], 201);
    }

    public function updateClass(UpdateClassRequest $request, int $id): JsonResponse
    {
        $cls = SchoolClass::find($id);
        if (!$cls) {
            return response()->json(['success' => false, 'message' => 'Data kelas tidak ditemukan.'], 404);
        }

        $validated = $request->validated();
        $cls->update($validated);
        $cls->load('academicYear');

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_CLASS',
            'description' => "Memperbarui data kelas ID {$id}: {$cls->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Kelas {$cls->name} berhasil diperbarui.",
            'data' => $cls,
        ]);
    }

    public function destroyClass(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $cls = SchoolClass::find($id);
        if (!$cls) {
            return response()->json(['success' => false, 'message' => 'Data kelas tidak ditemukan.'], 404);
        }

        $name = $cls->name;
        $cls->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'SOFT_DELETE_CLASS',
            'description' => "Menghapus kelas ID {$id}: {$name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Kelas {$name} berhasil dihapus.",
        ]);
    }

    // =========================================================================
    // 4. SUBJECTS (MATA PELAJARAN)
    // =========================================================================

    public function indexSubjects(Request $request): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $query = Subject::query()->filter($request->all());

        $allowedSorts = ['id', 'code', 'name', 'group', 'weekly_hours', 'status', 'created_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts) ? $request->input('sort_by') : 'name';
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min(max((int)$request->input('per_page', 8), 1), 100);
        $paginator = $query->paginate($perPage);

        $items = collect($paginator->items())->map(function (Subject $sub) {
            return [
                'id' => $sub->id,
                'code' => $sub->code,
                'name' => $sub->name,
                'group' => $sub->group,
                'grades' => $sub->grades,
                'weekly_hours' => $sub->weekly_hours,
                'weeklyHours' => $sub->weekly_hours,
                'hoursLabel' => "{$sub->weekly_hours} JP",
                'status' => $sub->status,
                'created_at' => $sub->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
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

    public function showSubject(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $sub = Subject::find($id);
        if (!$sub) {
            return response()->json(['success' => false, 'message' => 'Mata pelajaran tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $sub->id,
                'code' => $sub->code,
                'name' => $sub->name,
                'group' => $sub->group,
                'grades' => $sub->grades,
                'weeklyHours' => $sub->weekly_hours,
                'hoursLabel' => "{$sub->weekly_hours} JP",
                'status' => $sub->status,
            ],
        ]);
    }

    public function storeSubject(StoreSubjectRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $sub = Subject::create($validated);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'CREATE_SUBJECT',
            'description' => "Menambahkan mata pelajaran: {$sub->name} (Kode: {$sub->code})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Mata pelajaran {$sub->name} berhasil ditambahkan.",
            'data' => $sub,
        ], 201);
    }

    public function updateSubject(UpdateSubjectRequest $request, int $id): JsonResponse
    {
        $sub = Subject::find($id);
        if (!$sub) {
            return response()->json(['success' => false, 'message' => 'Mata pelajaran tidak ditemukan.'], 404);
        }

        $validated = $request->validated();
        $sub->update($validated);

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'UPDATE_SUBJECT',
            'description' => "Memperbarui mata pelajaran ID {$id}: {$sub->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Mata pelajaran {$sub->name} berhasil diperbarui.",
            'data' => $sub,
        ]);
    }

    public function destroySubject(Request $request, int $id): JsonResponse
    {
        if ($forbidden = $this->checkAdmin($request)) return $forbidden;

        $sub = Subject::find($id);
        if (!$sub) {
            return response()->json(['success' => false, 'message' => 'Mata pelajaran tidak ditemukan.'], 404);
        }

        $name = $sub->name;
        $sub->delete();

        AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'SOFT_DELETE_SUBJECT',
            'description' => "Menghapus mata pelajaran ID {$id}: {$name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Mata pelajaran {$name} berhasil dihapus.",
        ]);
    }
}
