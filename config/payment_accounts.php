<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Booking Payment Accounts
    |--------------------------------------------------------------------------
    |
    | These are the payment account details displayed to customers when they
    | choose to pay for a table booking.  The selected account number is
    | stored on the BookingVerificationNotification record when the customer
    | clicks "Copy Account" so the manager can cross-reference it.
    |
    */

    'cbe_birr' => [
        'label' => env('CBE_ACCOUNT_LABEL', 'CBE Birr'),
        'number' => env('CBE_ACCOUNT_NUMBER', '100012345678'),
    ],

    'telebirr' => [
        'label' => env('TELEBIRR_ACCOUNT_LABEL', 'Telebirr'),
        'number' => env('TELEBIRR_ACCOUNT_NUMBER', '0912345678'),
    ],
];
