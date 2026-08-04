<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use App\Models\User;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::query()->firstOrCreate(
            ['name' => 'Main Branch'],
            [
                'address' => 'Default location',
                'phone' => null,
                'is_active' => true,
            ]
        );

        $tables = [
            RestaurantTable::class,
            MenuCategory::class,
            MenuItem::class,
            Order::class,
            TableBooking::class,
            Payment::class,
            Customer::class,
        ];

        foreach ($tables as $model) {
            $model::query()
                ->whereNull('branch_id')
                ->update(['branch_id' => $branch->id]);
        }

        User::query()
            ->whereNull('branch_id')
            ->update(['branch_id' => $branch->id]);

        User::query()
            ->whereHas('role', fn ($q) => $q->where('slug', 'super_admin'))
            ->each(function (User $user) use ($branch) {
                $user->assignedBranches()->syncWithoutDetaching([$branch->id]);
                if (! $user->branch_id) {
                    $user->update(['branch_id' => $branch->id]);
                }
            });
    }
}
