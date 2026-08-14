<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Customer extends Model
{
    protected $fillable = [
        'branch_id',
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

    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class, 'customer_id');
    }
}
