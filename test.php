<?php

use App\Models\Branch;
use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$response = $kernel->handle(
    $request = Request::capture()
);

echo "Order SQL:\n";
echo Order::query()->toSql()."\n\n";

echo "User SQL:\n";
$branch = Branch::current();
echo User::query()->when($branch, function ($query, $b) {
    $query->where('branch_id', $b->id);
})->toSql()."\n";
