<?php
declare(strict_types=1);

require __DIR__ . '/_shared.php';
require __DIR__ . '/guards.php';
require __DIR__ . '/chess-rules.php';
kkc_require_method('POST');

function kkc_existing_move_rows(PDO $pdo, int $gameId): array
{
    $stmt = $pdo->prepare(
        'SELECT move_number, san, fen_after
         FROM kkc_moves
         WHERE game_id = ?
         ORDER BY move_number ASC'
    );
    $stmt->execute([$gameId]);
    return $stmt->fetchAll();
}

function kkc_build_server_pgn(array $existingMoves, string $newSan, ?string $winner): string
{
    $sans = array_map(static fn(array $row): string => trim((string) $row['san']), $existingMoves);
    $sans[] = $newSan;
    $parts = [];

    foreach ($sans as $index => $san) {
        if ($san === '') continue;
        if ($index % 2 === 0) {
            $parts[] = sprintf('%d. %s', intdiv($index, 2) + 1, $san);
        } else {
            $parts[] = $san;
        }
    }

    if ($winner === 'white') {
        $parts[] = '1-0';
    } elseif ($winner === 'black') {
        $parts[] = '0-1';
    } elseif ($winner === 'draw') {
        $parts[] = '1/2-1/2';
    }

    return implode(' ', $parts);
}

function kkc_is_threefold_repetition(array $existingMoves, string $candidateFen): bool
{
    $candidateKey = kkc_chess_position_key($candidateFen);
    $count = kkc_chess_position_key(KKC_START_FEN) === $candidateKey ? 1 : 0;

    foreach ($existingMoves as $row) {
        if (kkc_chess_position_key((string) $row['fen_after']) === $candidateKey) {
            $count++;
        }
    }

    return ($count + 1) >= 3;
}

$data = kkc_request_data();
$code = kkc_normalize_code(kkc_nullable_scalar_string($data['code'] ?? null, 'Room code must be text.'));
$token = kkc_required_player_token($data);
$tokenHash = kkc_token_hash($token);
$from = kkc_validate_square(kkc_scalar_string($data['from'] ?? '', 'Move square must be text.'));
$to = kkc_validate_square(kkc_scalar_string($data['to'] ?? '', 'Move square must be text.'));
$promotionInput = $data['promotion'] ?? null;
$promotion = $promotionInput === null
    ? 'q'
    : strtolower(trim(kkc_scalar_string($promotionInput, 'Promotion piece must be text.')));
$promotion = in_array($promotion, ['q', 'r', 'b', 'n'], true) ? $promotion : 'q';
$moveNumberInput = $data['moveNumber'] ?? -1;
$clientMoveNumber = is_int($moveNumberInput) || (is_string($moveNumberInput) && ctype_digit($moveNumberInput))
    ? (int) $moveNumberInput
    : -1;

$pdo = kkc_db();

try {
    $pdo->beginTransaction();
    $game = kkc_load_game($pdo, $code, true);

    if ($game['status'] !== 'active') {
        kkc_error('This match is not active yet.', 409);
    }
    if ($clientMoveNumber !== (int) $game['move_number']) {
        kkc_error('The board changed before that move landed. Refreshing the room.', 409);
    }

    $serverFen = trim((string) ($game['fen'] ?: KKC_START_FEN));
    $fenTurn = kkc_fen_turn($serverFen) === 'b' ? 'b' : 'w';
    $storedTurn = $game['turn'] === 'b' ? 'b' : 'w';
    if ($fenTurn !== $storedTurn) {
        kkc_error('The saved room state is inconsistent and cannot accept moves.', 409);
    }

    $movingSide = $storedTurn === 'w' ? 'white' : 'black';
    $sideHash = $movingSide === 'white' ? $game['white_token_hash'] : $game['black_token_hash'];
    if (!kkc_hash_matches($sideHash, $tokenHash)) {
        kkc_error('It is not your turn.', 403);
    }

    $existingMoves = kkc_existing_move_rows($pdo, (int) $game['id']);

    try {
        $result = kkc_chess_apply_move($serverFen, $from, $to, $promotion);
    } catch (InvalidArgumentException $err) {
        kkc_error('That move is not legal in the current position.', 400);
    }

    $winner = $result['winner'];
    $endReason = $result['endReason'];
    if ($winner === null && kkc_is_threefold_repetition($existingMoves, $result['fen'])) {
        $winner = 'draw';
        $endReason = 'repetition';
    }

    $status = $winner !== null ? 'finished' : 'active';
    $isFinished = $winner !== null ? 1 : 0;
    $pgn = kkc_build_server_pgn($existingMoves, $result['san'], $winner);

    $stmt = $pdo->prepare(
        'UPDATE kkc_games
         SET pgn = ?, fen = ?, turn = ?, status = ?, winner = ?, end_reason = ?,
             move_number = move_number + 1,
             ended_at = IF(? = 1 AND ended_at IS NULL, CURRENT_TIMESTAMP, ended_at),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?'
    );
    $stmt->execute([
        $pgn,
        $result['fen'],
        $result['turn'],
        $status,
        $winner,
        $endReason,
        $isFinished,
        $game['id'],
    ]);

    $stmt = $pdo->prepare(
        'INSERT INTO kkc_moves
            (game_id, move_number, side, from_square, to_square, promotion, san, fen_after, pgn_after, player_token_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    );
    $stmt->execute([
        $game['id'],
        ((int) $game['move_number']) + 1,
        $movingSide,
        $from,
        $to,
        $result['move']['promotion'],
        $result['san'],
        $result['fen'],
        $pgn,
        $tokenHash,
    ]);

    kkc_touch_player(
        $pdo,
        (int) $game['id'],
        $tokenHash,
        $movingSide === 'white' ? (string) $game['white_name'] : (string) $game['black_name'],
        $movingSide
    );
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
        kkc_error('Could not save the move.', 500);
    }
    throw $err;
}
