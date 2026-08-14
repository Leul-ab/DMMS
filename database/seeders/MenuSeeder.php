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
            ['name' => 'Breakfast', 'description' => 'Start your day right', 'sort_order' => 1, 'is_active' => true],
            ['name' => 'Lunch', 'description' => 'Midday meals', 'sort_order' => 2, 'is_active' => true],
            ['name' => 'Dinner', 'description' => 'Evening dining', 'sort_order' => 3, 'is_active' => true],
            ['name' => 'Beverages', 'description' => 'Refreshing drinks', 'sort_order' => 4, 'is_active' => true],
            ['name' => 'Desserts', 'description' => 'Sweet treats', 'sort_order' => 5, 'is_active' => true],
            ['name' => 'Pizza', 'description' => 'Wood-fired pizzas', 'sort_order' => 6, 'is_active' => true],
            ['name' => 'Burgers', 'description' => 'Juicy burgers', 'sort_order' => 7, 'is_active' => true],
        ];

        foreach ($categories as $data) {
            MenuCategory::firstOrCreate(
                ['name' => $data['name'], 'branch_id' => $branch?->id],
                $data
            );
        }

        $items = [
            // Breakfast
            ['category' => 'Breakfast', 'name' => 'Pancakes', 'description' => 'Fluffy pancakes with maple syrup', 'price' => 8.99, 'preparation_time' => 10, 'is_available' => true, 'featured' => true],
            ['category' => 'Breakfast', 'name' => 'Omelette', 'description' => 'Three-egg omelette with vegetables', 'price' => 7.99, 'preparation_time' => 8, 'is_available' => true, 'featured' => false],
            ['category' => 'Breakfast', 'name' => 'French Toast', 'description' => 'Golden-brown french toast with berries', 'price' => 9.49, 'preparation_time' => 10, 'is_available' => true, 'featured' => false],

            // Lunch
            ['category' => 'Lunch', 'name' => 'Caesar Salad', 'description' => 'Crisp romaine with parmesan and croutons', 'price' => 10.99, 'preparation_time' => 8, 'is_available' => true, 'featured' => false],
            ['category' => 'Lunch', 'name' => 'Grilled Chicken Sandwich', 'description' => 'Herb-marinated chicken breast on sourdough', 'price' => 11.99, 'preparation_time' => 12, 'is_available' => true, 'featured' => true],
            ['category' => 'Lunch', 'name' => 'Soup of the Day', 'description' => 'Freshly made daily soup', 'price' => 5.99, 'preparation_time' => 5, 'is_available' => true, 'featured' => false],

            // Dinner
            ['category' => 'Dinner', 'name' => 'Grilled Salmon', 'description' => 'Atlantic salmon with lemon butter sauce', 'price' => 18.99, 'preparation_time' => 20, 'is_available' => true, 'featured' => true],
            ['category' => 'Dinner', 'name' => 'Steak Frites', 'description' => 'Ribeye steak with seasoned fries', 'price' => 24.99, 'preparation_time' => 25, 'is_available' => true, 'featured' => false],
            ['category' => 'Dinner', 'name' => 'Pasta Carbonara', 'description' => 'Classic carbonara with pancetta', 'price' => 14.99, 'preparation_time' => 15, 'is_available' => true, 'featured' => false],

            // Beverages
            ['category' => 'Beverages', 'name' => 'Fresh Orange Juice', 'description' => 'Squeezed to order', 'price' => 3.99, 'preparation_time' => 3, 'is_available' => true, 'featured' => false],
            ['category' => 'Beverages', 'name' => 'Italian Soda', 'description' => 'Sparkling water with fruit syrup', 'price' => 3.49, 'preparation_time' => 2, 'is_available' => true, 'featured' => false],
            ['category' => 'Beverages', 'name' => 'Espresso', 'description' => 'Double shot espresso', 'price' => 2.49, 'preparation_time' => 2, 'is_available' => true, 'featured' => false],
            ['category' => 'Beverages', 'name' => 'Iced Coffee', 'description' => 'Cold brew with ice', 'price' => 3.99, 'preparation_time' => 3, 'is_available' => true, 'featured' => true],
            // Desserts
            ['category' => 'Desserts', 'name' => 'Chocolate Cake', 'description' => 'Rich chocolate layer cake', 'price' => 6.99, 'preparation_time' => 5, 'is_available' => true, 'featured' => true],
            ['category' => 'Desserts', 'name' => 'Tiramisu', 'description' => 'Classic Italian tiramisu', 'price' => 7.49, 'preparation_time' => 3, 'is_available' => true, 'featured' => false],
            ['category' => 'Desserts', 'name' => 'Ice Cream Sundae', 'description' => 'Vanilla ice cream with toppings', 'price' => 5.99, 'preparation_time' => 3, 'is_available' => true, 'featured' => false],

            // Pizza
            ['category' => 'Pizza', 'name' => 'Margherita', 'description' => 'Tomato, mozzarella, basil', 'price' => 11.99, 'preparation_time' => 15, 'is_available' => true, 'featured' => true],
            ['category' => 'Pizza', 'name' => 'Pepperoni', 'description' => 'Classic pepperoni pizza', 'price' => 13.49, 'preparation_time' => 15, 'is_available' => true, 'featured' => false],
            ['category' => 'Pizza', 'name' => 'BBQ Chicken', 'description' => 'BBQ sauce, chicken, red onions', 'price' => 14.99, 'preparation_time' => 18, 'is_available' => true, 'featured' => false],

            // Burgers
            ['category' => 'Burgers', 'name' => 'Classic Burger', 'description' => 'Beef patty with lettuce, tomato, onion', 'price' => 10.99, 'preparation_time' => 12, 'is_available' => true, 'featured' => true],
            ['category' => 'Burgers', 'name' => 'Cheese Burger', 'description' => 'Classic with melted cheddar', 'price' => 11.99, 'preparation_time' => 12, 'is_available' => true, 'featured' => false],
            ['category' => 'Burgers', 'name' => 'Bacon Burger', 'description' => 'Topped with crispy bacon', 'price' => 13.49, 'preparation_time' => 14, 'is_available' => true, 'featured' => false],
            ['category' => 'Burgers', 'name' => 'Veggie Burger', 'description' => 'Plant-based patty with fresh toppings', 'price' => 11.49, 'preparation_time' => 12, 'is_available' => true, 'featured' => false],
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