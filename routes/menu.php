<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\MenuController;
use Illuminate\Support\Facades\Route;

Route::get('/menu', [MenuController::class, 'index'])
    ->name('menu.index');

Route::get('/my-order', [MenuController::class, 'myOrder'])
    ->name('menu.my-order');

// Customer membership registration
Route::post('/customer/register', [CustomerController::class, 'store'])
    ->name('customer.register');