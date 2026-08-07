<?php

namespace Tests\Feature;

use App\Models\Branch;
use Database\Seeders\MenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seed_does_not_create_pizza_or_burgers_categories_or_items(): void
    {
        Branch::create([
            'name' => 'Main Branch',
            'slug' => 'main-branch',
            'currency' => 'ETB',
            'tax_rate' => 0,
            'is_active' => true,
        ]);

        $this->seed(MenuSeeder::class);

        $categoryNames = \App\Models\MenuCategory::query()->pluck('name')->all();
        $itemNames = \App\Models\MenuItem::query()->pluck('name')->all();

        $this->assertNotContains('Pizza', $categoryNames);
        $this->assertNotContains('Burgers', $categoryNames);
        $this->assertNotContains('Margherita', $itemNames);
        $this->assertNotContains('Classic Burger', $itemNames);
    }

    public function test_seed_creates_menu_items_without_slug_or_featured_properties(): void
    {
        Branch::create([
            'name' => 'Main Branch',
            'slug' => 'main-branch',
            'currency' => 'ETB',
            'tax_rate' => 0,
            'is_active' => true,
        ]);

        $this->seed(MenuSeeder::class);

        $item = \App\Models\MenuItem::query()->where('name', 'Pancakes')->first();

        $this->assertNotNull($item);
        $this->assertTrue($item->is_available);
        $this->assertArrayNotHasKey('slug', $item->getAttributes());
        $this->assertArrayNotHasKey('featured', $item->getAttributes());
    }
}
