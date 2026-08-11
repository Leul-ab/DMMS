<?php

use App\Models\Role;
use App\Models\Permission;
use App\Models\User;

echo "=== Role -> Permissions ===\n";
foreach (Role::with('permissions')->get() as $r) {
    $perms = $r->permissions->pluck('name')->toArray();
    echo "role={$r->name} (id={$r->id}): " . implode(', ', $perms) . "\n";
}

echo "\n=== User -> Roles (direct) ===\n";
foreach (User::with('roles')->get() as $u) {
    $roles = $u->roles->pluck('name')->toArray();
    echo "user={$u->name} (id={$u->id}): roles=" . implode(',', $roles) . "\n";
}
