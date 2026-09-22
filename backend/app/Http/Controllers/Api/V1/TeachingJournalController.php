<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeachingJournalRequest;
use App\Http\Requests\UpdateTeachingJournalRequest;
use App\Http\Resources\TeachingJournalResource;
use App\Models\TeachingJournal;
use App\Services\TeachingJournalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeachingJournalController extends Controller
{
    public function __construct(private TeachingJournalService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'academic_year_id' => ['nullable', 'integer', 'exists:academic_years,id'],
            'semester_id' => ['nullable', 'integer', 'exists:semesters,id'],
            'class_id' => ['nullable', 'integer', 'exists:classes,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:teachers,id'],
            'status' => ['nullable', 'in:Lengkap,Belum Lengkap,Perlu Diperiksa'],
            'date_from' => ['nullable', 'date'], 'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $paginator = $this->service->query($request->user(), $request->all())
            ->paginate((int) $request->input('per_page', 15));
        return response()->json([
            'success' => true,
            'data' => TeachingJournalResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(), 'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $journal = TeachingJournal::with(['academicYear', 'semester', 'schoolClass', 'subject', 'teacher'])
            ->findOrFail($id);
        if (!$request->user()->hasRole('admin') && (int) $journal->teacher_id !== (int) $request->user()->teacher?->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }
        return response()->json(['success' => true, 'data' => new TeachingJournalResource($journal)]);
    }

    public function store(StoreTeachingJournalRequest $request): JsonResponse
    {
        $journal = $this->service->create($request->user(), $request->validated());
        return response()->json(['success' => true, 'data' => new TeachingJournalResource($journal)], 201);
    }

    public function update(UpdateTeachingJournalRequest $request, int $id): JsonResponse
    {
        $journal = TeachingJournal::findOrFail($id);
        if (!$request->user()->hasRole('admin') && (int) $journal->teacher_id !== (int) $request->user()->teacher?->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }
        $journal = $this->service->update($request->user(), $journal, $request->validated());
        return response()->json(['success' => true, 'data' => new TeachingJournalResource($journal)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $journal = TeachingJournal::findOrFail($id);
        if (!$request->user()->hasRole('admin') && (int) $journal->teacher_id !== (int) $request->user()->teacher?->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }
        $journal->delete();
        return response()->json(['success' => true, 'message' => 'Jurnal berhasil dihapus.']);
    }
}
