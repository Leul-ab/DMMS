<?php

return [
    'extension_period_hours' => (int) env('BOOKING_EXTENSION_PERIOD_HOURS', 2),
    'extension_fee_percentage' => (int) env('BOOKING_EXTENSION_FEE_PERCENTAGE', 50),
    'expiration_warning_minutes' => (int) env('BOOKING_EXPIRATION_WARNING_MINUTES', 15),
];
