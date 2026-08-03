<?php

use App\Http\Controllers\Kitchen\KitchenDashboardController;
use Illuminate\Support\Facades\Route;

Route::prefix('kitchen')->name('kitchen.')->middleware(['auth'])->group(function () {

    // Kitchen Dashboard
    Route::get('/dashboard', [KitchenDashboardController::class, 'index'])
        ->name('dashboard')
        ->middleware('permission:view kitchen');

    // Accept Order (Pending → Preparing)
    Route::patch('/orders/{order}/accept', [KitchenDashboardController::class, 'acceptOrder'])
        ->name('orders.accept')
        ->middleware('permission:update kitchen');

    // Update Estimated Time (for customer sync before timer starts)
    Route::patch('/orders/{order}/update-estimated-time', [KitchenDashboardController::class, 'updateEstimatedTime'])
        ->name('orders.update-estimated-time')
        ->middleware('permission:update kitchen');

    // Start Preparation Timer
    Route::patch('/orders/{order}/start-preparation', [KitchenDashboardController::class, 'startPreparation'])
        ->name('orders.start-preparation')
        ->middleware('permission:update kitchen');

    // Add Additional Preparation Time
    Route::patch('/orders/{order}/add-time', [KitchenDashboardController::class, 'addTime'])
        ->name('orders.add-time')
        ->middleware('permission:update kitchen');

    // Mark as Ready (Preparing → Ready)
    Route::patch('/orders/{order}/mark-ready', [KitchenDashboardController::class, 'markReady'])
        ->name('orders.mark-ready')
        ->middleware('permission:update kitchen');

    // Complete Order (Ready → Completed)
    Route::patch('/orders/{order}/complete', [KitchenDashboardController::class, 'completeOrder'])
        ->name('orders.complete')
        ->middleware('permission:update kitchen');
});
