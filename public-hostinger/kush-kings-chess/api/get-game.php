<?php
declare(strict_types=1);

require __DIR__ . '/_shared.php';
require __DIR__ . '/guards.php';
kkc_require_method('GET');

$data = kkc_request_data();
$code = kkc_normalize_code(kkc_nullable_scalar_string($data['code'] ?? null, 'Room code must be text.'));
$token = kkc_request_player_token($data);
$tokenHash = $token !== null ? kkc_token_hash($token) : null;
$chatAfterInput = $data['chatAfterId'] ?? 0;
$chatAfterId = is_int($chatAfterInput) || (is_string($chatAfterInput) && ctype_digit($chatAfterInput))
    ? max(0, (int) $chatAfterInput)
    : 0;

$pdo = kkc_db();
$game = kkc_load_game($pdo, $code, false);

if ($tokenHash) {
    $side = kkc_viewer_side($game, $tokenHash);
    if ($side === 'white' || $side === 'black') {
        $name = $side === 'white' ? ($game['white_name'] ?: 'Grower') : ($game['black_name'] ?: 'Grower');
        kkc_touch_player($pdo, (int) $game['id'], $tokenHash, $name, $side);
    }
}

$lastMoveStmt = $pdo->prepare(
    'SELECT move_number, from_square, to_square, promotion, san
     FROM kkc_moves
     WHERE game_id = ?
     ORDER BY move_number DESC
     LIMIT 1'
);
$lastMoveStmt->execute([(int) $game['id']]);
$lastMoveRow = $lastMoveStmt->fetch();
$lastMove = $lastMoveRow ? [
    'moveNumber' => (int) $lastMoveRow['move_number'],
    'from' => $lastMoveRow['from_square'],
    'to' => $lastMoveRow['to_square'],
    'promotion' => $lastMoveRow['promotion'] ?: null,
    'san' => $lastMoveRow['san'],
] : null;

$payload = kkc_public_game($pdo, $game, $tokenHash, $chatAfterId);
$payload['lastMove'] = $lastMove;

kkc_json(['game' => $payload]);
