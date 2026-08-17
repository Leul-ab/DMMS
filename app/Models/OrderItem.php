<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'order_id',
        'menu_item_id',
        'quantity',
        'price',
        'notes',
        'special_preferences',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'price' => 'decimal:2',
            'special_preferences' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(
            Order::class,
            'order_id'
        );
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(
            MenuItem::class,
            'menu_item_id'
        );
    }
}