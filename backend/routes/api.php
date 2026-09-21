<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - E-Raport SMAN 27 Garut (v1)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Authentication Routes
    Route::prefix('auth')->group(function () {
        // Public endpoint
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

        // Protected endpoints
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);

            // Role authorization test endpoints
            Route::get('/test-role-admin', [AuthController::class, 'testAdmin'])->middleware('role:admin');
            Route::get('/test-role-guru', [AuthController::class, 'testGuru'])->middleware('role:guru');
        });
    });

    // Master Data Siswa Routes (Protected: Administrator only for Phase 3B)
    Route::prefix('master/students')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\V1\StudentController::class, 'stats']);
        Route::get('/', [\App\Http\Controllers\Api\V1\StudentController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\V1\StudentController::class, 'show'])->whereNumber('id');
        Route::post('/', [\App\Http\Controllers\Api\V1\StudentController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\Api\V1\StudentController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [\App\Http\Controllers\Api\V1\StudentController::class, 'destroy'])->whereNumber('id');
    });

    // Master Data Guru Routes (Protected: Administrator only for Phase 4)
    Route::prefix('master/teachers')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\V1\TeacherController::class, 'stats']);
        Route::get('/', [\App\Http\Controllers\Api\V1\TeacherController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\V1\TeacherController::class, 'show'])->whereNumber('id');
        Route::post('/', [\App\Http\Controllers\Api\V1\TeacherController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\Api\V1\TeacherController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [\App\Http\Controllers\Api\V1\TeacherController::class, 'destroy'])->whereNumber('id');
    });

    // Master Data Ruangan Routes (P1.1)
    foreach (['rooms', 'master/rooms'] as $roomPrefix) {
        Route::prefix($roomPrefix)->middleware(['auth:sanctum', 'role:admin'])->group(function () {
            Route::get('/stats', [\App\Http\Controllers\Api\V1\RoomController::class, 'stats']);
            Route::get('/options', [\App\Http\Controllers\Api\V1\RoomController::class, 'options']);
            Route::get('/', [\App\Http\Controllers\Api\V1\RoomController::class, 'index']);
            Route::get('/{id}', [\App\Http\Controllers\Api\V1\RoomController::class, 'show'])->whereNumber('id');
            Route::post('/', [\App\Http\Controllers\Api\V1\RoomController::class, 'store']);
            Route::put('/{id}', [\App\Http\Controllers\Api\V1\RoomController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [\App\Http\Controllers\Api\V1\RoomController::class, 'destroy'])->whereNumber('id');
        });
    }

    // Master Data Akademik Routes (Protected: Administrator only for Phase 5A)
    Route::prefix('academic')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        // Years
        Route::get('/years', [\App\Http\Controllers\Api\V1\AcademicController::class, 'indexYears']);
        Route::get('/years/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'showYear'])->whereNumber('id');
        Route::post('/years', [\App\Http\Controllers\Api\V1\AcademicController::class, 'storeYear']);
        Route::put('/years/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'updateYear'])->whereNumber('id');
        Route::delete('/years/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'destroyYear'])->whereNumber('id');
        Route::post('/years/{id}/activate', [\App\Http\Controllers\Api\V1\AcademicController::class, 'activateYear'])->whereNumber('id');

        // Semesters
        Route::get('/semesters', [\App\Http\Controllers\Api\V1\AcademicController::class, 'indexSemesters']);
        Route::get('/semesters/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'showSemester'])->whereNumber('id');
        Route::post('/semesters', [\App\Http\Controllers\Api\V1\AcademicController::class, 'storeSemester']);
        Route::put('/semesters/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'updateSemester'])->whereNumber('id');
        Route::delete('/semesters/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'destroySemester'])->whereNumber('id');
        Route::post('/semesters/{id}/activate', [\App\Http\Controllers\Api\V1\AcademicController::class, 'activateSemester'])->whereNumber('id');

        // Classes
        Route::get('/classes', [\App\Http\Controllers\Api\V1\AcademicController::class, 'indexClasses']);
        Route::get('/classes/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'showClass'])->whereNumber('id');
        Route::post('/classes', [\App\Http\Controllers\Api\V1\AcademicController::class, 'storeClass']);
        Route::put('/classes/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'updateClass'])->whereNumber('id');
        Route::delete('/classes/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'destroyClass'])->whereNumber('id');

        // Subjects
        Route::get('/subjects', [\App\Http\Controllers\Api\V1\AcademicController::class, 'indexSubjects']);
        Route::get('/subjects/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'showSubject'])->whereNumber('id');
        Route::post('/subjects', [\App\Http\Controllers\Api\V1\AcademicController::class, 'storeSubject']);
        Route::put('/subjects/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'updateSubject'])->whereNumber('id');
        Route::delete('/subjects/{id}', [\App\Http\Controllers\Api\V1\AcademicController::class, 'destroySubject'])->whereNumber('id');

        // 5. Rombel Members (Fase 5B)
        Route::prefix('rombel')->group(function () {
            Route::get('/stats', [\App\Http\Controllers\Api\V1\RombelMemberController::class, 'stats']);
            Route::get('/members', [\App\Http\Controllers\Api\V1\RombelMemberController::class, 'indexMembers']);
            Route::get('/available-students', [\App\Http\Controllers\Api\V1\RombelMemberController::class, 'availableStudents']);
            Route::post('/members', [\App\Http\Controllers\Api\V1\RombelMemberController::class, 'storeMembers']);
            Route::post('/transfer/{id}', [\App\Http\Controllers\Api\V1\RombelMemberController::class, 'transferMember'])->whereNumber('id');
            Route::delete('/members/{id}', [\App\Http\Controllers\Api\V1\RombelMemberController::class, 'destroyMember'])->whereNumber('id');
            Route::get('/sync-preview', [\App\Http\Controllers\Api\V1\RombelMemberController::class, 'previewSyncInitialClasses']);
            Route::post('/sync-commit', [\App\Http\Controllers\Api\V1\RombelMemberController::class, 'commitSyncInitialClasses']);
        });

        // 6. Homeroom Assignments (Fase 5B)
        Route::prefix('homeroom')->group(function () {
            Route::get('/stats', [\App\Http\Controllers\Api\V1\HomeroomController::class, 'stats']);
            Route::get('/assignments', [\App\Http\Controllers\Api\V1\HomeroomController::class, 'index']);
            Route::get('/assignments/{id}', [\App\Http\Controllers\Api\V1\HomeroomController::class, 'show'])->whereNumber('id');
            Route::post('/assignments', [\App\Http\Controllers\Api\V1\HomeroomController::class, 'store']);
            Route::put('/assignments/{id}', [\App\Http\Controllers\Api\V1\HomeroomController::class, 'update'])->whereNumber('id');
            Route::delete('/assignments/{id}', [\App\Http\Controllers\Api\V1\HomeroomController::class, 'destroy'])->whereNumber('id');
        });

        // 7. Course Assignments (Fase 5B)
        Route::prefix('course-assignments')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\V1\CourseAssignmentController::class, 'index']);
            Route::get('/stats', [\App\Http\Controllers\Api\V1\CourseAssignmentController::class, 'stats']);
            Route::get('/{id}', [\App\Http\Controllers\Api\V1\CourseAssignmentController::class, 'show'])->whereNumber('id');
            Route::post('/', [\App\Http\Controllers\Api\V1\CourseAssignmentController::class, 'store']);
            Route::put('/{id}', [\App\Http\Controllers\Api\V1\CourseAssignmentController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [\App\Http\Controllers\Api\V1\CourseAssignmentController::class, 'destroy'])->whereNumber('id');
        });

        // 8. Schedules / Jadwal Mengajar (P1.1)
        Route::prefix('schedules')->group(function () {
            Route::get('/options', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'options']);
            Route::get('/', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'index']);
            Route::get('/{id}', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'show'])->whereNumber('id');
            Route::post('/', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'store']);
            Route::put('/{id}', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'destroy'])->whereNumber('id');
        });
    });

    // Schedule routes alias at root /api/v1/schedules
    Route::prefix('schedules')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::get('/options', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'options']);
        Route::get('/', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'show'])->whereNumber('id');
        Route::post('/', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [\App\Http\Controllers\Api\V1\ScheduleController::class, 'destroy'])->whereNumber('id');
    });

});
