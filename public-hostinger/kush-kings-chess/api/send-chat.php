<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$body = kkc_body();
$roomCode = kkc_room_code((string)($body['room_code'] ?? ''));
$game = kkc_require_game($roomCode);
$name = kkc_clean((string)($body['player_name'] ?? 'Grower'), 80) ?: 'Grower';
$message = kkc_clean((string)($body['message'] ?? ''), 500);

if ($message === '') {
    kkc_json(['ok' => false, 'error' => 'Message is empty.'], 400);
}

$stmt = kkc_db()->prepare('INSERT INTO kkc_chat (game_id, player_name, message) VALUES (?, ?, ?)');
$stmt->execute([$game['id'], $name, $message]);

kkc_json(['ok' => true, 'chat' => kkc_chat((int)$game['id'])]);
