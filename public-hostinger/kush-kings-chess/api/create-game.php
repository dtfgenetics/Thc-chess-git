<?php
declare(strict_types=1);

require __DIR__ . '/_shared.php';
require __DIR__ . '/guards.php';
kkc_require_method('POST');

$data = kkc_request_data();
$token = kkc_required_player_token($data);
$tokenHash = kkc_token_hash($token);
$name = kkc_clean_name(kkc_nullable_scalar_string($data['name'] ?? null, 'Player name must be text.'));
$sideInput = kkc_scalar_string($data['side'] ?? 'random', 'Starting side must be text.');
$requestedSide = in_array($sideInput, ['white', 'black', 'random'], true) ? $sideInput : 'random';
$side = $requestedSide === 'random' ? (random_int(0, 1) === 0 ? 'white' : 'black') : $requestedSide;
$unlisted = !empty($data['unlisted']) ? 1 : 0;

$pdo = kkc_db();

// Waiting rooms are disposable. Prune rooms that never found a second player so
// their player rows disappear through the existing foreign-key cascade.
$pdo->exec(
    "DELETE FROM kkc_games
     WHERE status = 'waiting'
       AND updated_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 HOUR)"
);

kkc_limit_room_creation($pdo, $tokenHash);

try {
    $pdo->beginTransaction();

    $code = kkc_generate_code($pdo);
    $whiteHash = $side === 'white' ? $tokenHash : null;
    $blackHash = $side === 'black' ? $tokenHash : null;
    $whiteName = $side === 'white' ? $name : null;
    $blackName = $side === 'black' ? $name : null;

    $stmt = $pdo->prepare(
        'INSERT INTO kkc_games
            (code, host_token_hash, white_token_hash, black_token_hash, white_name, black_name,
             pgn, fen, turn, status, move_number, unlisted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    );
    $stmt->execute([
        $code,
        $tokenHash,
        $whiteHash,
        $blackHash,
        $whiteName,
        $blackName,
        '',
        KKC_START_FEN,
        'w',
        'waiting',
        $unlisted,
    ]);

    $gameId = (int) $pdo->lastInsertId();
    kkc_touch_player($pdo, $gameId, $tokenHash, $name, $side);
    $game = kkc_load_game($pdo, $code, false);

    $pdo->commit();
    kkc_json(['game' => kkc_public_game($pdo, $game, $tokenHash)]);
} catch (Throwable $err) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($err->getMessage());
    kkc_error('Could not create the room.', 500);
}
