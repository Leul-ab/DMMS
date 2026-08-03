<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property int|null $role_id
 * @property int|null $branch_id
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
#[Fillable([
    'name',
    'email',
    'phone',
    'password',
    'role_id',
    'branch_id',
    'is_active',
])]
#[Hidden([
    'password',
    'two_factor_secret',
    'two_factor_recovery_codes',
    'remember_token',
])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Primary/home branch (kept for staff and backward compatibility).
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * All branches assigned to this user by an admin.
     */
    public function assignedBranches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class)
            ->withTimestamps();
    }

    public function hasRole(string $slug): bool
    {
        return $this->role?->slug === $slug;
    }

    /**
     * Branches this user is allowed to access.
     */
    public function accessibleBranches(): Collection
    {
        if ($this->hasRole('super_admin')) {
            return Branch::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get();
        }

        $assigned = $this->assignedBranches()
            ->where('branches.is_active', true)
            ->orderBy('branches.name')
            ->get();

        if ($assigned->isNotEmpty()) {
            return $assigned;
        }

        // Fallback to primary branch_id for legacy staff records.
        if ($this->branch_id) {
            $primary = Branch::query()
                ->where('id', $this->branch_id)
                ->where('is_active', true)
                ->get();

            return $primary;
        }

        return collect();
    }

    /**
     * Whether the user may access the given branch.
     */
    public function canAccessBranch(int $branchId): bool
    {
        if ($this->hasRole('super_admin')) {
            return Branch::query()
                ->where('id', $branchId)
                ->where('is_active', true)
                ->exists();
        }

        if ($this->assignedBranches()->where('branches.id', $branchId)->exists()) {
            return true;
        }

        return (int) $this->branch_id === $branchId;
    }

    /**
     * Sync assigned branches and keep primary branch_id in sync.
     *
     * @param  array<int>  $branchIds
     */
    public function syncAssignedBranches(array $branchIds): void
    {
        $branchIds = collect($branchIds)
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $this->assignedBranches()->sync($branchIds);

        $this->forceFill([
            'branch_id' => $branchIds[0] ?? null,
        ])->save();
    }

    public function tableAssignments(): HasMany
    {
        return $this->hasMany(WaiterTableAssignment::class, 'waiter_id');
    }

    public function latestTableAssignment(): HasOne
    {
        return $this->hasOne(
            WaiterTableAssignment::class,
            'waiter_id'
        )->latestOfMany();
    }

    public function activeTableAssignments(): HasMany
    {
        return $this->hasMany(
            WaiterTableAssignment::class,
            'waiter_id'
        )
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
        ];
    }
}
