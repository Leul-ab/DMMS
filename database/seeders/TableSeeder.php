<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\RestaurantTable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TableSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::where('slug', 'main-branch')->first();

        $tables = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

        foreach ($tables as $number) {
            RestaurantTable::firstOrCreate(
                ['table_number' => $number],
                [
                    'branch_id' => $branch?->id,
                    'qr_code' => 'QR-' . strtoupper(Str::random(12)),
                    'status' => 'available',
                ]
            );
        }
    }
}
