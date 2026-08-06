<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use App\Models\Discount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class MenuItem extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'image',
        'preparation_time',
        'is_available',
        'featured',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_available' => 'boolean',
            'featured' => 'boolean',
            'preparation_time' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (MenuItem $item) {
            if (empty($item->slug)) {
                $item->slug = Str::slug($item->name);
            }
        });

        static::updating(function (MenuItem $item) {
            if ($item->isDirty('name') && !$item->isDirty('slug')) {
                $item->slug = Str::slug($item->name);
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function discounts(): BelongsToMany
    {
        return $this->belongsToMany(Discount::class, 'discount_menu_item');
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }
}
