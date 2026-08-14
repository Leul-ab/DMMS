<?php

namespace App\Models;

use App\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TableSection extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'name',
        'description',
        'status',
    ];

    public function tables(): HasMany
    {
        return $this->hasMany(RestaurantTable::class, 'table_section_id');
    }
}
