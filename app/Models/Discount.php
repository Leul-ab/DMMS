<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
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
}
