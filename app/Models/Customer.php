<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Customer extends Model
{
    protected $fillable = [
        'branch_id',
        'customer_code',
        'name',
        'phone',
        'email',
        'is_member',
    ];

    protected function casts(): array
    {
        return [
            'is_member' => 'boolean',
        ];
    }

    /**
     * Generate a unique random customer code.
     *
     * Format: CUS-XXXXXXXX (prefix + 8 random uppercase alphanumeric characters).
     * Ensures the generated code does not already exist in the database.
     */
    public static function generateUniqueCode(): string
    {
        do {
            $code = 'CUS-' . Str::upper(Str::random(8));
        } while (static::where('customer_code', $code)->exists());

        return $code;
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class, 'customer_id');
    }
}
