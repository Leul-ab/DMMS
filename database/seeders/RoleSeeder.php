<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Permissions granted to each role (by role slug).
     * Roles are composed from the seeded button/sidebar permissions.
     */
    private array $rolePermissions = [
        'super_admin' => '*',
        'manager' => [
            'view branches',
            'show branches',
            'switch branches',
            'view dashboard',
            'view all branches dashboard',
            'view menu categories',
            'create menu categories',
            'update menu categories',
            'delete menu categories',
            'status menu categories',
            'view menu items',
            'create menu items',
            'update menu items',
            'delete menu items',
            'status menu items',
            'view tables',
            'create tables',
            'update tables',
            'delete tables',
            'status tables',
            'view customers',
            'create customers',
            'update customers',
            'delete customers',
            'status customers',
            'view orders',
            'show orders',
            'update orders',
            'delete orders',
            'status orders',
            'view bookings',
            'update bookings',
            'delete bookings',
            'status bookings',
            'view reports',
            'view feedback',
            'view kitchen',
            'update kitchen',
            'view menu',
            'view payment verification',
            'verify payments',
            'reject payments',
            'view payments',
            'status payments',
            'view serve',
            'update serve',
            'view discounts',
            'create discounts',
            'update discounts',
            'delete discounts',
            'toggle discount status',
        ],
        'kitchen_staff' => [
            'view kitchen',
            'update kitchen',
            'view menu',
        ],
        'waiter' => [
            'view menu',
            'view orders',
            'view serve',
            'update serve',
        ],
        'customer' => [],
    ];

    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super_admin', 'description' => 'Full system access'],
            ['name' => 'Manager', 'slug' => 'manager', 'description' => 'Restaurant operations and statistics'],
            ['name' => 'Kitchen Staff', 'slug' => 'kitchen_staff', 'description' => 'View and manage kitchen orders'],
            ['name' => 'Waiter', 'slug' => 'waiter', 'description' => 'Serve orders to customers'],
            ['name' => 'Customer', 'slug' => 'customer', 'description' => 'Scan QR and place orders'],
        ];

        $allPermissions = Permission::pluck('name');

        foreach ($roles as $role) {
            $role = Role::updateOrCreate(
                ['slug' => $role['slug']],
                ['name' => $role['name'], 'guard_name' => 'web', 'description' => $role['description']],
            );

            $permissions = $this->rolePermissions[$role->slug] ?? [];
            if ($permissions === '*') {
                $permissions = $allPermissions->all();
            }

            $role->syncPermissions($permissions);
        }
    }
}
