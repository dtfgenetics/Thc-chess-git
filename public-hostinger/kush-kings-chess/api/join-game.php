<?php
declare(strict_types=1);

require __DIR__ . '/_shared.php';
require __DIR__ . '/guards.php';
kkc_require_method('POST');

$data = kkc_request_data();
$code = kkc_normalize_code(kkc_nullable_scalar_string($data['code'] ?? null, 'Room code must be text.'));
$token = kkc_required_player_token($data);
$tokenHash = kkc_token_hash($token);
$name = kkc_clean_name(kkc_nullable_scalar_string($data['name'] ?? null, 'Player name must be text.'));
$sideInput = kkc_nullable_scalar_string($data['side'] ?? null, 'Requested side must be text.');
$requestedSide = in_array($sideInput, ['white', 'black'], true) ? $sideInput : null;

$pdo = kkc_db();

try {
    $pdo->beginTransaction();
    $game = kkc_load_game($pdo, $code, true);

    if ($game['status'] === 'finished') {
        $side = kkc_viewer_side($game, $tokenHash);
        if ($side === 'white' || $side === 'black') {
            kkc_touch_player($pdo, (int) $game['id'], $tokenHash, $name, $side);
        }
        $pdo->commit();
        kkc_json(['game' => kkc_public_game($pdo, $game, $tokenHash)]);
    }

    $side = kkc_viewer_side($game, $tokenHash);
    if ($side === 'spectator') {
        if ($requestedSide && empty($game[$requestedSide . '_token_hash'])) {
            $side = $requestedSide;
        } elseif (empty($game['white_token_hash'])) {
            $side = 'white';
        } elseif (empty($game['black_token_hash'])) {
            $side = 'black';
        }
    }

    if ($side === 'white') {
        $game['white_token_hash'] = $tokenHash;
        $game['white_name'] = $name;
    } elseif ($side === 'black') {
        $game['black_token_hash'] = $tokenHash;
        $game['black_name'] = $name;
    }

    $status = (!empty($game['white_token_hash']) && !empty($game['black_token_hash'])) ? 'active' : 'waiting';
    $isActive = $status === 'active' ? 1 : 0;

    $stmt = $pdo->prepare(
        'UPDATE kkc_games
         SET white_token_hash = ?, white_name = ?, black_token_hash = ?, black_name = ?,
             status = ?,
             started_at = IF(? = 1 AND started_at IS NULL, CURRENT_TIMESTAMP, started_at),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?'
    );
    $stmt->execute([
        $game['white_token_hash'],
        $game['white_name'],
        $game['black_token_hash'],
        $game['black_name'],
        $status,
        $isActive,
        $game['id'],
    ]);

    if ($side === 'white' || $side === 'black') {
        kkc_touch_player($pdo, (int) $game['id'], $tokenHash, $name, $side);
    }
    $game = kkc_load_game($pdo, $code, false);

    $pdo->commit();
    kkc_json(['game' => kkc_public_game($pdo, $game, $tokenHash)]);
} catch (Throwable $err) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($err->getMessage());
    kkc_error('Could not join the room.', 500);
}
