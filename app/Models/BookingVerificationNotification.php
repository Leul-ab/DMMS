<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingVerificationNotification extends Model
{
    use BelongsToBranch;

    /** Status constants */
    public const STATUS_PENDING = 'pending';

    public const STATUS_READ = 'read';

    public const STATUS_VERIFIED = 'verified';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_CANCELLED = 'cancelled';

    /** Statuses that are still actionable (counted in the global badge). */
    public const ACTIONABLE_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_READ,
    ];

    protected $fillable = [
        'branch_id',
        'booking_id',
        'customer_id',
        'payment_method',
        'payment_account',
        'payment_attempt_reference',
        'amount',
        'notification_type',
        'status',
        'copied_at',
        'expired_at',
        'read_at',
        'verified_at',
        'rejected_at',
        'rejection_reason',
        'transaction_number',
        'payment_screenshot',
        'verified_by',
        'rejected_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'copied_at' => 'datetime',
            'expired_at' => 'datetime',
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

    /**
     * Scope a query to only actionable (pending/read) notifications.
     */
    public function scopeActionable($query)
    {
        return $query->whereIn('status', self::ACTIONABLE_STATUSES);
    }

    /**
     * Generate a unique payment attempt reference.
     */
    public static function generateAttemptReference(): string
    {
        $prefix = 'BPA-'.now()->format('Ymd');

        $last = self::where('payment_attempt_reference', 'like', "{$prefix}-%")
            ->orderBy('payment_attempt_reference', 'desc')
            ->first();

        $next = $last ? ((int) substr($last->payment_attempt_reference, -4)) + 1 : 1;

        return $prefix.'-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
