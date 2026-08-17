<?php

return [
    'default_fee_per_table' => env('BOOKING_DEFAULT_FEE_PER_TABLE', 500),
    'payment_window_minutes' => env('BOOKING_PAYMENT_WINDOW_MINUTES', 5),
    'booking_duration_hours' => env('BOOKING_DURATION_HOURS', 2),
    'extension_duration_hours' => env('BOOKING_EXTENSION_HOURS', 2),
    'extension_percentage' => env('BOOKING_EXTENSION_PERCENTAGE', 50),
    'cbe_birr_number' => env('CBE_BIRR_NUMBER', '1000976545673'),
    'telebirr_number' => env('TELEBIRR_NUMBER', '0987574556'),
];
