<?php

function curlRequest(string $method, string $url, array $postData = null, array $cookies = null): array {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    if ($cookies !== null) {
        curl_setopt($ch, CURLOPT_COOKIE, $cookies);
    }
    if ($postData !== null) {
        $body = json_encode($postData);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-Requested-With: XMLHttpRequest',
            'X-Inertia: true',
            'X-Inertia-Version: ' . @file_get_contents('public/build/manifest.json'), // may not exist, will be null
        ]);
    } else {
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
        ]);
    }
    $response = curl_exec($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $header = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'header' => $header, 'body' => $body];
}

// Step 1: GET a route to establish session + XSRF-TOKEN cookie
$resp = curlRequest('GET', 'http://127.0.0.1:8000/api/orders/count?table_id=1');
echo "=== STEP 1: GET /api/orders/count ===\n";
echo "HTTP Code: {$resp['code']}\n";
echo "Headers:\n{$resp['header']}\n";

// Extract all Set-Cookie headers and build cookie string
preg_match_all('/^Set-Cookie:\s*(.+?)$/im', $resp['header'], $matches);
$cookies = [];
$xsrfToken = null;
foreach ($matches[1] as $cookieHeader) {
    $parts = explode(';', $cookieHeader);
    $nameValue = explode('=', $parts[0]);
    $name = $nameValue[0];
    $value = isset($nameValue[1]) ? $nameValue[1] : '';
    $cookies[] = $name . '=' . $value;
    if ($name === 'XSRF-TOKEN') {
        $xsrfToken = $value;
    }
}
echo "Extracted cookies: " . implode(', ', array_map(fn($c) => explode('=', $c)[0], $cookies)) . "\n";
echo "XSRF-TOKEN present: " . ($xsrfToken ? 'YES' : 'NO') . "\n";
$cookieStr = implode('; ', $cookies);

// Step 2: POST to /orders
echo "\n=== STEP 2: POST /orders ===\n";
$postData = [
    'table_id' => 1,  // table_number=1, but id might differ! Let me check
    'items' => [['id' => 1, 'quantity' => 1]],
    'special_instructions' => null,
    'source' => 'menu',
];
// Note: order_id will be omitted (undefined) like the frontend does

$ch = curl_init('http://127.0.0.1:8000/orders');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_COOKIE, $cookieStr);
$body = json_encode($postData);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
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
$respBody = substr($response, $headerSize);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP Code: {$code}\n";
echo "Response Headers:\n{$header}\n";
echo "Response Body:\n{$respBody}\n";
