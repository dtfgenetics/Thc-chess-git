<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$body = kkc_body();
$name = kkc_clean((string)($body['player_name'] ?? 'Grower'), 80) ?: 'Grower';
$playerKey = kkc_token($body['player_token'] ?? null);
$roomCode = kkc_room_code();
$pdo = kkc_db();

$pdo->beginTransaction();
$stmt = $pdo->prepare('INSERT INTO kkc_games (room_code, light_player_name, current_fen, move_json, status) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$roomCode, $name, KKC_START_FEN, '[]', 'waiting']);
$gameId = (int)$pdo->lastInsertId();
$player = $pdo->prepare('INSERT INTO kkc_players (game_id, player_token, player_name, side) VALUES (?, ?, ?, ?)');
$player->execute([$gameId, $playerKey, $name, 'light']);
$pdo->commit();

$game = kkc_require_game($roomCode);
kkc_json(['ok' => true, 'player_token' => $playerKey, 'side' => 'light', 'game' => kkc_public_game($game)]);
