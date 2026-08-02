<?php

use App\Http\Controllers\Manager\MenuCategoryController;
use App\Http\Controllers\Manager\MenuItemController;
use App\Http\Controllers\Manager\OrderController;
use App\Http\Controllers\Manager\CustomerController;
use App\Http\Controllers\Manager\RestaurantTableController;
use App\Http\Controllers\Manager\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])
    ->prefix('manager')
    ->name('manager.')
    ->group(function () {

        // =========================
        // Menu Categories
        // =========================
        Route::get(
            'categories',
            [MenuCategoryController::class, 'index']
        )->name('categories.index')->middleware('permission:view menu categories');

        Route::get(
            'categories/create',
            [MenuCategoryController::class, 'create']
        )->name('categories.create')->middleware('permission:create menu categories');

        Route::post(
            'categories',
            [MenuCategoryController::class, 'store']
        )->name('categories.store')->middleware('permission:create menu categories');

        Route::get(
            'categories/{category}/edit',
            [MenuCategoryController::class, 'edit']
        )->name('categories.edit')->middleware('permission:update menu categories');

        Route::put(
            'categories/{category}',
            [MenuCategoryController::class, 'update']
        )->name('categories.update')->middleware('permission:update menu categories');

        Route::delete(
            'categories/{category}',
            [MenuCategoryController::class, 'destroy']
        )->name('categories.destroy')->middleware('permission:delete menu categories');

        Route::patch(
            'categories/{category}/toggle-status',
            [MenuCategoryController::class, 'toggleStatus']
        )->name('categories.toggle-status')->middleware('permission:status menu categories');


        // =========================
        // Menu Items
        // =========================
        Route::get(
            'items',
            [MenuItemController::class, 'index']
        )->name('items.index')->middleware('permission:view menu items');

        Route::get(
            'items/create',
            [MenuItemController::class, 'create']
        )->name('items.create')->middleware('permission:create menu items');

        Route::post(
            'items',
            [MenuItemController::class, 'store']
        )->name('items.store')->middleware('permission:create menu items');

        Route::get(
            'items/{item}/edit',
            [MenuItemController::class, 'edit']
        )->name('items.edit')->middleware('permission:update menu items');

        Route::put(
            'items/{item}',
            [MenuItemController::class, 'update']
        )->name('items.update')->middleware('permission:update menu items');

        Route::delete(
            'items/{item}',
            [MenuItemController::class, 'destroy']
        )->name('items.destroy')->middleware('permission:delete menu items');

        Route::patch(
            'items/{item}/toggle-availability',
            [MenuItemController::class, 'toggleAvailability']
        )->name('items.toggle-availability')->middleware('permission:status menu items');

        Route::patch(
            'items/{item}/price',
            [MenuItemController::class, 'updatePrice']
        )->name('items.update-price')->middleware('permission:update menu items');

        Route::post(
            'items/{item}/image',
            [MenuItemController::class, 'uploadImage']
        )->name('items.upload-image')->middleware('permission:update menu items');


        // =========================
        // Customer Orders
        // Manager can VIEW, EDIT,
        // DELETE and VERIFY PAYMENTS
        // =========================

        Route::get(
            'orders',
            [OrderController::class, 'index']
        )->name('orders.index')->middleware('permission:view orders');

        Route::put(
            'orders/{order}',
            [OrderController::class, 'update']
        )->name('orders.update')->middleware('permission:update orders');

        Route::delete(
            'orders/{order}',
            [OrderController::class, 'destroy']
        )->name('orders.destroy')->middleware('permission:delete orders');

        Route::patch(
            'orders/{order}/verify-payment',
            [OrderController::class, 'verifyPayment']
        )->name('orders.verify-payment')->middleware('permission:status orders');

        // =========================
        // Restaurant Tables
        // =========================
        Route::get(
            'tables',
            [RestaurantTableController::class, 'index']
        )->name('tables.index')->middleware('permission:view tables');

        Route::get(
            'tables/create',
            [RestaurantTableController::class, 'create']
        )->name('tables.create')->middleware('permission:create tables');

        Route::post(
            'tables',
            [RestaurantTableController::class, 'store']
        )->name('tables.store')->middleware('permission:create tables');

        Route::get(
            'tables/{table}/edit',
            [RestaurantTableController::class, 'edit']
        )->name('tables.edit')->middleware('permission:update tables');

        Route::put(
            'tables/{table}',
            [RestaurantTableController::class, 'update']
        )->name('tables.update')->middleware('permission:update tables');

        Route::delete(
            'tables/{table}',
            [RestaurantTableController::class, 'destroy']
        )->name('tables.destroy')->middleware('permission:delete tables');

        Route::patch(
            'tables/{table}/toggle-status',
            [RestaurantTableController::class, 'toggleStatus']
        )->name('tables.toggle-status')->middleware('permission:status tables');

        Route::post(
            'tables/{table}/regenerate-qr',
            [RestaurantTableController::class, 'regenerateQr']
        )->name('tables.regenerate-qr')->middleware('permission:update tables');


        // =========================
        // Customers CRUD
        // =========================
        Route::get(
            'customers',
            [CustomerController::class, 'index']
        )->name('customers.index')->middleware('permission:view customers');

        Route::get(
            'customers/create',
            [CustomerController::class, 'create']
        )->name('customers.create')->middleware('permission:create customers');

        Route::post(
            'customers',
            [CustomerController::class, 'store']
        )->name('customers.store')->middleware('permission:create customers');

        Route::get(
            'customers/{customer}/edit',
            [CustomerController::class, 'edit']
        )->name('customers.edit')->middleware('permission:update customers');

        Route::put(
            'customers/{customer}',
            [CustomerController::class, 'update']
        )->name('customers.update')->middleware('permission:update customers');

        Route::delete(
            'customers/{customer}',
            [CustomerController::class, 'destroy']
        )->name('customers.destroy')->middleware('permission:delete customers');

        Route::patch(
            'customers/{customer}/toggle-membership',
            [CustomerController::class, 'toggleMembership']
        )->name('customers.toggle-membership')->middleware('permission:status customers');

        // =========================
        // Reports
        // =========================
        Route::get(
            'reports',
            [ReportController::class, 'index']
        )->name('reports.index')->middleware('permission:view reports');

        // =========================
        // Booking Management
        // =========================
        Route::get(
            'bookings',
            [
                \App\Http\Controllers\Manager\BookingManagementController::class,
                'index'
            ]
        )->name('bookings.index')->middleware('permission:view bookings');

        Route::post(
            'bookings/{booking}/cancel',
            [
                \App\Http\Controllers\Manager\BookingManagementController::class,
                'cancel'
            ]
        )->name('bookings.cancel')->middleware('permission:status bookings');

        Route::post(
            'bookings/{booking}/complete',
            [
                \App\Http\Controllers\Manager\BookingManagementController::class,
                'complete'
            ]
        )->name('bookings.complete')->middleware('permission:status bookings');

        Route::delete(
            'bookings/{booking}',
            [
                \App\Http\Controllers\Manager\BookingManagementController::class,
                'destroy'
            ]
        )->name('bookings.destroy')->middleware('permission:delete bookings');

    });
