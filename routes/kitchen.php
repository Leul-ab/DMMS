<?php

use App\Http\Controllers\Kitchen\KitchenDashboardController;
use App\Http\Controllers\Kitchen\KitchenOrderController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:kitchen_staff'])->prefix('kitchen')->name('kitchen.')->group(function () {

    // Kitchen Dashboard
    Route::get('/dashboard', [KitchenDashboardController::class, 'index'])
        ->name('dashboard');

    // New Orders
    Route::get('/orders/new', [KitchenOrderController::class, 'newOrders'])
        ->name('orders.new');

    // Preparing Orders
    Route::get('/orders/preparing', [KitchenOrderController::class, 'preparing'])
        ->name('orders.preparing');

    // Ready Orders
    Route::get('/orders/ready', [KitchenOrderController::class, 'ready'])
        ->name('orders.ready');

    // Order History
    Route::get('/orders/history', [KitchenOrderController::class, 'history'])
        ->name('orders.history');

    // Update Order Status
    Route::patch('/orders/{order}/status', [KitchenOrderController::class, 'updateStatus'])
        ->name('orders.update-status');
});