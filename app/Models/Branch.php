<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int|null $restaurant_id
 * @property string $name
 * @property string $slug
 * @property string|null $address
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $city
 * @property string|null $state
 * @property string|null $postal_code
 * @property string|null $country
 * @property string $currency
 * @property string $tax_rate
 * @property string|null $description
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Restaurant|null $restaurant
 */
class Branch extends Model
{
    protected $fillable = [
        'restaurant_id',
        'name',
        'slug',
        'address',
        'phone',
        'email',
        'city',
        'state',
        'postal_code',
        'country',
        'tax_rate',
        'currency',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'tax_rate' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Branch $branch) {
            if (empty($branch->slug)) {
                $branch->slug = Str::slug($branch->name);
            }
        });

        static::updating(function (Branch $branch) {
            if ($branch->isDirty('name') && ! $branch->isDirty('slug')) {
                $branch->slug = Str::slug($branch->name);
            }
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function menuCategories(): HasMany
    {
        return $this->hasMany(MenuCategory::class);
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function tables(): HasMany
    {
        return $this->hasMany(RestaurantTable::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    /**
     * The branch currently active for the request.
     *
     * Resolution order:
     *  1. The branch explicitly set for this request (switch / scanned table).
     *  2. The authenticated user's assigned branch.
     *  3. The first active branch in the database.
     */
    public static function current(): ?self
    {
        if (app()->bound('current_branch')) {
            return app('current_branch');
        }

        $branchId = session('current_branch_id');

        if ($branchId === null && auth()->check()) {
            $branchId = auth()->user()->branch_id;
        }

        $branch = null;
        if ($branchId !== null) {
            $query = self::where('id', $branchId);
            if (auth()->check() && auth()->user()->restaurant_id) {
                $query->where('restaurant_id', auth()->user()->restaurant_id);
            }
            $branch = $query->first();
        }

        if ($branch === null) {
            $query = self::active()->orderBy('id');
            if (auth()->check() && auth()->user()->restaurant_id) {
                $query->where('restaurant_id', auth()->user()->restaurant_id);
            }
            $branch = $query->first();
        }

        app()->instance('current_branch', $branch);

        return $branch;
    }

    /**
     * Set the active branch for the current request (and session).
     */
    public static function setCurrent(?int $branchId): ?self
    {
        $branch = null;
        if ($branchId !== null) {
            $query = self::where('id', $branchId);
            if (auth()->check() && auth()->user()->restaurant_id) {
                $query->where('restaurant_id', auth()->user()->restaurant_id);
            }
            $branch = $query->first();
        }

        app()->instance('current_branch', $branch);

        if ($branch) {
            session(['current_branch_id' => $branch->id]);
        }

        return $branch;
    }
}
