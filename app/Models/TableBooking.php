<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TableBooking extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'customer_id',
        'status',
        'payment_status',
        'extension_payment_status',
        'payment_method',
        'transaction_reference',
        'booking_amount',
        'extension_amount',
        'booked_at',
        'expires_at',
        'payment_expires_at',
        'original_expires_at',
        'cancelled_at',
        'paid_at',
        'extension_paid_at',
        'extension_expires_at',
        'extension_applied_at',
        'last_extended_at',
    ];

    protected function casts(): array
    {
        return [
            'booking_amount' => 'decimal:2',
            'extension_amount' => 'decimal:2',
            'booked_at' => 'datetime',
            'expires_at' => 'datetime',
            'payment_expires_at' => 'datetime',
            'original_expires_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'paid_at' => 'datetime',
            'extension_paid_at' => 'datetime',
            'extension_expires_at' => 'datetime',
            'extension_applied_at' => 'datetime',
            'last_extended_at' => 'datetime',
        ];
    }

    /**
     * The customer who made this booking.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * The restaurant tables associated with this booking (many-to-many).
     */
    public function tables()
    {
        return $this->belongsToMany(
            RestaurantTable::class,
            'booking_tables',
            'booking_id',
            'table_id'
        );
    }

    /**
     * The main booking payment for this booking.
     */
    public function payment()
    {
        return $this->hasOne(Payment::class, 'booking_id')->where('payment_type', 'booking');
    }

    /**
     * The extension payment for this booking.
     */
    public function extensionPayment()
    {
        return $this->hasOne(Payment::class, 'booking_id')->where('payment_type', 'extension');
    }
}
