<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
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
}