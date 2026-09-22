<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Http\Resources\RoomResource;
use App\Models\AuditLog;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    private function checkAdmin(Request $request): ?JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole('admin')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Admin access required.'], 403);
        }
        return null;
    }

    /**
     * Get paginated rooms.
     */
    public function index(Request $request): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $request->validate([
            'academic_year_id' => ['nullable'],
            'room_type' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:Aktif,Tidak Aktif,Semua Status'],
            'search' => ['nullable', 'string', 'max:100'],
            'sort_by' => ['nullable', 'in:id,code,name,capacity,room_type,status,created_at'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Room::with('academicYear')->filter($request->all());

        $sortBy = $request->input('sort_by', 'name');
        $sortDir = strtolower($request->input('sort_dir')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min(max((int)$request->input('per_page', 10), 1), 100);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => RoomResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'total_pages' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Store new room.
     */
    public function store(StoreRoomRequest $request): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $room = Room::create($request->validated());

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'create_room',
            'description' => "Menambahkan ruangan: {$room->name} ({$room->code})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ruangan berhasil ditambahkan.',
            'data' => new RoomResource($room->load('academicYear')),
        ], 201);
    }

    /**
     * Display specific room.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $room = Room::with('academicYear')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new RoomResource($room),
        ]);
    }

    /**
     * Update room.
     */
    public function update(UpdateRoomRequest $request, int $id): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $room = Room::findOrFail($id);
        $room->update($request->validated());

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'update_room',
            'description' => "Memperbarui ruangan ID {$room->id}: {$room->name} ({$room->code})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ruangan berhasil diperbarui.',
            'data' => new RoomResource($room->load('academicYear')),
        ]);
    }

    /**
     * Delete room (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $room = Room::findOrFail($id);

        // Check if room has active schedules
        $activeSchedulesCount = $room->schedules()->where('status', 'Aktif')->count();
        if ($activeSchedulesCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Ruangan tidak dapat dihapus karena masih digunakan pada {$activeSchedulesCount} jadwal aktif.",
            ], 422);
        }

        $room->delete();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'delete_room',
            'description' => "Menghapus ruangan ID {$id}: {$room->name} ({$room->code})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ruangan berhasil dihapus.',
        ]);
    }

    /**
     * Get rooms summary statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $totalRooms = Room::count();
        $activeRooms = Room::where('status', 'Aktif')->count();
        $totalCapacity = Room::where('status', 'Aktif')->sum('capacity');
        $roomTypes = Room::where('status', 'Aktif')
            ->selectRaw('room_type, count(*) as count')
            ->groupBy('room_type')
            ->pluck('count', 'room_type');

        return response()->json([
            'success' => true,
            'data' => [
                'total_rooms' => $totalRooms,
                'active_rooms' => $activeRooms,
                'total_capacity' => (int)$totalCapacity,
                'class_rooms' => (int)($roomTypes['Kelas'] ?? 0),
                'lab_rooms' => (int)($roomTypes['Laboratorium'] ?? 0),
                'type_counts' => $roomTypes,
            ],
        ]);
    }

    /**
     * Get active rooms as options.
     */
    public function options(Request $request): JsonResponse
    {
        $rooms = Room::where('status', 'Aktif')
            ->orderBy('name', 'asc')
            ->get(['id', 'code', 'name', 'capacity', 'room_type', 'building', 'floor']);

        return response()->json([
            'success' => true,
            'data' => $rooms,
        ]);
    }
}
