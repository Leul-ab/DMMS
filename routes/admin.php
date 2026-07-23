<?php

use App\Http\Controllers\Admin\RolesPermissionsController;
use App\Http\Controllers\Admin\ShiftController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\StaffReportController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:super_admin'])->prefix('admin')->name('admin.')->group(function () {
    // User Management (existing)
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/create', [UserController::class, 'create'])->name('users.create');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Staff Management
    Route::prefix('staff')->name('staff.')->group(function () {
        Route::get('/', [StaffController::class, 'index'])->name('index');
        Route::get('/dashboard', [StaffController::class, 'dashboard'])->name('dashboard');
        Route::get('/waiters', [StaffController::class, 'waiters'])->name('waiters');
        Route::get('/kitchen', [StaffController::class, 'kitchenStaff'])->name('kitchen');
        Route::get('/kitchen/managers', [StaffController::class, 'kitchenManagers'])->name('kitchen.managers');
        Route::get('/kitchen/chefs', [StaffController::class, 'chefs'])->name('kitchen.chefs');
        Route::get('/create', [StaffController::class, 'create'])->name('create');
        Route::post('/', [StaffController::class, 'store'])->name('store');
        Route::get('/{user}', [StaffController::class, 'show'])->name('show');
        Route::get('/{user}/edit', [StaffController::class, 'edit'])->name('edit');
        Route::put('/{user}', [StaffController::class, 'update'])->name('update');
        Route::delete('/{user}', [StaffController::class, 'destroy'])->name('destroy');
        Route::post('/{user}/reset-password', [StaffController::class, 'resetPassword'])->name('reset-password');
        Route::post('/{user}/toggle-status', [StaffController::class, 'toggleStatus'])->name('toggle-status');
    });

    // Roles & Permissions
    Route::prefix('roles')->name('roles.')->group(function () {
        Route::get('/', [RolesPermissionsController::class, 'index'])->name('index');
        Route::post('/', [RolesPermissionsController::class, 'store'])->name('store');
        Route::put('/{role}', [RolesPermissionsController::class, 'update'])->name('update');
        Route::delete('/{role}', [RolesPermissionsController::class, 'destroy'])->name('destroy');
    });

    // Shift Management
    Route::prefix('shifts')->name('shifts.')->group(function () {
        Route::get('/', [ShiftController::class, 'index'])->name('index');
        Route::post('/', [ShiftController::class, 'store'])->name('store');
        Route::put('/{shift}', [ShiftController::class, 'update'])->name('update');
        Route::delete('/{shift}', [ShiftController::class, 'destroy'])->name('destroy');
        Route::post('/assign', [ShiftController::class, 'assign'])->name('assign');
        Route::delete('/assignments/{assignment}', [ShiftController::class, 'removeAssignment'])->name('assignments.destroy');
        Route::get('/today', [ShiftController::class, 'todaySchedule'])->name('today');
    });

    // Staff Reports
    Route::get('/staff-reports', [StaffReportController::class, 'index'])->name('staff-reports.index');
});
