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
        'served_by',
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

    protected $appends = [
        'queue_estimated_minutes',
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

    /**
     * Calculate the cumulative estimated preparation time for this order
     * based on its position in the global kitchen queue.
     *
     * The queue includes active orders (pending, preparing) only
     * from ALL tables, sorted by arrival (created_at) time.
     * The queue time for an order = sum of individual prep times of all
     * orders that arrived at or before this order's arrival time.
     *
     * Individual prep time for an order = sum of (quantity × preparation_time)
     * for all its items.
     */
    public function getQueueEstimatedMinutesAttribute(): ?int
    {
        $individualMinutes = $this->estimated_minutes ?? 0;

        if (! $individualMinutes) {
            return null;
        }

        // Get all active orders from the same branch, sorted by arrival time.
        // Only pending and preparing orders are in the active kitchen queue.
        // Orders marked as 'ready' (sent to waiter), 'served', or 'completed'
        // are excluded so their queue time is removed and remaining orders
        // are recalculated automatically.
        $activeOrders = Order::query()
            ->where('branch_id', $this->branch_id)
            ->whereIn('status', ['pending', 'preparing'])
            ->orderBy('created_at')
            ->get();

        if ($activeOrders->isEmpty()) {
            return $individualMinutes;
        }

        $cumulative = 0;

        foreach ($activeOrders as $activeOrder) {
            $cumulative += $activeOrder->estimated_minutes ?? 0;

            if ($activeOrder->id === $this->id) {
                return $cumulative > 0 ? $cumulative : null;
            }
        }

        // If this order wasn't found in the active list (e.g., completed or ready),
        // return its own individual time as a fallback
        return $individualMinutes > 0 ? $individualMinutes : null;
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

    public function feedback(): HasOne
    {
        return $this->hasOne(Feedback::class);
    }

    public function waiterAssignments(): HasMany
    {
        return $this->hasMany(WaiterAssignment::class, 'order_id');
    }

    public function servedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'served_by');
    }
}
