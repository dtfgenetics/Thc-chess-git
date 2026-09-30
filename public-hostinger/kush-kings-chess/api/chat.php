<?php
declare(strict_types=1);

require __DIR__ . '/_shared.php';
require __DIR__ . '/guards.php';
kkc_require_method('POST');

$data = kkc_request_data();
$code = kkc_normalize_code(kkc_nullable_scalar_string($data['code'] ?? null, 'Room code must be text.'));
$token = kkc_required_player_token($data);
$tokenHash = kkc_token_hash($token);
$fallbackName = kkc_clean_name(kkc_nullable_scalar_string($data['name'] ?? null, 'Player name must be text.'));
$message = trim(kkc_scalar_string($data['message'] ?? '', 'Chat message must be text.'));
$message = substr(preg_replace('/\s+/', ' ', $message) ?: '', 0, KKC_MAX_CHAT_LENGTH);

if ($message === '') {
    kkc_error('Chat message is empty.', 400);
}

$pdo = kkc_db();
$game = kkc_load_game($pdo, $code, false);
$side = kkc_viewer_side($game, $tokenHash);
$name = $fallbackName;
if ($side === 'white' && !empty($game['white_name'])) {
    $name = $game['white_name'];
} elseif ($side === 'black' && !empty($game['black_name'])) {
    $name = $game['black_name'];
}

kkc_limit_chat($pdo, (int) $game['id'], $tokenHash);

$stmt = $pdo->prepare(
    'INSERT INTO kkc_chat (game_id, player_token_hash, player_name, side, message, created_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
);
$stmt->execute([(int) $game['id'], $tokenHash, $name, $side, $message]);

if ($side === 'white' || $side === 'black') {
    kkc_touch_player($pdo, (int) $game['id'], $tokenHash, $name, $side);
}

$game = kkc_load_game($pdo, $code, false);
kkc_json(['game' => kkc_public_game($pdo, $game, $tokenHash)]);
