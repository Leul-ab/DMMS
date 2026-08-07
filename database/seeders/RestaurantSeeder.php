<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates a default Restaurant and links all existing branches and users to it.
 * Safe to run multiple times (idempotent via updateOrCreate).
 */
class RestaurantSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::updateOrCreate(
            ['slug' => 'main-restaurant'],
            [
                'name'            => 'Main Restaurant',
                'primary_color'   => '#e85d04',
                'secondary_color' => '#f48c06',
                'accent_color'    => '#ffb703',
                'font_family'     => 'Inter',
                'currency'        => 'ETB',
                'tax_rate'        => 15.00,
                'timezone'        => 'Africa/Addis_Ababa',
                'plan'            => 'pro',
                'is_active'       => true,
            ]
        );

        // Link all branches that don't yet belong to a restaurant
        Branch::whereNull('restaurant_id')->update(['restaurant_id' => $restaurant->id]);

        // Link all users that don't yet belong to a restaurant
        User::whereNull('restaurant_id')->update(['restaurant_id' => $restaurant->id]);

        $this->command->info("Default restaurant '{$restaurant->name}' created/updated (ID: {$restaurant->id}).");
        $this->command->info("All orphaned branches and users linked to it.");
    }
}
