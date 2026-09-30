<?php
declare(strict_types=1);

require __DIR__ . '/_shared.php';
require __DIR__ . '/guards.php';
kkc_require_method('POST');

$data = kkc_request_data();
$code = kkc_normalize_code(kkc_nullable_scalar_string($data['code'] ?? null, 'Room code must be text.'));
$token = kkc_required_player_token($data);
$tokenHash = kkc_token_hash($token);

$pdo = kkc_db();

try {
    $pdo->beginTransaction();
    $game = kkc_load_game($pdo, $code, true);

    if ($game['status'] !== 'active') {
        kkc_error('Only an active match can be resigned.', 409);
    }

    $side = kkc_viewer_side($game, $tokenHash);
    if ($side !== 'white' && $side !== 'black') {
        kkc_error('Only a seated player can resign this match.', 403);
    }

    $winner = $side === 'white' ? 'black' : 'white';
    $stmt = $pdo->prepare(
        "UPDATE kkc_games
         SET status = 'finished', winner = ?, end_reason = 'abandoned',
             ended_at = COALESCE(ended_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
         WHERE id = ?"
    );
    $stmt->execute([$winner, $game['id']]);

    $name = $side === 'white' ? (string) ($game['white_name'] ?: 'Grower') : (string) ($game['black_name'] ?: 'Grower');
    kkc_touch_player($pdo, (int) $game['id'], $tokenHash, $name, $side);

    $game = kkc_load_game($pdo, $code, false);
    kkc_finish_archive($pdo, $game);
    $pdo->commit();

    kkc_json(['game' => kkc_public_game($pdo, $game, $tokenHash)]);
} catch (Throwable $err) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($err instanceof PDOException) {
        error_log($err->getMessage());
        kkc_error('Could not resign the match.', 500);
    }
    throw $err;
}
