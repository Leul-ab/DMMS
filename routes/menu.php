<?php

use App\Http\Controllers\MenuController;
use Illuminate\Support\Facades\Route;

Route::get('/menu', [MenuController::class, 'index'])
    ->name('menu.index');

Route::get('/my-order', [MenuController::class, 'myOrder'])
    ->name('menu.my-order');