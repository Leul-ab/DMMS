<?php

use App\Http\Controllers\SuperAdmin\RestaurantController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:Super Admin'])
    ->prefix('super-admin')
    ->name('super-admin.')
    ->group(function () {
        Route::get('/', fn () => redirect()->route('super-admin.restaurants.index'));

        // Restaurant management
        Route::get('restaurants', [RestaurantController::class, 'index'])->name('restaurants.index');
        Route::get('restaurants/create', [RestaurantController::class, 'create'])->name('restaurants.create');
        Route::post('restaurants', [RestaurantController::class, 'store'])->name('restaurants.store');
        Route::get('restaurants/{restaurant}/edit', [RestaurantController::class, 'edit'])->name('restaurants.edit');
        Route::put('restaurants/{restaurant}', [RestaurantController::class, 'update'])->name('restaurants.update');
        Route::delete('restaurants/{restaurant}', [RestaurantController::class, 'destroy'])->name('restaurants.destroy');
        Route::patch('restaurants/{restaurant}/toggle-status', [RestaurantController::class, 'toggleStatus'])->name('restaurants.toggle-status');
    });
