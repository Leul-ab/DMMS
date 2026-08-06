<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property int|null $role_id
 * @property int|null $branch_id
 * @property bool $is_waiter
 * @property bool $is_active
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Role|null $role
 * @property-read Branch|null $branch
 * @property-read WaiterTableAssignment|null $latestTableAssignment
 */
#[Fillable(['name', 'email', 'phone', 'password', 'role_id', 'branch_id', 'is_active', 'is_waiter'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected static function booted(): void
    {
        static::saved(function (User $user) {
            $user->syncSpatieRoles();
        });
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function syncSpatieRoles(): void
    {
        $role = $this->role;
        $this->syncRoles($role?->name ? [$role->name] : []);
    }

    public function tableAssignments(): HasMany
    {
        return $this->hasMany(WaiterTableAssignment::class, 'waiter_id');
    }

    public function latestTableAssignment(): HasOne
    {
        return $this->hasOne(WaiterTableAssignment::class, 'waiter_id')->latestOfMany();
    }

    public function activeTableAssignments(): HasMany
    {
        return $this->hasMany(WaiterTableAssignment::class, 'waiter_id')
            ->whereIn('status', ['assigned', 'serving'])
            ->with('table');
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
            'is_waiter' => 'boolean',
        ];
    }
}
