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

    // Start Preparation Timer
    Route::patch('/orders/{order}/start-preparation', [KitchenDashboardController::class, 'startPreparation'])
        ->name('orders.start-preparation')
        ->middleware('permission:update kitchen');

    // Mark as Ready (Preparing → Ready)
    Route::patch('/orders/{order}/mark-ready', [KitchenDashboardController::class, 'markReady'])
        ->name('orders.mark-ready')
        ->middleware('permission:update kitchen');
});
