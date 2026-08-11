<?php

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;

echo "=== Roles ===\n";
foreach (Role::all() as $r) {
    echo "id={$r->id} name={$r->name} guard={$r->guard_name}\n";
}

echo "\n=== Users (with role) ===\n";
foreach (User::with('role')->get() as $u) {
    $roleName = $u->role ? $u->role->name : 'NONE';
    echo "id={$u->id} name={$u->name} email={$u->email} role={$roleName} branch_id=" . ($u->branch_id ?? 'null') . "\n";
}

echo "\n=== Permissions with 'kitchen' ===\n";
foreach (Permission::where('name', 'like', '%kitchen%')->orWhere('name', 'like', '%order%')->get() as $p) {
    echo "id={$p->id} name={$p->name} guard={$p->guard_name}\n";
}
