<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TableBooking extends Model
{
    protected $fillable = [
        'table_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'booking_date',
        'booking_time',
        'number_of_guests',
        'status',
        'special_request',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'booking_time' => 'datetime',
            'number_of_guests' => 'integer',
        ];
    }

    /**
     * The restaurant table associated with this booking.
     */
    public function table(): BelongsTo
    {
        return $this->belongsTo(
            RestaurantTable::class,
            'table_id'
        );
    }
}

