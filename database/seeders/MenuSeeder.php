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
            ['name' => 'Breakfast', 'description' => 'Traditional Ethiopian morning meals', 'sort_order' => 1, 'is_active' => true],
            ['name' => 'Lunch', 'description' => 'Hearty midday injera platters', 'sort_order' => 2, 'is_active' => true],
            ['name' => 'Dinner', 'description' => 'Evening traditional feasts', 'sort_order' => 3, 'is_active' => true],
            ['name' => 'Beverage', 'description' => 'Refreshing traditional drinks', 'sort_order' => 4, 'is_active' => true],
            ['name' => 'Hot Drink', 'description' => 'Coffee, tea and warm drinks', 'sort_order' => 5, 'is_active' => true],
        ];

        foreach ($categories as $data) {
            MenuCategory::firstOrCreate(
                ['name' => $data['name'], 'branch_id' => $branch?->id],
                $data
            );
        }

        $items = [
            // Breakfast
            ['category' => 'Breakfast', 'name' => 'Firfir', 'description' => 'Shredded injera tossed in spicy berbere sauce', 'price' => 150.00, 'preparation_time' => 10, 'is_available' => true, 'featured' => true],
            ['category' => 'Breakfast', 'name' => 'Chechebsa', 'description' => 'Torn kita bread with berbere, kibbeh and honey', 'price' => 130.00, 'preparation_time' => 8, 'is_available' => true, 'featured' => false],
            ['category' => 'Breakfast', 'name' => 'Genfo', 'description' => 'Barley porridge with spiced clarified butter', 'price' => 120.00, 'preparation_time' => 10, 'is_available' => true, 'featured' => false],
            ['category' => 'Breakfast', 'name' => 'Fatira', 'description' => 'Layered fried pastry stuffed with egg', 'price' => 110.00, 'preparation_time' => 12, 'is_available' => true, 'featured' => false],
            ['category' => 'Breakfast', 'name' => 'Ful Medames', 'description' => 'Mashed fava beans with tomato, onion and chili', 'price' => 100.00, 'preparation_time' => 8, 'is_available' => true, 'featured' => false],

            // Lunch
            ['category' => 'Lunch', 'name' => 'Doro Wot', 'description' => 'Slow-cooked chicken stew with boiled egg on injera', 'price' => 350.00, 'preparation_time' => 25, 'is_available' => true, 'featured' => true],
            ['category' => 'Lunch', 'name' => 'Misir Wot', 'description' => 'Spicy red lentil stew served on injera', 'price' => 180.00, 'preparation_time' => 15, 'is_available' => true, 'featured' => false],
            ['category' => 'Lunch', 'name' => 'Shiro Wot', 'description' => 'Silky chickpea flour stew with garlic and berbere', 'price' => 170.00, 'preparation_time' => 15, 'is_available' => true, 'featured' => false],
            ['category' => 'Lunch', 'name' => 'Beyaynetu', 'description' => 'Fasting platter of assorted vegan stews on injera', 'price' => 250.00, 'preparation_time' => 20, 'is_available' => true, 'featured' => true],
            ['category' => 'Lunch', 'name' => 'Gomen Besiga', 'description' => 'Collard greens simmered with tender beef', 'price' => 300.00, 'preparation_time' => 20, 'is_available' => true, 'featured' => false],

            // Dinner
            ['category' => 'Dinner', 'name' => 'Kitfo Special', 'description' => 'Minced beef seasoned with mitmita and kibbeh, with ayib and gomen', 'price' => 550.00, 'preparation_time' => 20, 'is_available' => true, 'featured' => true],
            ['category' => 'Dinner', 'name' => 'Shekla Tibs', 'description' => 'Sizzling beef cubes sauteed with rosemary, served in a clay dish', 'price' => 480.00, 'preparation_time' => 25, 'is_available' => true, 'featured' => false],
            ['category' => 'Dinner', 'name' => 'Zilzil Tibs', 'description' => 'Strips of beef stir-fried with onions and peppers', 'price' => 450.00, 'preparation_time' => 22, 'is_available' => true, 'featured' => false],
            ['category' => 'Dinner', 'name' => 'Yebeg Alicha', 'description' => 'Mild lamb stew cooked with turmeric and spices', 'price' => 500.00, 'preparation_time' => 30, 'is_available' => true, 'featured' => false],
            ['category' => 'Dinner', 'name' => 'Derek Kikil', 'description' => 'Slow-simmered beef shank with awaze dipping sauce', 'price' => 520.00, 'preparation_time' => 35, 'is_available' => true, 'featured' => false],

            // Beverage
            ['category' => 'Beverage', 'name' => 'Tej', 'description' => 'Traditional honey wine brewed with gesho', 'price' => 180.00, 'preparation_time' => 3, 'is_available' => true, 'featured' => true],
            ['category' => 'Beverage', 'name' => 'Tella', 'description' => 'Homemade traditional barley beer', 'price' => 120.00, 'preparation_time' => 3, 'is_available' => true, 'featured' => false],
            ['category' => 'Beverage', 'name' => 'Spris', 'description' => 'Layered fresh avocado, mango and papaya juice', 'price' => 150.00, 'preparation_time' => 6, 'is_available' => true, 'featured' => false],
            ['category' => 'Beverage', 'name' => 'Ambo Water', 'description' => 'Naturally carbonated Ethiopian mineral water', 'price' => 60.00, 'preparation_time' => 2, 'is_available' => true, 'featured' => false],
            ['category' => 'Beverage', 'name' => 'Fresh Mango Juice', 'description' => 'Freshly blended seasonal mango', 'price' => 120.00, 'preparation_time' => 5, 'is_available' => true, 'featured' => false],

            // Hot Drink
            ['category' => 'Hot Drink', 'name' => 'Buna (Ethiopian Coffee)', 'description' => 'Traditional jebena-brewed coffee ceremony style', 'price' => 80.00, 'preparation_time' => 10, 'is_available' => true, 'featured' => true],
            ['category' => 'Hot Drink', 'name' => 'Macchiato', 'description' => 'Espresso topped with steamed milk, Ethiopian style', 'price' => 90.00, 'preparation_time' => 5, 'is_available' => true, 'featured' => false],
            ['category' => 'Hot Drink', 'name' => 'Shai (Tea)', 'description' => 'Black tea brewed with fresh ginger and spices', 'price' => 50.00, 'preparation_time' => 5, 'is_available' => true, 'featured' => false],
            ['category' => 'Hot Drink', 'name' => 'Atmit', 'description' => 'Warm roasted barley drink with milk and honey', 'price' => 70.00, 'preparation_time' => 7, 'is_available' => true, 'featured' => false],
            ['category' => 'Hot Drink', 'name' => 'Hot Chocolate', 'description' => 'Rich cocoa made with steamed milk', 'price' => 100.00, 'preparation_time' => 6, 'is_available' => true, 'featured' => false],
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