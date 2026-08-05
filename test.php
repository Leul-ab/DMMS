<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

echo "Order SQL:\n";
echo App\Models\Order::query()->toSql() . "\n\n";

echo "User SQL:\n";
$branch = App\Models\Branch::current();
echo App\Models\User::query()->when($branch, function ($query, $b) {
    $query->where('branch_id', $b->id);
})->toSql() . "\n";
