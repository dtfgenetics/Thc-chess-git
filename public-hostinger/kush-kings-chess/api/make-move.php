<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$body = kkc_body();
$roomCode = kkc_room_code((string)($body['room_code'] ?? ''));
$game = kkc_require_game($roomCode);

$side = (string)($body['side'] ?? '');
$from = strtolower((string)($body['from'] ?? ''));
$to = strtolower((string)($body['to'] ?? ''));
$fenAfter = trim((string)($body['fen_after'] ?? ''));
$san = kkc_clean((string)($body['san'] ?? ''), 32);

if ($game['status'] === 'complete') {
    kkc_json(['ok' => false, 'error' => 'Game is complete.'], 409);
}
if (!in_array($side, ['light', 'dark'], true)) {
    kkc_json(['ok' => false, 'error' => 'Invalid side.'], 400);
}
if (!preg_match('/^[a-h][1-8]$/', $from) || !preg_match('/^[a-h][1-8]$/', $to)) {
    kkc_json(['ok' => false, 'error' => 'Invalid squares.'], 400);
}
if ($side !== kkc_side_from_fen($game['current_fen'])) {
    kkc_json(['ok' => false, 'error' => 'It is not your turn.'], 409);
}
if (!kkc_fen_has_piece_for_side($game['current_fen'], $from, $side)) {
    kkc_json(['ok' => false, 'error' => 'No matching piece on that square.'], 409);
}
if ($fenAfter === '') {
    kkc_json(['ok' => false, 'error' => 'Missing board state.'], 400);
}

$pdo = kkc_db();
$stmt = $pdo->prepare('SELECT COALESCE(MAX(move_number), 0) + 1 AS next_move FROM kkc_moves WHERE game_id = ?');
$stmt->execute([$game['id']]);
$moveNumber = (int)($stmt->fetch()['next_move'] ?? 1);

$pdo->beginTransaction();
$stmt = $pdo->prepare('INSERT INTO kkc_moves (game_id, move_number, side, from_square, to_square, fen_after, san) VALUES (?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([$game['id'], $moveNumber, $side, $from, $to, $fenAfter, $san]);
$stmt = $pdo->prepare('UPDATE kkc_games SET current_fen = ?, pgn = CONCAT(COALESCE(pgn, ""), ?), status = ? WHERE id = ?');
$stmt->execute([$fenAfter, trim($san) . ' ', 'active', $game['id']]);
$pdo->commit();

$game = kkc_require_game($roomCode);
kkc_json(['ok' => true, 'game' => kkc_public_game($game)]);
