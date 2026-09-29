<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClassMember;
use App\Models\HomeroomAssignment;
use App\Models\SavedReport;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Services\AcademicAuthorizationService;
use App\Services\SavedReportService;
use App\Services\ExcelWorkbookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SavedReportController extends Controller
{
    public function __construct(
        private SavedReportService $reports,
        private AcademicAuthorizationService $authorization,
        private ExcelWorkbookService $workbook,
    ) {}

    private function allowedClassIds(Request $request, int $semesterId): array
    {
        $semester = Semester::findOrFail($semesterId);
        if ($request->user()->hasAnyRole(['admin', 'kepala_sekolah'])) {
            return SchoolClass::where('academic_year_id', $semester->academic_year_id)->pluck('id')->map(fn ($id) => (int) $id)->all();
        }

        return HomeroomAssignment::where('semester_id', $semesterId)
            ->where('teacher_id', $request->user()->teacher?->id)
            ->where('status', 'Aktif')
            ->pluck('class_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function canView(Request $request, SavedReport $report): bool
    {
        return $request->user()->hasAnyRole(['admin', 'kepala_sekolah'])
            || (int) $report->created_by === (int) $request->user()->id
            || in_array((int) $report->class_id, $this->allowedClassIds($request, $report->semester_id), true);
    }

    private function canModify(Request $request, SavedReport $report): bool
    {
        return $request->user()->hasAnyRole(['admin', 'kepala_sekolah'])
            || (int) $report->created_by === (int) $request->user()->id;
    }

    private function serialize(SavedReport $report, bool $includeSnapshot = false): array
    {
        $data = [
            'id' => $report->id,
            'type' => $report->type,
            'type_label' => SavedReportService::TYPES[$report->type] ?? $report->type,
            'title' => $report->title,
            'academic_year_id' => $report->academic_year_id,
            'academic_year_name' => $report->academicYear?->name,
            'semester_id' => $report->semester_id,
            'semester_name' => $report->semester?->name,
            'class_id' => $report->class_id,
            'class_name' => $report->schoolClass?->name,
            'student_id' => $report->student_id,
            'student_name' => $report->student?->name,
            'created_by' => $report->created_by,
            'can_modify' => $this->canModify(request(), $report),
            'creator_name' => $report->creator?->name,
            'notes' => $report->notes,
            'row_count' => $report->snapshot['row_count'] ?? 0,
            'generated_at' => $report->generated_at?->toISOString(),
            'created_at' => $report->created_at?->toISOString(),
        ];
        if ($includeSnapshot) $data['snapshot'] = $report->snapshot;
        return $data;
    }

    public function exportExcel(Request $request, SavedReport $report): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        abort_unless($this->canView($request, $report), 403);
        $snapshot = $report->snapshot ?: [];
        $headers = $snapshot['columns'] ?? [];
        $rows = $snapshot['rows'] ?? [];
        if (!is_array($headers) || !is_array($rows)) abort(422, 'Snapshot laporan tidak valid.');
        return response()->download($this->workbook->write($headers, $rows), "laporan-{$report->id}.xlsx")
            ->deleteFileAfterSend(true);
    }

    public function options(Request $request): JsonResponse
    {
        $data = $request->validate([
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
        ]);
        $semester = Semester::with('academicYear')->findOrFail($data['semester_id']);
        $classIds = $this->allowedClassIds($request, $semester->id);
        $classes = SchoolClass::whereIn('id', $classIds)->orderBy('name')->get(['id', 'name', 'grade']);
        $students = collect();
        if (!empty($data['class_id'])) {
            if (!in_array((int) $data['class_id'], $classIds, true)) {
                return response()->json(['success' => false, 'message' => 'Kelas tidak dapat diakses.'], 403);
            }
            $students = ClassMember::with('student')
                ->where('class_id', $data['class_id'])
                ->where('semester_id', $semester->id)
                ->where('status', 'Aktif')
                ->get()
                ->filter(fn ($member) => $member->student !== null)
                ->map(fn ($member) => [
                    'id' => $member->student_id,
                    'nis' => $member->student->nis,
                    'name' => $member->student->name,
                ])->sortBy('name')->values();
        }
        return response()->json(['success' => true, 'data' => [
            'semester' => ['id' => $semester->id, 'name' => $semester->name, 'academic_year_id' => $semester->academic_year_id, 'academic_year_name' => $semester->academicYear?->name],
            'classes' => $classes,
            'students' => $students,
        ]]);
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mine' => ['nullable', 'boolean'],
            'semester_id' => ['nullable', 'integer', 'exists:semesters,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'type' => ['nullable', Rule::in(array_keys(SavedReportService::TYPES))],
            'search' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = SavedReport::with(['academicYear', 'semester', 'schoolClass', 'student', 'creator'])
            ->orderByDesc('created_at')->orderByDesc('id');
        if ($data['mine'] ?? false) {
            $query->where('created_by', $request->user()->id);
        } elseif (!$request->user()->hasAnyRole(['admin', 'kepala_sekolah'])) {
            $accessibleIds = HomeroomAssignment::where('teacher_id', $request->user()->teacher?->id)
                ->where('status', 'Aktif')
                ->get(['class_id', 'semester_id']);
            $query->where(function ($scoped) use ($request, $accessibleIds) {
                $scoped->where('created_by', $request->user()->id);
                foreach ($accessibleIds as $assignment) {
                    $scoped->orWhere(fn ($pair) => $pair
                        ->where('class_id', $assignment->class_id)
                        ->where('semester_id', $assignment->semester_id));
                }
            });
        }

        foreach (['semester_id', 'class_id', 'type'] as $field) {
            if (!empty($data[$field])) $query->where($field, $data[$field]);
        }
        if (!empty($data['search'])) {
            $term = '%' . trim($data['search']) . '%';
            $query->where(fn ($search) => $search->where('title', 'like', $term)
                ->orWhereHas('schoolClass', fn ($class) => $class->where('name', 'like', $term))
                ->orWhereHas('creator', fn ($creator) => $creator->where('name', 'like', $term)));
        }
        $page = $query->paginate((int) ($data['per_page'] ?? 20));
        return response()->json(['success' => true, 'data' => $page->getCollection()->map(fn ($report) => $this->serialize($report))->values(), 'meta' => [
            'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total(),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(array_keys(SavedReportService::TYPES))],
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'student_id' => ['nullable', 'integer', 'exists:students,id'],
            'title' => ['nullable', 'string', 'max:200'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if (!in_array((int) $data['class_id'], $this->allowedClassIds($request, (int) $data['semester_id']), true)) {
            return response()->json(['success' => false, 'message' => 'Kelas tidak dapat diakses.'], 403);
        }
        [$schoolClass, $semester] = $this->authorization->assertAcademicContext((int) $data['class_id'], (int) $data['semester_id']);
        if ($data['type'] === 'per-siswa') {
            if (empty($data['student_id'])) {
                throw ValidationException::withMessages(['student_id' => ['Pilih siswa untuk laporan per siswa.']]);
            }
            $this->authorization->assertActiveClassMembers($schoolClass->id, $semester->id, [(int) $data['student_id']]);
        } elseif (!empty($data['student_id'])) {
            throw ValidationException::withMessages(['student_id' => ['Siswa hanya dipilih untuk laporan per siswa.']]);
        }

        $title = trim($data['title'] ?? '');
        if ($title === '') $title = SavedReportService::TYPES[$data['type']] . ' - ' . $schoolClass->name . ' - ' . $semester->name;
        $report = DB::transaction(function () use ($data, $title, $schoolClass, $semester, $request) {
            $report = new SavedReport([
                'type' => $data['type'],
                'title' => $title,
                'academic_year_id' => $semester->academic_year_id,
                'semester_id' => $semester->id,
                'class_id' => $schoolClass->id,
                'student_id' => $data['student_id'] ?? null,
                'created_by' => $request->user()->id,
                'notes' => $data['notes'] ?? null,
                'generated_at' => now(),
            ]);
            $report->snapshot = $this->reports->generate($report);
            $report->save();
            return $report;
        });
        return response()->json(['success' => true, 'data' => $this->serialize($report->load(['academicYear', 'semester', 'schoolClass', 'student', 'creator']), true)], 201);
    }

    public function show(Request $request, SavedReport $report): JsonResponse
    {
        if (!$this->canView($request, $report)) return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        return response()->json(['success' => true, 'data' => $this->serialize($report->load(['academicYear', 'semester', 'schoolClass', 'student', 'creator']), true)]);
    }

    public function update(Request $request, SavedReport $report): JsonResponse
    {
        if (!$this->canModify($request, $report)) return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        $data = $request->validate(['title' => ['required', 'string', 'max:200'], 'notes' => ['nullable', 'string', 'max:2000']]);
        $report->update($data);
        return $this->show($request, $report);
    }

    public function refresh(Request $request, SavedReport $report): JsonResponse
    {
        if (!$this->canModify($request, $report)) return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        if (!in_array((int) $report->class_id, $this->allowedClassIds($request, $report->semester_id), true)) {
            return response()->json(['success' => false, 'message' => 'Kelas tidak dapat diakses.'], 403);
        }
        $report->snapshot = $this->reports->generate($report);
        $report->generated_at = now();
        $report->save();
        return $this->show($request, $report);
    }

    public function destroy(Request $request, SavedReport $report): JsonResponse
    {
        if (!$this->canModify($request, $report)) return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        $report->delete();
        return response()->json(['success' => true, 'message' => 'Laporan berhasil dihapus.']);
    }
}
