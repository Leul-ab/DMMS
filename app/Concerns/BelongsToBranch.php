<?php

namespace App\Concerns;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToBranch
{
    protected static function bootBelongsToBranch(): void
    {
        static::addGlobalScope('branch', function (Builder $builder) {
            $branch = Branch::current();

            if ($branch !== null) {
                $builder->where(
                    $builder->getModel()->qualifyColumn('branch_id'),
                    $branch->id,
                );
            }
        });

        static::creating(function (Model $model) {
            if ($model->branch_id === null) {
                $model->branch_id = Branch::current()?->id;
            }
        });
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
