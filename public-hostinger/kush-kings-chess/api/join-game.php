<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$body = kkc_body();
$roomCode = kkc_room_code((string)($body['room_code'] ?? ''));
$name = kkc_clean((string)($body['player_name'] ?? 'Grower'), 80) ?: 'Grower';
$playerKey = kkc_token($body['player_token'] ?? null);
$game = kkc_require_game($roomCode);
$pdo = kkc_db();

$side = 'spectator';
if (empty($game['dark_player_name'])) {
    $side = 'dark';
    $stmt = $pdo->prepare('UPDATE kkc_games SET dark_player_name = ?, status = ? WHERE id = ?');
    $stmt->execute([$name, 'active', $game['id']]);
} elseif (empty($game['light_player_name'])) {
    $side = 'light';
    $stmt = $pdo->prepare('UPDATE kkc_games SET light_player_name = ?, status = ? WHERE id = ?');
    $stmt->execute([$name, 'active', $game['id']]);
}

$stmt = $pdo->prepare('INSERT INTO kkc_players (game_id, player_token, player_name, side) VALUES (?, ?, ?, ?)');
$stmt->execute([(int)$game['id'], $playerKey, $name, $side]);

$game = kkc_require_game($roomCode);
kkc_json(['ok' => true, 'player_token' => $playerKey, 'side' => $side, 'game' => kkc_public_game($game)]);
