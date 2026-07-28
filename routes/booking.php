<?php

use App\Http\Controllers\BookingController;
use Illuminate\Support\Facades\Route;

Route::get('/booking', [BookingController::class, 'index'])
    ->name('booking.index');

Route::post('/booking/verify-customer', [BookingController::class, 'verifyCustomer'])
    ->name('booking.verify-customer');

Route::post('/booking', [BookingController::class, 'store'])
    ->name('booking.store');

Route::post('/booking/{booking}/cancel', [BookingController::class, 'cancel'])
    ->name('booking.cancel');

// API route for booking sidebar
Route::get('/api/active-booking', [BookingController::class, 'getActiveBooking']);

// API route for all bookings
Route::get('/api/bookings', [BookingController::class, 'getAllBookings']);

// API route for single booking details
Route::get('/api/bookings/{booking}', [BookingController::class, 'getBookingDetails']);

// API route to find booking by customer code
Route::post('/api/bookings/lookup', [BookingController::class, 'lookupByCustomerCode']);
