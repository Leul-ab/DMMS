<?php

use App\Http\Controllers\BookingController;
use Illuminate\Support\Facades\Route;

Route::get('/booking', [BookingController::class, 'index'])
    ->name('booking.index');

Route::get('/customer-booking', [BookingController::class, 'customerBooking'])
    ->name('booking.customer');

Route::post('/booking/verify-customer', [BookingController::class, 'verifyCustomer'])
    ->name('booking.verify-customer');

Route::post('/booking', [BookingController::class, 'store'])
    ->name('booking.store');

Route::post('/booking/{booking}/cancel', [BookingController::class, 'cancel'])
    ->name('booking.cancel');

Route::post('/booking/{booking}/pay', [BookingController::class, 'pay'])
    ->name('booking.pay');

Route::post('/booking/{booking}/submit-payment', [BookingController::class, 'submitPaymentVerification'])
    ->name('booking.submit-payment');

// API route for booking sidebar
Route::get('/api/active-booking', [BookingController::class, 'getActiveBooking']);

// API route for all bookings
Route::get('/api/bookings', [BookingController::class, 'getAllBookings']);

// API route for single booking details
Route::get('/api/bookings/{booking}', [BookingController::class, 'getBookingDetails']);

// API route to find booking by customer phone
Route::post('/api/bookings/lookup', [BookingController::class, 'lookupByCustomerCode']);

// Customer copy account number and create booking payment notification
Route::post('/customer/bookings/{booking}/copy-account', [BookingController::class, 'copyAccount'])
    ->name('customer.bookings.copy-account');

// Booking extension routes
Route::post('/api/booking/{booking}/request-extension', [BookingController::class, 'requestExtension'])
    ->name('booking.request-extension');

Route::post('/api/booking/{booking}/extend', [BookingController::class, 'extendBooking'])
    ->name('booking.extend');

Route::get('/api/booking/{booking}/extension-status', [BookingController::class, 'checkExtensionStatus'])
    ->name('booking.extension-status');
