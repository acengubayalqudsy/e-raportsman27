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

});
