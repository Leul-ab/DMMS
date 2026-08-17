<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingPayment extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'booking_id',
        'payment_method',
        'payment_type',
        'amount',
        'original_amount',
        'extension_amount',
        'transaction_reference',
        'transaction_number',
        'payment_status',
        'paid_at',
        'verified_by',
        'verified_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'original_amount' => 'decimal:2',
            'extension_amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(TableBooking::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function isPending(): bool
    {
        return $this->payment_status === 'pending';
    }

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function isFailed(): bool
    {
        return in_array($this->payment_status, ['failed', 'rejected', 'expired']);
    }
}
