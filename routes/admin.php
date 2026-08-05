<?php

use App\Http\Controllers\Admin\BranchController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    // Branch Management
    Route::get('branches', [BranchController::class, 'index'])->name('branches.index')->middleware('permission:view branches');
    Route::get('branches/{branch}', [BranchController::class, 'show'])->name('branches.show')->middleware('permission:show branches');
    Route::post('branches', [BranchController::class, 'store'])->name('branches.store')->middleware('permission:create branches');
    Route::put('branches/{branch}', [BranchController::class, 'update'])->name('branches.update')->middleware('permission:update branches');
    Route::delete('branches/{branch}', [BranchController::class, 'destroy'])->name('branches.destroy')->middleware('permission:delete branches');
    Route::patch('branches/{branch}/toggle-status', [BranchController::class, 'toggleStatus'])->name('branches.toggle-status')->middleware('permission:status branches');
    Route::post('branches/{branch}/switch', [BranchController::class, 'switch'])->name('branches.switch')->middleware('permission:switch branches');

    // User Management
    Route::get('users', [UserController::class, 'index'])->name('users.index')->middleware('permission:view users');
    Route::get('users/create', [UserController::class, 'create'])->name('users.create')->middleware('permission:create users');
    Route::post('users', [UserController::class, 'store'])->name('users.store')->middleware('permission:create users');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit')->middleware('permission:update users');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update')->middleware('permission:update users');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy')->middleware('permission:delete users');
    Route::patch('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status')->middleware('permission:status users');

    // Staff Management
    Route::get('staff', [StaffController::class, 'index'])->name('staff.index')->middleware('permission:view staff');
    Route::post('staff', [StaffController::class, 'store'])->name('staff.store')->middleware('permission:create staff');
    Route::put('staff/{user}', [StaffController::class, 'update'])->name('staff.update')->middleware('permission:update staff');
    Route::delete('staff/{user}', [StaffController::class, 'destroy'])->name('staff.destroy')->middleware('permission:delete staff');
    Route::post('staff/assign-table', [StaffController::class, 'assignTable'])->name('staff.assign-table')->middleware('permission:update staff');

    // Payment Management
    Route::get('payments', [\App\Http\Controllers\Admin\PaymentController::class, 'index'])->name('payments.index')->middleware('permission:view payments');
    Route::get('payments/today', [\App\Http\Controllers\Admin\PaymentController::class, 'todayRevenue'])->name('payments.today')->middleware('permission:view payments');
    Route::get('payments/revenue', [\App\Http\Controllers\Admin\PaymentController::class, 'revenue'])->name('payments.revenue')->middleware('permission:view payments');
    Route::get('payments/orders', [\App\Http\Controllers\Admin\PaymentController::class, 'orders'])->name('payments.orders')->middleware('permission:view payments');
    Route::get('payments/orders/{order}/detail', [\App\Http\Controllers\Admin\PaymentController::class, 'orderDetail'])->name('payments.orders.detail')->middleware('permission:view payments');
    Route::get('payments/{order}', [\App\Http\Controllers\Admin\PaymentController::class, 'show'])->name('payments.show')->middleware('permission:show payments');
    Route::patch('payments/{order}/status', [\App\Http\Controllers\Admin\PaymentController::class, 'updateStatus'])->name('payments.update-status')->middleware('permission:status payments');
    Route::get('payments/{order}/receipt', [\App\Http\Controllers\Admin\PaymentController::class, 'printReceipt'])->name('payments.receipt')->middleware('permission:view payments');

    // Role Management
    Route::get('roles', [RoleController::class, 'index'])->name('roles.index')->middleware('permission:view roles');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store')->middleware('permission:create roles');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update')->middleware('permission:update roles');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->middleware('permission:delete roles');
});
