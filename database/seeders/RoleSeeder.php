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
            ['name' => 'Kitchen Staff', 'slug' => 'kitchen_staff', 'description' => 'View and manage kitchen orders'],
            ['name' => 'Waiter', 'slug' => 'waiter', 'description' => 'Serve orders to customers'],
            ['name' => 'Customer', 'slug' => 'customer', 'description' => 'Scan QR and place orders'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }
    }
}
