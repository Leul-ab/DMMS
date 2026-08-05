<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaiterAssignment extends Model
{
    protected $fillable = [
        'order_id',
        'waiter_id',
        'status',
        'assigned_at',
        'served_at',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'served_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function waiter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'waiter_id');
    }
}
