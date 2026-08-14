<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\TableSection;
use Illuminate\Database\Seeder;

class TableSectionSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::where('slug', 'main-branch')->first();

        $sections = [
            ['name' => 'Main Dining', 'description' => 'Main dining area tables'],
            ['name' => 'VIP Dining', 'description' => 'VIP dining area tables'],
            ['name' => 'Private Dining', 'description' => 'Private dining room tables'],
            ['name' => 'Terrace', 'description' => 'Outdoor terrace tables'],
            ['name' => 'Garden', 'description' => 'Garden area tables'],
            ['name' => 'Lounge', 'description' => 'Lounge and bar area tables'],
        ];

        foreach ($sections as $section) {
            TableSection::firstOrCreate(
                ['branch_id' => $branch?->id, 'name' => $section['name']],
                [
                    'description' => $section['description'],
                    'status' => 'active',
                ]
            );
        }
    }
}
