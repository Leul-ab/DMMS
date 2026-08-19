<?php

use App\Http\Controllers\Manager\BookingManagementController;
use App\Http\Controllers\Manager\CustomerController;
use App\Http\Controllers\Manager\DiscountController;
use App\Http\Controllers\Manager\MenuCategoryController;
use App\Http\Controllers\Manager\MenuItemController;
use App\Http\Controllers\Manager\OrderController;
use App\Http\Controllers\Manager\PaymentVerificationController;
use App\Http\Controllers\Manager\ReportController;
use App\Http\Controllers\Manager\RestaurantTableController;
use App\Http\Controllers\Manager\TableSectionController;
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
        // and DELETE orders
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

        // =========================
        // Payment Verification
        // =========================

        Route::get(
            'payment-verification',
            [PaymentVerificationController::class, 'index']
        )->name('payment-verification.index')->middleware('permission:view payments');

        Route::patch(
            'payment-verification/{order}/verify',
            [PaymentVerificationController::class, 'verify']
        )->name('payment-verification.verify')->middleware('permission:status payments');

        Route::patch(
            'payment-verification/{order}/reject',
            [PaymentVerificationController::class, 'reject']
        )->name('payment-verification.reject')->middleware('permission:status payments');

        Route::patch(
            'payment-verification/extensions/{payment}/verify',
            [PaymentVerificationController::class, 'verifyExtension']
        )->name('payment-verification.extension.verify')->middleware('permission:status payments');

        Route::patch(
            'payment-verification/extensions/{payment}/reject',
            [PaymentVerificationController::class, 'rejectExtension']
        )->name('payment-verification.extension.reject')->middleware('permission:status payments');

        // =========================
        // Booking Verification
        // =========================

        Route::get(
            'booking-verification',
            [PaymentVerificationController::class, 'bookingVerification']
        )->name('booking-verification.index')->middleware('permission:view payments');

        Route::post(
            'booking-verification/{notification}/verify',
            [PaymentVerificationController::class, 'verifyBooking']
        )->name('booking-verification.verify')->middleware('permission:status payments');

        Route::post(
            'booking-verification/{notification}/reject',
            [PaymentVerificationController::class, 'rejectBooking']
        )->name('booking-verification.reject')->middleware('permission:status payments');

        // =========================
        // Booking Payment
        // =========================

        Route::get(
            'booking-payment',
            [PaymentVerificationController::class, 'bookingPayment']
        )->name('booking-payment.index')->middleware('permission:view payments');

        Route::get(
            'booking-payment/{notification}',
            [PaymentVerificationController::class, 'showBookingPayment']
        )->name('booking-payment.show')->middleware('permission:view payments');

        Route::patch(
            'booking-payment/{notification}/approve',
            [PaymentVerificationController::class, 'approveBookingPayment']
        )->name('booking-payment.approve')->middleware('permission:status payments');

        Route::patch(
            'booking-payment/{notification}/reject',
            [PaymentVerificationController::class, 'rejectBookingPayment']
        )->name('booking-payment.reject')->middleware('permission:status payments');

        Route::get(
            'booking-payment/notifications/{notification}/read',
            [PaymentVerificationController::class, 'markNotificationRead']
        )->name('booking-payment.notifications.read')->middleware('permission:status payments');

        Route::get(
            'booking-payment/{notification}/screenshot',
            [PaymentVerificationController::class, 'viewScreenshot']
        )->name('booking-payment.screenshot')->middleware('permission:view payments');

        Route::get(
            'verification-count',
            [PaymentVerificationController::class, 'verificationCount']
        )->name('verification-count');

        // =========================
        // Table Sections
        // =========================
        Route::get(
            'table-sections',
            [TableSectionController::class, 'index']
        )->name('table-sections.index')->middleware('permission:view tables');

        Route::post(
            'table-sections',
            [TableSectionController::class, 'store']
        )->name('table-sections.store')->middleware('permission:create tables');

        Route::get(
            'table-sections/{section}/edit',
            [TableSectionController::class, 'edit']
        )->name('table-sections.edit')->middleware('permission:update tables');

        Route::put(
            'table-sections/{section}',
            [TableSectionController::class, 'update']
        )->name('table-sections.update')->middleware('permission:update tables');

        Route::delete(
            'table-sections/{section}',
            [TableSectionController::class, 'destroy']
        )->name('table-sections.destroy')->middleware('permission:delete tables');

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
                BookingManagementController::class,
                'index',
            ]
        )->name('bookings.index')->middleware('permission:view bookings');

        Route::post(
            'bookings/{booking}/cancel',
            [
                BookingManagementController::class,
                'cancel',
            ]
        )->name('bookings.cancel')->middleware('permission:status bookings');

        Route::post(
            'bookings/{booking}/complete',
            [
                BookingManagementController::class,
                'complete',
            ]
        )->name('bookings.complete')->middleware('permission:status bookings');

        Route::delete(
            'bookings/{booking}',
            [
                BookingManagementController::class,
                'destroy',
            ]
        )->name('bookings.destroy')->middleware('permission:delete bookings');

        // =========================
        // Discounts
        // =========================
        Route::get(
            'discounts',
            [DiscountController::class, 'index']
        )->name('discounts.index')->middleware('permission:view discounts');

        Route::get(
            'discounts/create',
            [DiscountController::class, 'create']
        )->name('discounts.create')->middleware('permission:create discounts');

        Route::post(
            'discounts',
            [DiscountController::class, 'store']
        )->name('discounts.store')->middleware('permission:create discounts');

        Route::get(
            'discounts/{discount}/edit',
            [DiscountController::class, 'edit']
        )->name('discounts.edit')->middleware('permission:update discounts');

        Route::put(
            'discounts/{discount}',
            [DiscountController::class, 'update']
        )->name('discounts.update')->middleware('permission:update discounts');

        Route::delete(
            'discounts/{discount}',
            [DiscountController::class, 'destroy']
        )->name('discounts.destroy')->middleware('permission:delete discounts');

        Route::patch(
            'discounts/{discount}/toggle-status',
            [DiscountController::class, 'toggleStatus']
        )->name('discounts.toggle-status')->middleware('permission:toggle discount status');

    });
