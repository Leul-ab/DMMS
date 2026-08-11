<?php

// Read and filter the laravel log for errors
$logFile = 'storage/logs/laravel.log';
if (!file_exists($logFile)) { echo "No log file.\n"; return; }

$content = file_get_contents($logFile);
// Split by log entry (each starts with a date or [date])
$lines = explode("\n", $content);

$keywords = ['Order', 'order', 'QueryException', 'Integrity', 'SQLSTATE', 'Column', 'branch', '500', 'exception', 'Error', 'store'];
$matches = [];
foreach ($lines as $i => $line) {
    foreach ($keywords as $kw) {
        if (stripos($line, $kw) !== false) {
            $matches[] = trim($line);
            break;
        }
    }
}

echo "Total matching lines: " . count($matches) . "\n";
echo "=== Last 50 matches ===\n";
foreach (array_slice($matches, -50) as $m) {
    echo $m . "\n";
}
