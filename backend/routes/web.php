<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\ExcelController;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware('auth')->group(function () {
    Route::get('/excel/microsoft/connect', [ExcelController::class, 'microsoftConnect']);
    Route::get('/excel/microsoft/callback', [ExcelController::class, 'microsoftCallback'])
        ->name('excel.microsoft.callback');
});
