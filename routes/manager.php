<?php

use App\Http\Controllers\Manager\BranchContextController;
use App\Http\Controllers\Manager\BranchController;
use App\Http\Controllers\Manager\BookingManagementController;
use App\Http\Controllers\Manager\CustomerController;
use App\Http\Controllers\Manager\MenuCategoryController;
use App\Http\Controllers\Manager\MenuItemController;
use App\Http\Controllers\Manager\OrderController;
use App\Http\Controllers\Manager\ReportController;
use App\Http\Controllers\Manager\RestaurantTableController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:super_admin'])
    ->prefix('manager')
    ->name('manager.')
    ->group(function () {
        // Admin-only branch CRUD
        Route::get(
            'branches',
            [BranchController::class, 'index']
        )->name('branches.index');

        Route::get(
            'branches/create',
            [BranchController::class, 'create']
        )->name('branches.create');

        Route::post(
            'branches',
            [BranchController::class, 'store']
        )->name('branches.store');

        Route::get(
            'branches/{branch}',
            [BranchController::class, 'show']
        )->name('branches.show');

        Route::get(
            'branches/{branch}/edit',
            [BranchController::class, 'edit']
        )->name('branches.edit');

        Route::put(
            'branches/{branch}',
            [BranchController::class, 'update']
        )->name('branches.update');

        Route::delete(
            'branches/{branch}',
            [BranchController::class, 'destroy']
        )->name('branches.destroy');
    });

Route::middleware(['auth', 'role:super_admin,manager'])
    ->prefix('manager')
    ->name('manager.')
    ->group(function () {

        // =========================
        // Branch Context
        // =========================
        // Switch the currently selected branch

        Route::post(
            'branches/switch',
            [BranchContextController::class, 'switch']
        )->name('branches.switch');


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

        Route::patch(
            'categories/{category}/toggle-status',
            [MenuCategoryController::class, 'toggleStatus']
        )->name('categories.toggle-status');


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
        // =========================

        Route::get(
            'orders',
            [OrderController::class, 'index']
        )->name('orders.index');

        Route::put(
            'orders/{order}',
            [OrderController::class, 'update']
        )->name('orders.update');

        Route::delete(
            'orders/{order}',
            [OrderController::class, 'destroy']
        )->name('orders.destroy');

        Route::patch(
            'orders/{order}/verify-payment',
            [OrderController::class, 'verifyPayment']
        )->name('orders.verify-payment');


        // =========================
        // Restaurant Tables
        // =========================

        Route::get(
            'tables',
            [RestaurantTableController::class, 'index']
        )->name('tables.index');

        Route::get(
            'tables/create',
            [RestaurantTableController::class, 'create']
        )->name('tables.create');

        Route::post(
            'tables',
            [RestaurantTableController::class, 'store']
        )->name('tables.store');

        Route::get(
            'tables/{table}/edit',
            [RestaurantTableController::class, 'edit']
        )->name('tables.edit');

        Route::put(
            'tables/{table}',
            [RestaurantTableController::class, 'update']
        )->name('tables.update');

        Route::delete(
            'tables/{table}',
            [RestaurantTableController::class, 'destroy']
        )->name('tables.destroy');

        Route::patch(
            'tables/{table}/toggle-status',
            [RestaurantTableController::class, 'toggleStatus']
        )->name('tables.toggle-status');


        // =========================
        // Customers CRUD
        // =========================

        Route::get(
            'customers',
            [CustomerController::class, 'index']
        )->name('customers.index');

        Route::get(
            'customers/create',
            [CustomerController::class, 'create']
        )->name('customers.create');

        Route::post(
            'customers',
            [CustomerController::class, 'store']
        )->name('customers.store');

        Route::get(
            'customers/{customer}/edit',
            [CustomerController::class, 'edit']
        )->name('customers.edit');

        Route::put(
            'customers/{customer}',
            [CustomerController::class, 'update']
        )->name('customers.update');

        Route::delete(
            'customers/{customer}',
            [CustomerController::class, 'destroy']
        )->name('customers.destroy');

        Route::patch(
            'customers/{customer}/toggle-membership',
            [CustomerController::class, 'toggleMembership']
        )->name('customers.toggle-membership');


        // =========================
        // Reports
        // =========================

        Route::get(
            'reports',
            [ReportController::class, 'index']
        )->name('reports.index');


        // =========================
        // Booking Management
        // =========================

        Route::get(
            'bookings',
            [BookingManagementController::class, 'index']
        )->name('bookings.index');

        Route::post(
            'bookings/{booking}/cancel',
            [BookingManagementController::class, 'cancel']
        )->name('bookings.cancel');

        Route::post(
            'bookings/{booking}/complete',
            [BookingManagementController::class, 'complete']
        )->name('bookings.complete');

        Route::delete(
            'bookings/{booking}',
            [BookingManagementController::class, 'destroy']
        )->name('bookings.destroy');

    });
