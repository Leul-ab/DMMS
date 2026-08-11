<?php

use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RestaurantTable;
use App\Models\MenuItem;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;

echo "=== Branches ===\n";
foreach (Branch::all() as $b) {
    echo "id={$b->id} name={$b->name} slug={$b->slug} branch_id_col=" . ($b->branch_id ?? 'n/a') . "\n";
}

echo "\n=== Tables (branch_id set) ===\n";
foreach (RestaurantTable::all() as $t) {
    echo "id={$t->id} table_number={$t->table_number} status={$t->status} branch_id={$t->branch_id} current_order_id=" . ($t->current_order_id ?? 'null') . "\n";
}

echo "\n=== Menu Items (first 5) ===\n";
$mi = MenuItem::limit(5)->get();
foreach ($mi as $m) {
    echo "id={$m->id} name={$m->name} price={$m->price} prep_time=" . ($m->preparation_time ?? 'null') . " branch_id={$m->branch_id} is_available=" . ($m->is_available ? '1' : '0') . "\n";
}

echo "\n=== Customers ===\n";
foreach (Customer::all() as $c) {
    echo "id={$c->id} name={$c->name} customer_code={$c->customer_code} branch_id={$c->branch_id}\n";
}

echo "\n=== All orders ===\n";
foreach (Order::with('table')->orderBy('id')->get() as $o) {
    echo "id={$o->id} order_number={$o->order_number} status={$o->status} table_id={$o->table_id} branch_id={$o->branch_id} total={$o->total_amount} customer_id=" . ($o->customer_id ?? 'null') . "\n";
}

echo "\n=== Setting branch current and testing store logic ===\n";
Branch::setCurrent(1);
$branch = Branch::current();
echo "current branch: " . ($branch ? $branch->id : 'NULL') . "\n";

