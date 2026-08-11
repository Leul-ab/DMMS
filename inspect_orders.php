<?php

use App\Models\Order;
use App\Models\OrderItem;

echo "=== All orders (bypassing scope) ===\n";
$orders = Order::withoutGlobalScopes()->orderBy('id')->get();
foreach ($orders as $o) {
    $items = OrderItem::where('order_id', $o->id)->withoutGlobalScopes()->get();
    echo "id={$o->id} order_number={$o->order_number} status={$o->status} table_id={$o->table_id} branch_id={$o->branch_id} total={$o->total_amount} items=" . $items->count() . "\n";
    foreach ($items as $oi) {
        echo "  OI id={$oi->id} menu_item_id={$oi->menu_item_id} qty={$oi->quantity} price={$oi->price} status={$oi->status} branch_id={$oi->branch_id}\n";
    }
}
