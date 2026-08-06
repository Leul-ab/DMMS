<?php

use App\Http\Controllers\FeedbackController;
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

// =========================
// Customer Feedback
// =========================
Route::get(
    '/customer/orders/{order}/feedback',
    [FeedbackController::class, 'create']
)->name('customer.feedback.create');

Route::post(
    '/customer/orders/{order}/feedback',
    [FeedbackController::class, 'store']
)->name('customer.feedback.store');

Route::get(
    '/customer/orders/{order}/feedback/view',
    [FeedbackController::class, 'show']
)->name('customer.feedback.view');
