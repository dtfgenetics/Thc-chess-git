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

    if ($game['status'] !== 'waiting') {
        kkc_error('Only a waiting room can be cancelled.', 409);
    }
    if (!kkc_hash_matches($game['host_token_hash'] ?? null, $tokenHash)) {
        kkc_error('Only the room host can cancel this waiting room.', 403);
    }

    $stmt = $pdo->prepare('DELETE FROM kkc_games WHERE id = ?');
    $stmt->execute([(int) $game['id']]);
    $pdo->commit();

    kkc_json(['ok' => true, 'cancelled' => true, 'code' => $code]);
} catch (Throwable $err) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($err instanceof PDOException) {
        error_log($err->getMessage());
        kkc_error('Could not cancel the room.', 500);
    }
    throw $err;
}
