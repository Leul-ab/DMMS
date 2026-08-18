<?php

namespace App\Support;

class PhoneHelper
{
    /**
     * Ethiopian phone numbers are stored as +251 followed by 9 digits,
     * where the first local digit must be 9. Example: +251912345678.
     */
    public const PATTERN = '/^\+2519\d{8}$/';

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

    /**
     * Check whether a phone number is a valid Ethiopian mobile number
     * in the canonical +2519XXXXXXXX format.
     */
    public static function isValid(?string $phone): bool
    {
        $normalized = self::normalize($phone);

        return $normalized !== null
            && preg_match(self::PATTERN, $normalized) === 1;
    }
}
