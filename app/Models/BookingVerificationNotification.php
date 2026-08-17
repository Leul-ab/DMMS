<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingVerificationNotification extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'booking_id',
        'customer_id',
        'payment_method',
        'amount',
        'notification_type',
        'status',
        'read_at',
        'verified_at',
        'rejected_at',
        'rejection_reason',
        'verified_by',
        'rejected_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'read_at' => 'datetime',
            'verified_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(TableBooking::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }
}
