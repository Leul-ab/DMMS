<?php

use App\Models\Order;
use App\Models\OrderItem;

echo "=== Latest order for table 1 ===\n";
$order = Order::where('table_id', 1)->latest()->first();
if (!$order) {
    echo "No order found for table 1!\n";
} else {
    echo "id={$order->id} order_number={$order->order_number} status={$order->status} table_id={$order->table_id} branch_id={$order->branch_id} total_amount={$order->total_amount} customer_id=" . ($order->customer_id ?? 'null') . " special_instructions=" . ($order->special_instructions ?? 'null') . "\n";
    echo "order_items:\n";
    foreach ($order->orderItems as $oi) {
        echo "  id={$oi->id} order_id={$oi->id} menu_item_id={$oi->menu_item_id} quantity={$oi->quantity} price={$oi->price} status={$oi->status} branch_id={$oi->branch_id}\n";
    }
}

echo "\n=== Count of pending orders (kitchen new orders) ===\n";
echo Order::where('status', 'pending')->count() . "\n";

echo "\n=== Kitchen dashboard scope check (orders visible to kitchen) ===\n";
echo "Orders in [pending,preparing,ready,completed]: " . Order::whereIn('status', ['pending','preparing','ready','completed'])->count() . "\n";
