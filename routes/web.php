<?php

use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
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
Route::post(
    '/orders/{order}/payment',
    [PaymentController::class, 'submit']
)->name('orders.payment.submit');
Route::post(
    '/orders/{order}/payment/confirm',
    [PaymentController::class, 'confirm']
)->name('orders.payment.confirm');
Route::post(
    '/orders/{order}/add-items',
    [OrderController::class, 'addItems']
)->name('orders.add-items');
Route::post(
    '/orders/{order}/release-table',
    [OrderController::class, 'releaseTable']
)->name('orders.release-table');

// API routes
Route::middleware(['auth'])->group(function () {
    Route::get('/api/tables', [App\Http\Controllers\Api\TableController::class, 'index']);
});

// Order count API (no auth required for customer-facing)
Route::get('/api/order-count', [OrderController::class, 'getOrderCount']);

// Customer order details API (no auth required)
Route::get('/api/orders/{order}', [App\Http\Controllers\Api\OrderApiController::class, 'show']);
