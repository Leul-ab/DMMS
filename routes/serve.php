<?php

use App\Http\Controllers\Serve\ServeController;
use Illuminate\Support\Facades\Route;

Route::prefix('serve')->name('serve.')->middleware(['auth'])->group(function () {

    // Serve Orders (ready orders awaiting delivery to the table)
    Route::get('/', [ServeController::class, 'index'])
        ->name('index')
        ->middleware('permission:view serve');

    // Served History (orders completed by the current user)
    Route::get('/history', [ServeController::class, 'history'])
        ->name('history')
        ->middleware('permission:view serve');

    // Complete Order (Ready → Completed)
    Route::patch('/orders/{order}/complete', [ServeController::class, 'completeOrder'])
        ->name('orders.complete')
        ->middleware('permission:update serve');
});
