<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::where('slug', 'main-branch')->first();

        $categories = [
            ['name' => 'Breakfast', 'description' => 'Traditional Ethiopian breakfast dishes', 'sort_order' => 1, 'is_active' => true],
            ['name' => 'Lunch', 'description' => 'Ethiopian midday meals', 'sort_order' => 2, 'is_active' => true],
            ['name' => 'Dinner', 'description' => 'Evening Ethiopian dining', 'sort_order' => 3, 'is_active' => true],
            ['name' => 'Desserts', 'description' => 'Traditional Ethiopian sweets', 'sort_order' => 4, 'is_active' => true],
            ['name' => 'Beverages', 'description' => 'Refreshing Ethiopian drinks', 'sort_order' => 5, 'is_active' => true],
            ['name' => 'Hot Drinks', 'description' => 'Ethiopian coffee and tea', 'sort_order' => 6, 'is_active' => true],
        ];

        foreach ($categories as $data) {
            MenuCategory::firstOrCreate(
                ['name' => $data['name'], 'branch_id' => $branch?->id],
                $data
            );
        }

        $items = [
            // Breakfast
            ['category' => 'Breakfast', 'name' => 'Genfo', 'description' => 'Thick porridge with spiced butter and honey', 'price' => 6.99, 'preparation_time' => 12, 'is_available' => true, 'featured' => true],
            ['category' => 'Breakfast', 'name' => 'Chechebsa', 'description' => 'Fried flatbread with spiced butter and honey', 'price' => 5.99, 'preparation_time' => 10, 'is_available' => true, 'featured' => true],
            ['category' => 'Breakfast', 'name' => 'Ful Medames', 'description' => 'Stewed fava beans with olive oil and spices', 'price' => 6.49, 'preparation_time' => 8, 'is_available' => true, 'featured' => false],
            ['category' => 'Breakfast', 'name' => 'Ayib with Injera', 'description' => 'Fresh cheese served with warm injera', 'price' => 5.49, 'preparation_time' => 5, 'is_available' => true, 'featured' => false],

            // Lunch
            ['category' => 'Lunch', 'name' => 'Doro Wat', 'description' => 'Spicy chicken stew with eggs on injera', 'price' => 15.99, 'preparation_time' => 25, 'is_available' => true, 'featured' => true],
            ['category' => 'Lunch', 'name' => 'Shiro Wat', 'description' => 'Chickpea flour stew with berbere', 'price' => 9.99, 'preparation_time' => 15, 'is_available' => true, 'featured' => true],
            ['category' => 'Lunch', 'name' => 'Misir Wat', 'description' => 'Red lentil stew with onions', 'price' => 8.99, 'preparation_time' => 20, 'is_available' => true, 'featured' => false],
            ['category' => 'Lunch', 'name' => 'Beyaynetu', 'description' => 'Mixed vegetarian platter on injera', 'price' => 12.99, 'preparation_time' => 15, 'is_available' => true, 'featured' => false],

            // Dinner
            ['category' => 'Dinner', 'name' => 'Kitfo', 'description' => 'Minced raw beef with mitmita spice', 'price' => 16.99, 'preparation_time' => 10, 'is_available' => true, 'featured' => true],
            ['category' => 'Dinner', 'name' => 'Tibs', 'description' => 'Sautéed beef with peppers and rosemary', 'price' => 14.99, 'preparation_time' => 15, 'is_available' => true, 'featured' => true],
            ['category' => 'Dinner', 'name' => 'Gored Gored', 'description' => 'Cubed beef in spiced butter', 'price' => 16.99, 'preparation_time' => 12, 'is_available' => true, 'featured' => false],
            ['category' => 'Dinner', 'name' => 'Lamb Tibs', 'description' => 'Tender lamb with jalapeños', 'price' => 17.99, 'preparation_time' => 18, 'is_available' => true, 'featured' => false],

            // Desserts
            ['category' => 'Desserts', 'name' => 'Dabo Kolo', 'description' => 'Roasted spiced chickpea snack', 'price' => 3.99, 'preparation_time' => 5, 'is_available' => true, 'featured' => true],
            ['category' => 'Desserts', 'name' => 'Himbasha', 'description' => 'Traditional celebration bread', 'price' => 5.99, 'preparation_time' => 10, 'is_available' => true, 'featured' => false],
            ['category' => 'Desserts', 'name' => 'Kocho', 'description' => 'Fermented false banana bread', 'price' => 4.99, 'preparation_time' => 8, 'is_available' => true, 'featured' => false],
            ['category' => 'Desserts', 'name' => 'Halwa', 'description' => 'Ethiopian sweet halwa', 'price' => 4.49, 'preparation_time' => 5, 'is_available' => true, 'featured' => false],

            // Beverages
            ['category' => 'Beverages', 'name' => 'Tej', 'description' => 'Traditional honey wine', 'price' => 6.99, 'preparation_time' => 2, 'is_available' => true, 'featured' => true],
            ['category' => 'Beverages', 'name' => 'Tella', 'description' => 'Traditional Ethiopian beer', 'price' => 4.99, 'preparation_time' => 2, 'is_available' => true, 'featured' => false],
            ['category' => 'Beverages', 'name' => 'Spriss', 'description' => 'Layered fruit juice cocktail', 'price' => 5.99, 'preparation_time' => 5, 'is_available' => true, 'featured' => true],
            ['category' => 'Beverages', 'name' => 'Mango Juice', 'description' => 'Fresh mango juice', 'price' => 4.49, 'preparation_time' => 3, 'is_available' => true, 'featured' => false],

            // Hot Drinks
            ['category' => 'Hot Drinks', 'name' => 'Buna', 'description' => 'Traditional Ethiopian coffee', 'price' => 2.99, 'preparation_time' => 5, 'is_available' => true, 'featured' => true],
            ['category' => 'Hot Drinks', 'name' => 'Korerima Coffee', 'description' => 'Coffee brewed with korerima spice', 'price' => 3.99, 'preparation_time' => 5, 'is_available' => true, 'featured' => false],
            ['category' => 'Hot Drinks', 'name' => 'Tea', 'description' => 'Ethiopian spiced tea', 'price' => 2.49, 'preparation_time' => 4, 'is_available' => true, 'featured' => true],
            ['category' => 'Hot Drinks', 'name' => 'Spiced Tea', 'description' => 'Tea with cinnamon and cardamom', 'price' => 2.99, 'preparation_time' => 4, 'is_available' => true, 'featured' => false],
        ];

        foreach ($items as $data) {
            $category = MenuCategory::where('name', $data['category'])->where('branch_id', $branch?->id)->first();
            if ($category) {
                MenuItem::firstOrCreate(
                    ['name' => $data['name'], 'branch_id' => $branch?->id, 'category_id' => $category->id],
                    [
                        'branch_id' => $branch?->id,
                        'category_id' => $category->id,
                        'name' => $data['name'],
                        'description' => $data['description'],
                        'price' => $data['price'],
                        'preparation_time' => $data['preparation_time'],
                        'is_available' => $data['is_available'],
                        'featured' => $data['featured'],
                    ]
                );
            }
        }
    }
}
