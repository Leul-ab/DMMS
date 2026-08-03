<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RestaurantTable extends Model
{
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
            'branch_id' => 'integer',
            'table_number' => 'integer',
            'current_order_id' => 'integer',
        ];
    }

    /**
     * The branch this table belongs to.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Orders placed at this table.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }

    /**
     * Bookings associated with this table.
     */
    public function bookings(): BelongsToMany
    {
        return $this->belongsToMany(
            TableBooking::class,
            'booking_tables',
            'table_id',
            'booking_id'
        );
    }
}