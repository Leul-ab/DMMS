<?php

use App\Http\Controllers\Manager\MenuCategoryController;
use App\Http\Controllers\Manager\MenuItemController;
use App\Http\Controllers\Manager\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:super_admin,manager'])
    ->prefix('manager')
    ->name('manager.')
    ->group(function () {

        // =========================
        // Menu Categories
        // =========================
        Route::get(
            'categories',
            [MenuCategoryController::class, 'index']
        )->name('categories.index');

        Route::get(
            'categories/create',
            [MenuCategoryController::class, 'create']
        )->name('categories.create');

        Route::post(
            'categories',
            [MenuCategoryController::class, 'store']
        )->name('categories.store');

        Route::get(
            'categories/{category}/edit',
            [MenuCategoryController::class, 'edit']
        )->name('categories.edit');

        Route::put(
            'categories/{category}',
            [MenuCategoryController::class, 'update']
        )->name('categories.update');

        Route::delete(
            'categories/{category}',
            [MenuCategoryController::class, 'destroy']
        )->name('categories.destroy');


        // =========================
        // Menu Items
        // =========================
        Route::get(
            'items',
            [MenuItemController::class, 'index']
        )->name('items.index');

        Route::get(
            'items/create',
            [MenuItemController::class, 'create']
        )->name('items.create');

        Route::post(
            'items',
            [MenuItemController::class, 'store']
        )->name('items.store');

        Route::get(
            'items/{item}/edit',
            [MenuItemController::class, 'edit']
        )->name('items.edit');

        Route::put(
            'items/{item}',
            [MenuItemController::class, 'update']
        )->name('items.update');

        Route::delete(
            'items/{item}',
            [MenuItemController::class, 'destroy']
        )->name('items.destroy');

        Route::patch(
            'items/{item}/toggle-availability',
            [MenuItemController::class, 'toggleAvailability']
        )->name('items.toggle-availability');

        Route::patch(
            'items/{item}/price',
            [MenuItemController::class, 'updatePrice']
        )->name('items.update-price');

        Route::post(
            'items/{item}/image',
            [MenuItemController::class, 'uploadImage']
        )->name('items.upload-image');


        // =========================
        // Customer Orders
        // Manager can VIEW only
        // =========================
        Route::get(
            'orders',
            [OrderController::class, 'index']
        )->name('orders.index');

    });