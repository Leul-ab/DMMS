<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'order_id',
        'user_id',
        'table_id',
        'booking_id',
        'payment_method',
        'payment_status',
        'payment_type',
        'amount',
        'subtotal',
        'tax',
        'service_charge',
        'discount',
        'transaction_reference',
        'transaction_number',
        'verified_by',
        'verified_at',
        'notes',
        'extension_period_hours',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'service_charge' => 'decimal:2',
            'discount' => 'decimal:2',
            'paid_at' => 'datetime',
            'verified_at' => 'datetime',
            'payment_type' => 'string',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(TableBooking::class, 'booking_id');
    }
}
