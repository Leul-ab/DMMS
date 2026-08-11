<?php

use Illuminate\Support\Facades\DB;

$beforeCount = DB::table('orders')->count();
echo "Orders BEFORE: {$beforeCount}\n";
echo "Orders BEFORE (table_id=1): " . DB::table('orders')->where('table_id', 1)->count() . "\n";

$cookieFile = tempnam(sys_get_temp_dir(), 'cookies_');

$ch = curl_init('http://127.0.0.1:8000/api/orders/count?table_id=1');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
curl_exec($ch);
curl_close($ch);

$cookieContent = file_get_contents($cookieFile);
preg_match('/XSRF-TOKEN\s+(.+)/', $cookieContent, $m);
$xsrfToken = trim($m[1] ?? '');

echo "\n=== POST /orders ===\n";
$postData = [
    'table_id' => 1,
    'items' => [['id' => 1, 'quantity' => 1]],
    'special_instructions' => null,
    'source' => 'menu',
];

$ch = curl_init('http://127.0.0.1:8000/orders');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'X-Requested-With: XMLHttpRequest',
    'X-Inertia: true',
    'X-XSRF-TOKEN: ' . rawurldecode($xsrfToken),
]);
$response = curl_exec($ch);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header = substr($response, 0, $headerSize);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP Code: {$code}\n";
preg_match('/^Location:\s*(.+)$/im', $header, $lm);
echo "Location: " . ($lm[1] ?? 'none') . "\n";

echo "\n=== Orders AFTER (raw SQL) ===\n";
echo "Total orders: " . DB::table('orders')->count() . "\n";
$latest = DB::table('orders')->orderBy('id', 'desc')->first();
if ($latest) {
    echo "Latest order: id={$latest->id} table_id={$latest->table_id} branch_id={$latest->branch_id} status={$latest->status} total={$latest->total_amount}\n";
    echo "Order items for latest: " . DB::table('order_items')->where('order_id', $latest->id)->count() . "\n";
} else {
    echo "NO orders at all!\n";
}

@unlink($cookieFile);
