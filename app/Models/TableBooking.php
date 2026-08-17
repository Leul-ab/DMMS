<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TableBooking extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'customer_id',
        'status',
        'payment_status',
        'booking_amount',
        'extension_amount',
        'extension_payment_status',
        'extension_paid_at',
        'extension_expires_at',
        'original_expires_at',
        'booked_at',
        'expires_at',
        'cancelled_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'booking_amount' => 'decimal:2',
            'extension_amount' => 'decimal:2',
            'booked_at' => 'datetime',
            'expires_at' => 'datetime',
            'original_expires_at' => 'datetime',
            'extension_expires_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'paid_at' => 'datetime',
            'extension_paid_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function tables(): BelongsToMany
    {
        return $this->belongsToMany(
            RestaurantTable::class,
            'booking_tables',
            'booking_id',
            'table_id'
        );
    }

    public function payments(): HasMany
    {
        return $this->hasMany(BookingPayment::class);
    }

    public function originalPayment(): HasMany
    {
        return $this->payments()->where('payment_type', 'original');
    }

    public function extensionPayment(): HasMany
    {
        return $this->payments()->where('payment_type', 'extension');
    }

    public function isPendingPayment(): bool
    {
        return $this->status === 'pending_payment';
    }

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->payment_status === 'paid';
    }

    public function isExtended(): bool
    {
        return $this->status === 'extended' && $this->payment_status === 'paid';
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired' || $this->payment_status === 'expired';
    }

    public function isPaymentExpired(): bool
    {
        return $this->expires_at && now()->greaterThan($this->expires_at);
    }

    public function isBookingExpired(): bool
    {
        return $this->expires_at && now()->greaterThan($this->expires_at);
    }

    public function canBePaid(): bool
    {
        return $this->status === 'pending_payment'
            && $this->payment_status === 'pending'
            && !$this->isPaymentExpired();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending_payment', 'active']) && !$this->isExpired();
    }

    public function canBeExtended(): bool
    {
        return $this->isActive()
            && $this->extension_payment_status !== 'paid'
            && $this->expires_at
            && now()->greaterThan($this->expires_at->subMinutes(5));
    }

    public function getTimeRemainingAttribute(): ?int
    {
        if (!$this->expires_at) {
            return null;
        }

        return max(0, now()->diffInSeconds($this->expires_at, false));
    }

    public function getExtensionFeeAttribute(): float
    {
        return (float) ($this->booking_amount * 0.5);
    }
}
