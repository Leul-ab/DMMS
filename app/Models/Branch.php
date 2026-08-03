<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'phone',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Users with this branch as their primary branch.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Users explicitly assigned to this branch (many-to-many).
     */
    public function assignedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withTimestamps();
    }

    /**
     * Customers belonging to this branch.
     */
    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    /**
     * Restaurant tables belonging to this branch.
     */
    public function restaurantTables(): HasMany
    {
        return $this->hasMany(RestaurantTable::class);
    }

    /**
     * Menu categories belonging to this branch.
     */
    public function menuCategories(): HasMany
    {
        return $this->hasMany(MenuCategory::class);
    }

    /**
     * Menu items belonging to this branch.
     */
    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    /**
     * Orders belonging to this branch.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Table bookings belonging to this branch.
     */
    public function tableBookings(): HasMany
    {
        return $this->hasMany(TableBooking::class);
    }

    /**
     * Payments belonging to this branch.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}