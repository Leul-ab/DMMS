<?php

use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:super_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/create', [UserController::class, 'create'])->name('users.create');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::patch('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');

    // Staff Management
    Route::get('staff', [StaffController::class, 'index'])->name('staff.index');
    Route::post('staff', [StaffController::class, 'store'])->name('staff.store');
    Route::put('staff/{user}', [StaffController::class, 'update'])->name('staff.update');
    Route::delete('staff/{user}', [StaffController::class, 'destroy'])->name('staff.destroy');
    Route::post('staff/assign-table', [StaffController::class, 'assignTable'])->name('staff.assign-table');

    // Payment Management
    Route::get('payments', [\App\Http\Controllers\Admin\PaymentController::class, 'index'])->name('payments.index');
    Route::get('payments/today', [\App\Http\Controllers\Admin\PaymentController::class, 'todayRevenue'])->name('payments.today');
    Route::get('payments/revenue', [\App\Http\Controllers\Admin\PaymentController::class, 'revenue'])->name('payments.revenue');
    Route::get('payments/orders', [\App\Http\Controllers\Admin\PaymentController::class, 'orders'])->name('payments.orders');
    Route::get('payments/orders/{order}/detail', [\App\Http\Controllers\Admin\PaymentController::class, 'orderDetail'])->name('payments.orders.detail');
    Route::get('payments/{order}', [\App\Http\Controllers\Admin\PaymentController::class, 'show'])->name('payments.show');
    Route::patch('payments/{order}/status', [\App\Http\Controllers\Admin\PaymentController::class, 'updateStatus'])->name('payments.update-status');
    Route::get('payments/{order}/receipt', [\App\Http\Controllers\Admin\PaymentController::class, 'printReceipt'])->name('payments.receipt');
});
