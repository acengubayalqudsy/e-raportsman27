<?php

use App\Http\Controllers\Api\V1\AcademicController;
use App\Http\Controllers\Api\V1\AssessmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CourseAssignmentController;
use App\Http\Controllers\Api\V1\ExtracurricularController;
use App\Http\Controllers\Api\V1\HomeroomController;
use App\Http\Controllers\Api\V1\ReligionController;
use App\Http\Controllers\Api\V1\RombelMemberController;
use App\Http\Controllers\Api\V1\RoomController;
use App\Http\Controllers\Api\V1\ScheduleController;
use App\Http\Controllers\Api\V1\StudentController;
use App\Http\Controllers\Api\V1\TeacherController;
use App\Http\Controllers\Api\V1\UserController;
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

    // Master Data Siswa Routes
    Route::prefix('master/students')->middleware('auth:sanctum')->group(function () {
        // Read access with row-level ownership: Administrator, Guru, Walikelas
        Route::middleware('role:admin,guru,walikelas')->group(function () {
            Route::get('/', [StudentController::class, 'index']);
            Route::get('/{id}', [StudentController::class, 'show'])->whereNumber('id');
        });

        // Administrative management: Administrator only
        Route::middleware('role:admin')->group(function () {
            Route::get('/stats', [StudentController::class, 'stats']);
            Route::post('/', [StudentController::class, 'store']);
            Route::put('/{id}', [StudentController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [StudentController::class, 'destroy'])->whereNumber('id');
        });
    });

    // Master Data Guru Routes (Protected: Administrator only for Phase 4)
    Route::prefix('master/teachers')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::get('/stats', [TeacherController::class, 'stats']);
        Route::get('/', [TeacherController::class, 'index']);
        Route::get('/{id}', [TeacherController::class, 'show'])->whereNumber('id');
        Route::post('/', [TeacherController::class, 'store']);
        Route::put('/{id}', [TeacherController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [TeacherController::class, 'destroy'])->whereNumber('id');
    });

    // Master Data Ruangan Routes (P1.1)
    foreach (['rooms', 'master/rooms'] as $roomPrefix) {
        Route::prefix($roomPrefix)->middleware(['auth:sanctum', 'role:admin'])->group(function () {
            Route::get('/stats', [RoomController::class, 'stats']);
            Route::get('/options', [RoomController::class, 'options']);
            Route::get('/', [RoomController::class, 'index']);
            Route::get('/{id}', [RoomController::class, 'show'])->whereNumber('id');
            Route::post('/', [RoomController::class, 'store']);
            Route::put('/{id}', [RoomController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [RoomController::class, 'destroy'])->whereNumber('id');
        });
    }

    // Master Data Agama Routes
    foreach (['master/religions', 'master-data/religions'] as $relPrefix) {
        Route::prefix($relPrefix)->middleware('auth:sanctum')->group(function () {
            // Read access: admin, guru, walikelas (for student dropdowns)
            Route::middleware('role:admin,guru,walikelas')->group(function () {
                Route::get('/', [ReligionController::class, 'index']);
                Route::get('/{id}', [ReligionController::class, 'show'])->whereNumber('id');
            });

            // Management: admin only
            Route::middleware('role:admin')->group(function () {
                Route::post('/', [ReligionController::class, 'store']);
                Route::put('/{id}', [ReligionController::class, 'update'])->whereNumber('id');
                Route::patch('/{id}', [ReligionController::class, 'update'])->whereNumber('id');
                Route::patch('/{id}/status', [ReligionController::class, 'updateStatus'])->whereNumber('id');
                Route::patch('/{id}/toggle-status', [ReligionController::class, 'updateStatus'])->whereNumber('id');
                Route::delete('/{id}', [ReligionController::class, 'destroy'])->whereNumber('id');
            });
        });
    }

    // Master Data Ekstrakurikuler Routes
    foreach (['master/extracurriculars', 'master-data/extracurriculars'] as $eksPrefix) {
        Route::prefix($eksPrefix)->middleware('auth:sanctum')->group(function () {
            // Read access: admin, guru, walikelas (for activities & report cards)
            Route::middleware('role:admin,guru,walikelas')->group(function () {
                Route::get('/', [ExtracurricularController::class, 'index']);
                Route::get('/{id}', [ExtracurricularController::class, 'show'])->whereNumber('id');
            });

            // Management: admin only
            Route::middleware('role:admin')->group(function () {
                Route::post('/', [ExtracurricularController::class, 'store']);
                Route::put('/{id}', [ExtracurricularController::class, 'update'])->whereNumber('id');
                Route::patch('/{id}', [ExtracurricularController::class, 'update'])->whereNumber('id');
                Route::patch('/{id}/status', [ExtracurricularController::class, 'updateStatus'])->whereNumber('id');
                Route::patch('/{id}/toggle-status', [ExtracurricularController::class, 'updateStatus'])->whereNumber('id');
                Route::delete('/{id}', [ExtracurricularController::class, 'destroy'])->whereNumber('id');
            });
        });
    }

    // Master Data Pengguna & Role Routes (Protected: Administrator only)
    foreach (['master/users', 'master-data/users'] as $userPrefix) {
        Route::prefix($userPrefix)->middleware(['auth:sanctum', 'role:admin'])->group(function () {
            Route::get('/', [UserController::class, 'index']);
            Route::get('/{id}', [UserController::class, 'show'])->whereNumber('id');
            Route::post('/', [UserController::class, 'store']);
            Route::put('/{id}', [UserController::class, 'update'])->whereNumber('id');
            Route::patch('/{id}', [UserController::class, 'update'])->whereNumber('id');
            Route::patch('/{id}/status', [UserController::class, 'updateStatus'])->whereNumber('id');
            Route::patch('/{id}/toggle-status', [UserController::class, 'updateStatus'])->whereNumber('id');
            Route::delete('/{id}', [UserController::class, 'destroy'])->whereNumber('id');
        });
    }

    foreach (['master/roles', 'master-data/roles'] as $rolePrefix) {
        Route::prefix($rolePrefix)->middleware(['auth:sanctum', 'role:admin'])->group(function () {
            Route::get('/', [UserController::class, 'roles']);
        });
    }

    // Master Data Akademik Routes (Protected: Administrator only for Phase 5A)
    Route::prefix('academic')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        // Years
        Route::get('/years', [AcademicController::class, 'indexYears']);
        Route::get('/years/{id}', [AcademicController::class, 'showYear'])->whereNumber('id');
        Route::post('/years', [AcademicController::class, 'storeYear']);
        Route::put('/years/{id}', [AcademicController::class, 'updateYear'])->whereNumber('id');
        Route::delete('/years/{id}', [AcademicController::class, 'destroyYear'])->whereNumber('id');
        Route::post('/years/{id}/activate', [AcademicController::class, 'activateYear'])->whereNumber('id');

        // Semesters
        Route::get('/semesters', [AcademicController::class, 'indexSemesters']);
        Route::get('/semesters/{id}', [AcademicController::class, 'showSemester'])->whereNumber('id');
        Route::post('/semesters', [AcademicController::class, 'storeSemester']);
        Route::put('/semesters/{id}', [AcademicController::class, 'updateSemester'])->whereNumber('id');
        Route::delete('/semesters/{id}', [AcademicController::class, 'destroySemester'])->whereNumber('id');
        Route::post('/semesters/{id}/activate', [AcademicController::class, 'activateSemester'])->whereNumber('id');

        // Classes
        Route::get('/classes', [AcademicController::class, 'indexClasses']);
        Route::get('/classes/{id}', [AcademicController::class, 'showClass'])->whereNumber('id');
        Route::post('/classes', [AcademicController::class, 'storeClass']);
        Route::put('/classes/{id}', [AcademicController::class, 'updateClass'])->whereNumber('id');
        Route::delete('/classes/{id}', [AcademicController::class, 'destroyClass'])->whereNumber('id');

        // Subjects
        Route::get('/subjects', [AcademicController::class, 'indexSubjects']);
        Route::get('/subjects/{id}', [AcademicController::class, 'showSubject'])->whereNumber('id');
        Route::post('/subjects', [AcademicController::class, 'storeSubject']);
        Route::put('/subjects/{id}', [AcademicController::class, 'updateSubject'])->whereNumber('id');
        Route::delete('/subjects/{id}', [AcademicController::class, 'destroySubject'])->whereNumber('id');

        // 5. Rombel Members (Fase 5B)
        Route::prefix('rombel')->group(function () {
            Route::get('/stats', [RombelMemberController::class, 'stats']);
            Route::get('/members', [RombelMemberController::class, 'indexMembers'])
                ->withoutMiddleware('role:admin')
                ->middleware('role:admin,guru,walikelas');
            Route::get('/available-students', [RombelMemberController::class, 'availableStudents']);
            Route::post('/members', [RombelMemberController::class, 'storeMembers']);
            Route::post('/transfer/{id}', [RombelMemberController::class, 'transferMember'])->whereNumber('id');
            Route::delete('/members/{id}', [RombelMemberController::class, 'destroyMember'])->whereNumber('id');
            Route::get('/sync-preview', [RombelMemberController::class, 'previewSyncInitialClasses']);
            Route::post('/sync-commit', [RombelMemberController::class, 'commitSyncInitialClasses']);
        });

        // 6. Homeroom Assignments (Fase 5B)
        Route::prefix('homeroom')->group(function () {
            Route::get('/stats', [HomeroomController::class, 'stats']);
            Route::get('/assignments', [HomeroomController::class, 'index'])
                ->withoutMiddleware('role:admin')
                ->middleware('role:admin,guru,walikelas');
            Route::get('/assignments/{id}', [HomeroomController::class, 'show'])->whereNumber('id');
            Route::post('/assignments', [HomeroomController::class, 'store']);
            Route::put('/assignments/{id}', [HomeroomController::class, 'update'])->whereNumber('id');
            Route::delete('/assignments/{id}', [HomeroomController::class, 'destroy'])->whereNumber('id');
        });

        // 7. Course Assignments (Fase 5B)
        Route::prefix('course-assignments')->group(function () {
            Route::get('/', [CourseAssignmentController::class, 'index'])
                ->withoutMiddleware('role:admin')
                ->middleware('role:admin,guru');
            Route::get('/stats', [CourseAssignmentController::class, 'stats']);
            Route::get('/{id}', [CourseAssignmentController::class, 'show'])->whereNumber('id');
            Route::post('/', [CourseAssignmentController::class, 'store']);
            Route::put('/{id}', [CourseAssignmentController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [CourseAssignmentController::class, 'destroy'])->whereNumber('id');
        });

        // 8. Schedules / Jadwal Mengajar (P1.1)
        Route::prefix('schedules')->group(function () {
            Route::get('/options', [ScheduleController::class, 'options']);
            Route::get('/', [ScheduleController::class, 'index']);
            Route::get('/{id}', [ScheduleController::class, 'show'])->whereNumber('id');
            Route::post('/', [ScheduleController::class, 'store']);
            Route::put('/{id}', [ScheduleController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [ScheduleController::class, 'destroy'])->whereNumber('id');
        });
    });

    // Schedule routes alias at root /api/v1/schedules
    Route::prefix('schedules')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::get('/options', [ScheduleController::class, 'options']);
        Route::get('/', [ScheduleController::class, 'index']);
        Route::get('/{id}', [ScheduleController::class, 'show'])->whereNumber('id');
        Route::post('/', [ScheduleController::class, 'store']);
        Route::put('/{id}', [ScheduleController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [ScheduleController::class, 'destroy'])->whereNumber('id');
    });

    // ==========================================
    // Assessment & Penilaian Routes (Kurikulum Merdeka)
    // ==========================================
    Route::prefix('assessment')->middleware(['auth:sanctum'])->group(function () {
        Route::get('/context', [AssessmentController::class, 'context']);
        Route::get('/learning-objectives', [AssessmentController::class, 'getLearningObjectives']);
        Route::post('/learning-objectives', [AssessmentController::class, 'storeLearningObjective']);
        Route::get('/assessments', [AssessmentController::class, 'getAssessments']);
        Route::post('/assessments', [AssessmentController::class, 'storeAssessment']);
        Route::get('/gradebook', [AssessmentController::class, 'getGradebook']);
        Route::post('/scores/batch', [AssessmentController::class, 'saveBatchScores']);
        Route::post('/final-grades/calculate', [AssessmentController::class, 'calculateFinalGrades']);
        Route::put('/competencies/batch', [AssessmentController::class, 'updateCompetencyAchievements']);
        Route::get('/class-recap', [AssessmentController::class, 'getClassRecap']);
        Route::get('/validation-status', [AssessmentController::class, 'getValidationStatus']);
        Route::post('/validate-course', [AssessmentController::class, 'validateCourse']);
        Route::post('/unlock-course', [AssessmentController::class, 'unlockCourse']);
        Route::get('/report-card/{studentId}', [AssessmentController::class, 'getReportCard'])->whereNumber('studentId');

        // Supplementary report card data (Wali Kelas & Admin)
        Route::get('/supplementary/{classId}/{semesterId}', [AssessmentController::class, 'getSupplementary'])->whereNumber(['classId', 'semesterId']);
        Route::post('/attendance/batch', [AssessmentController::class, 'saveAttendance']);
        Route::post('/extracurriculars/batch', [AssessmentController::class, 'saveExtracurriculars']);
        Route::post('/cocurriculars/batch', [AssessmentController::class, 'saveCocurriculars']);
        Route::post('/homeroom-notes/batch', [AssessmentController::class, 'saveHomeroomNotes']);
    });

});
