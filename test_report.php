<?php

use App\Models\Order;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$response = $kernel->handle(
    $request = Request::capture()
);
$dateFormat = '%Y-%m-%d';
$sql = Order::query()
    ->select(
        DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as period"),
        DB::raw('COUNT(*) as total_orders'),
        DB::raw('SUM(total_amount) as revenue')
    )
    ->groupBy('period')
    ->orderByDesc('period')
    ->toSql();

echo "Revenue Report SQL:\n$sql\n";
