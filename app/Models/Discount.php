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
    ];

    protected function casts(): array
    {
        return [
            'percentage' => 'decimal:2',
            'fixed_amount' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
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
}
