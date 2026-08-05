<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);
$dateFormat = '%Y-%m-%d';
$sql = App\Models\Order::query()
    ->select(
        Illuminate\Support\Facades\DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as period"),
        Illuminate\Support\Facades\DB::raw('COUNT(*) as total_orders'),
        Illuminate\Support\Facades\DB::raw('SUM(total_amount) as revenue')
    )
    ->groupBy('period')
    ->orderByDesc('period')
    ->toSql();

echo "Revenue Report SQL:\n$sql\n";
