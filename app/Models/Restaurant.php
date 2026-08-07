<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $logo
 * @property string $primary_color
 * @property string $secondary_color
 * @property string $accent_color
 * @property string $font_family
 * @property string $currency
 * @property string $tax_rate
 * @property string $timezone
 * @property string|null $description
 * @property string|null $owner_email
 * @property string|null $owner_phone
 * @property string $plan
 * @property Carbon|null $plan_expires_at
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Restaurant extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'logo',
        'primary_color',
        'secondary_color',
        'accent_color',
        'font_family',
        'currency',
        'tax_rate',
        'timezone',
        'description',
        'owner_email',
        'owner_phone',
        'plan',
        'plan_expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active'        => 'boolean',
            'tax_rate'         => 'decimal:2',
            'plan_expires_at'  => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Boot
    // -------------------------------------------------------------------------

    protected static function booted(): void
    {
        static::creating(function (Restaurant $restaurant) {
            if (empty($restaurant->slug)) {
                $restaurant->slug = Str::slug($restaurant->name);
            }
        });

        static::updating(function (Restaurant $restaurant) {
            if ($restaurant->isDirty('name') && ! $restaurant->isDirty('slug')) {
                $restaurant->slug = Str::slug($restaurant->name);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /** Full public URL for the logo, or null if not set. */
    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? Storage::url($this->logo) : null;
    }

    /** Returns the branding array shared with the frontend. */
    public function brandingForFrontend(): array
    {
        return [
            'name'           => $this->name,
            'logoUrl'        => $this->logo_url,
            'primaryColor'   => $this->primary_color,
            'secondaryColor' => $this->secondary_color,
            'accentColor'    => $this->accent_color,
            'fontFamily'     => $this->font_family,
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
