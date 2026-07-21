<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'table_id',
        'order_number',
        'status',
        'total_amount',
        'estimated_minutes',
        'customer_name',
        'customer_phone',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'estimated_minutes' => 'integer',
        ];
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(
            RestaurantTable::class,
            'table_id'
        );
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(
            OrderItem::class,
            'order_id'
        );
    }
}