<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\RestaurantTable;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::updateOrCreate(
            ['slug' => 'main-branch'],
            [
                'name' => 'Main Branch',
                'address' => 'Bole Road, Addis Ababa',
                'phone' => '+251 11 123 4567',
                'email' => 'main@dmms.test',
                'city' => 'Addis Ababa',
                'state' => 'Addis Ababa',
                'country' => 'Ethiopia',
                'tax_rate' => 15,
                'currency' => 'ETB',
                'is_active' => true,
            ],
        );

        // Make the Main Branch the active branch so subsequent seeders and
        // any future creates attach their data to it.
        Branch::setCurrent($branch->id);

        // Adopt legacy records created before branch scoping existed so they
        // show up under the Main Branch (no-op on a fresh database).
        foreach ([RestaurantTable::class, MenuCategory::class, MenuItem::class] as $model) {
            $model::withoutGlobalScopes()
                ->whereNull('branch_id')
                ->update(['branch_id' => $branch->id]);
        }
    }
}
