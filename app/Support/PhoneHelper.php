<?php

namespace App\Support;

class PhoneHelper
{
    /**
     * Normalize a phone number to standard format (+251...).
     */
    public static function normalize(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $cleaned = trim($phone);
        $hasPlus = str_starts_with($cleaned, '+');
        $digits = preg_replace('/[^\d]/', '', $cleaned);

        if (empty($digits)) {
            return null;
        }

        if ($hasPlus) {
            return '+' . $digits;
        }

        if (str_starts_with($digits, '0')) {
            return '+251' . substr($digits, 1);
        }

        if (str_starts_with($digits, '251')) {
            return '+' . $digits;
        }

        return '+251' . $digits;
    }
}
