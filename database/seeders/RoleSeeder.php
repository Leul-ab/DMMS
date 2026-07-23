<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super_admin', 'description' => 'Full system access'],
            ['name' => 'Manager', 'slug' => 'manager', 'description' => 'Restaurant operations and statistics'],
            ['name' => 'Branch Manager', 'slug' => 'branch_manager', 'description' => 'Manages branch operations'],
            ['name' => 'Waiter', 'slug' => 'waiter', 'description' => 'Serve orders to customers'],
            ['name' => 'Cashier', 'slug' => 'cashier', 'description' => 'Handle payments and transactions'],
            ['name' => 'Chef', 'slug' => 'chef', 'description' => 'Prepare and cook meals'],
            ['name' => 'Kitchen Manager', 'slug' => 'kitchen_manager', 'description' => 'Manage kitchen operations and staff'],
            ['name' => 'Kitchen Staff', 'slug' => 'kitchen_staff', 'description' => 'View and manage kitchen orders'],
            ['name' => 'Inventory Manager', 'slug' => 'inventory_manager', 'description' => 'Manage inventory and stock'],
            ['name' => 'Accountant', 'slug' => 'accountant', 'description' => 'Manage finances and accounting'],
            ['name' => 'Customer', 'slug' => 'customer', 'description' => 'Scan QR and place orders'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }
    }
}
