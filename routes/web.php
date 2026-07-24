<?php

use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
require __DIR__.'/manager.php';
require __DIR__.'/menu.php';
require __DIR__.'/booking.php';
require __DIR__.'/kitchen.php';

// Customer order route
Route::post('/orders', [OrderController::class, 'store'])
    ->name('orders.store');

// API routes
Route::middleware(['auth'])->group(function () {
    Route::get('/api/tables', [App\Http\Controllers\Api\TableController::class, 'index']);
});
