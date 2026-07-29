<?php

use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

// Customer order route
Route::post('/orders', [OrderController::class, 'store'])
    ->name('orders.store');

Route::post(
    '/orders/{order}/payment',
    [App\Http\Controllers\PaymentController::class, 'submit']
)->name('orders.payment.submit');

Route::post(
    '/api/orders/{order}/cancel',
    [OrderController::class, 'cancel']
)->name('orders.cancel');

// API: Get active order count for a customer or table
Route::get('/api/orders/count', [OrderController::class, 'getOrderCount']);

// API: Add items to existing order
Route::post('/api/orders/{order}/add-items', [OrderController::class, 'addItems']);

// API: Release table
Route::post('/api/orders/{order}/release-table', [OrderController::class, 'releaseTable']);
