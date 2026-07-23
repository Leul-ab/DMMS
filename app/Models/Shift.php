<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    protected $fillable = ['name', 'start_time', 'end_time', 'description', 'is_active'];

    protected function casts(): array
    {
        return [
            'start_time' => 'string',
            'end_time' => 'string',
            'is_active' => 'boolean',
        ];
    }

    public function shiftAssignments(): HasMany
    {
        return $this->hasMany(ShiftAssignment::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
