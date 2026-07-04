<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$input = kkc_body();
$roomCode = kkc_room_code((string)($input['room_code'] ?? ''));
$game = kkc_require_game($roomCode);

kkc_json(['ok' => true, 'game' => kkc_public_game($game)]);
