<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use App\Models\MenuItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Discount extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'name',
        'description',
        'discount_type',
        'applies_to',
        'percentage',
        'fixed_amount',
        'status',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
    ];

    protected function casts(): array
    {
        return [
            'percentage' => 'decimal:2',
            'fixed_amount' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'start_time' => 'datetime:H:i:s',
            'end_time' => 'datetime:H:i:s',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function menuItems(): BelongsToMany
    {
        return $this->belongsToMany(MenuItem::class, 'discount_menu_item');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired');
    }

    public function scopeValid($query)
    {
        return $query->where('status', 'active')
            ->where('start_date', '<=', now()->toDateString())
            ->where('end_date', '>=', now()->toDateString())
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->whereNotNull('start_time')
                        ->whereNotNull('end_time')
                        ->whereTime('start_time', '<=', now()->toTimeString())
                        ->whereTime('end_time', '>=', now()->toTimeString());
                })->orWhere(function ($q) {
                    $q->whereNull('start_time')
                        ->whereNull('end_time');
                })->orWhere(function ($q) {
                    $q->whereNotNull('start_time')
                        ->whereNull('end_time')
                        ->whereTime('start_time', '<=', now()->toTimeString());
                })->orWhere(function ($q) {
                    $q->whereNull('start_time')
                        ->whereNotNull('end_time')
                        ->whereTime('end_time', '>=', now()->toTimeString());
                });
            });
    }

    /**
     * Restrict to discounts whose combined start_date + start_time and
     * end_date + end_time window currently contains "now" (ignoring status).
     * This correctly handles discounts that span midnight (e.g. start 23:05
     * on day 1, end 23:00 on day 2) which a naive time-of-day comparison
     * would mishandle.
     */
    public function scopeActiveWindow($query)
    {
        $now = now()->format('Y-m-d H:i:s');
        $driver = $query->getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            return $query
                ->whereRaw("datetime(start_date || ' ' || COALESCE(start_time, '00:00:00')) <= ?", [$now])
                ->whereRaw("datetime(end_date || ' ' || COALESCE(end_time, '23:59:59')) >= ?", [$now]);
        }

        return $query
            ->whereRaw('TIMESTAMP(start_date, COALESCE(start_time, ?)) <= ?', ['00:00:00', $now])
            ->whereRaw('TIMESTAMP(end_date, COALESCE(end_time, ?)) >= ?', ['23:59:59', $now]);
    }

    /**
     * Member-only discounts that are currently within their active window
     * and have not been manually disabled or expired.
     */
    public function scopeMemberAvailable($query)
    {
        return $query->where('applies_to', 'members')
            ->whereNotIn('status', ['inactive', 'expired'])
            ->activeWindow();
    }
}
