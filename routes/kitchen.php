<?php

use App\Http\Controllers\Kitchen\KitchenDashboardController;
use App\Http\Controllers\Kitchen\KitchenOrderController;
use Illuminate\Support\Facades\Route;

Route::prefix('kitchen')->name('kitchen.')->group(function () {

    // Kitchen Dashboard
    Route::get('/dashboard', [
        KitchenDashboardController::class,
        'index'
    ])->name('dashboard');

    // Active Orders
    Route::get('/orders/new', [
        KitchenOrderController::class,
        'newOrders'
    ])->name('orders.new');

    // Order History
    Route::get('/orders/history', [
        KitchenOrderController::class,
        'history'
    ])->name('orders.history');

    // Update Order Status
    Route::patch('/orders/{order}/status', [
        KitchenOrderController::class,
        'updateStatus'
    ])->name('orders.update-status');

});