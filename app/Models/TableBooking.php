<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TableBooking extends Model
{
    protected $fillable = [
        'customer_id',
        'status',
        'booked_at',
        'expires_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'booked_at' => 'datetime',
            'expires_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * The customer who made this booking.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }


    /**
     * The restaurant tabless associated with this booking (many-to-many).
     */
    public function tables()
    {
        return $this->belongsToMany(
            RestaurantTable::class,
            'booking_tables',
            'booking_id',
            'table_id'
        );
    }
}
