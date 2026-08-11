<?php

use Illuminate\Support\Facades\Schema;

echo "=== orders columns ===\n";
foreach (Schema::getColumnListing('orders') as $col) {
    echo "  - $col\n";
}

echo "\n=== order_items columns ===\n";
foreach (Schema::getColumnListing('order_items') as $col) {
    echo "  - $col\n";
}

echo "\n=== restaurant_tables columns ===\n";
foreach (Schema::getColumnListing('restaurant_tables') as $col) {
    echo "  - $col\n";
}

echo "\n=== orders row count ===\n";
echo "count: " . \App\Models\Order::count() . "\n";

echo "\n=== branches ===\n";
$branches = \App\Models\Branch::all();
foreach ($branches as $b) {
    echo "  branch id={$b->id} name={$b->name} slug={$b->slug}\n";
}

echo "\n=== sample order ===\n";
$order = \App\Models\Order::with(['orderItems', 'table'])->first();
if ($order) {
    echo "  id={$order->id} status={$order->status} table_id={$order->table_id} branch_id={$order->branch_id} customer_id={$order->customer_id} total={$order->total_amount}\n";
}
