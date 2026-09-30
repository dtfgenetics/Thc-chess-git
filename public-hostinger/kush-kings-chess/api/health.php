<?php
declare(strict_types=1);

require __DIR__ . '/_shared.php';
require __DIR__ . '/guards.php';
kkc_require_method('GET');

$dbOk = false;

try {
    kkc_db()->query('SELECT 1');
    $dbOk = true;
} catch (Throwable $err) {
    error_log('Kush Kings Chess health check failed: ' . $err->getMessage());
}

kkc_json([
    'ok' => $dbOk,
    'service' => 'kush-kings-chess',
    'database' => $dbOk ? 'connected' : 'unavailable',
], $dbOk ? 200 : 503);
