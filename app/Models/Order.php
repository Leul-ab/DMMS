<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'table_id',
        'customer_id',
        'order_number',
        'status',
        'payment_status',
        'payment_submitted_at',
        'total_amount',
        'estimated_minutes',
        'customer_name',
        'customer_phone',
        'notes',
        'preparation_time',
        'preparation_started_at',
        'preparation_completed_at',
        'preparation_status',
        'special_instructions',
    ];


    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'estimated_minutes' => 'integer',
            'preparation_time' => 'integer',
            'payment_submitted_at' => 'datetime',
            'preparation_started_at' => 'datetime',
            'preparation_completed_at' => 'datetime',
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

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(Receipt::class);
    }
}
