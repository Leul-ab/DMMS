<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantTable extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'table_number',
        'qr_code',
        'status',
        'current_order_id',
    ];

    protected function casts(): array
    {
        return [
            'table_number' => 'integer',
            'current_order_id' => 'integer',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }
}