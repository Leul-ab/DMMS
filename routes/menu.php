<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\MemberDiscountController;
use App\Http\Controllers\MenuController;
use Illuminate\Support\Facades\Route;

Route::get('/menu', [MenuController::class, 'index'])
    ->name('menu.index');

Route::get('/customer-menu', [MenuController::class, 'customerMenu'])
    ->name('menu.customer');

Route::get('/my-order', [MenuController::class, 'myOrder'])
    ->name('menu.my-order');

Route::get('/customer-my-order', [MenuController::class, 'customerMyOrder'])
    ->name('menu.customer-my-order');

// Customer membership registration
Route::post('/customer/register', [CustomerController::class, 'store'])
    ->name('customer.register');

Route::post('/customer/verify-member', [CustomerController::class, 'verifyMember'])
    ->name('customer.verify-member');

// Member-only discount notifications
Route::get('/customer/member-discounts', [MemberDiscountController::class, 'index'])
    ->name('customer.member-discounts');

Route::post('/customer/member-notifications/{discount}/read', [MemberDiscountController::class, 'markRead'])
    ->name('customer.member-notification.read');

