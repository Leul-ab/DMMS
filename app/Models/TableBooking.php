<?php
namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TableBooking extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'customer_id',
        'status',
        'payment_status',
        'booked_at',
        'expires_at',
        'cancelled_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'booked_at' => 'datetime',
            'expires_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'paid_at' => 'datetime',
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
