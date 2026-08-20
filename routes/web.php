<?php

use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('LandingPage');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard')
        ->middleware('permission:view dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
require __DIR__.'/manager.php';
require __DIR__.'/menu.php';
require __DIR__.'/booking.php';
require __DIR__.'/kitchen.php';
require __DIR__.'/serve.php';

require __DIR__.'/orders.php';

// API routes
Route::middleware(['auth'])->group(function () {
    Route::get(
        '/api/tables',
        [TableController::class, 'index']
    );
});
