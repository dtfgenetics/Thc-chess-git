<?php
declare(strict_types=1);

function kkc_require_method(string $method): void
{
    $expected = strtoupper(trim($method));
    $actual = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? ''));
    if ($actual !== $expected) {
        header('Allow: ' . $expected);
        kkc_error('Method not allowed.', 405);
    }
}

function kkc_scalar_string(mixed $value, string $message = 'Invalid text value.', int $status = 400): string
{
    if (!is_string($value) && !is_numeric($value)) {
        kkc_error($message, $status);
    }

    return (string) $value;
}

function kkc_nullable_scalar_string(mixed $value, string $message = 'Invalid text value.', int $status = 400): ?string
{
    if ($value === null) {
        return null;
    }

    return kkc_scalar_string($value, $message, $status);
}

function kkc_optional_token(mixed $token): ?string
{
    if (!is_string($token) && !is_numeric($token)) {
        return null;
    }

    $token = trim((string) $token);
    if ($token === '') {
        return null;
    }

    if (!preg_match('/^[A-Za-z0-9._:-]{20,128}$/', $token)) {
        return null;
    }

    return $token;
}

function kkc_required_player_token(array $data): string
{
    $token = kkc_optional_token($data['token'] ?? null);
    if ($token === null) {
        kkc_error('A valid local player token is required.', 401);
    }
    return $token;
}

function kkc_request_player_token(array $data): ?string
{
    if (array_key_exists('HTTP_X_KKC_PLAYER_TOKEN', $_SERVER)) {
        return kkc_optional_token($_SERVER['HTTP_X_KKC_PLAYER_TOKEN']);
    }

    // Temporary compatibility fallback for clients opened before the header rollout.
    return kkc_optional_token($data['token'] ?? null);
}

function kkc_too_many_requests(string $message, int $retryAfter = 10): void
{
    header('Retry-After: ' . max(1, $retryAfter));
    kkc_error($message, 429);
}

function kkc_limit_room_creation(PDO $pdo, string $tokenHash): void
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM kkc_games
         WHERE host_token_hash = ?
           AND created_at > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 MINUTE)'
    );
    $stmt->execute([$tokenHash]);

    if ((int) $stmt->fetchColumn() >= 5) {
        kkc_too_many_requests('Too many rooms were created from this player. Try again shortly.', 60);
    }
}

function kkc_limit_chat(PDO $pdo, int $gameId, string $tokenHash): void
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM kkc_chat
         WHERE game_id = ?
           AND player_token_hash = ?
           AND created_at > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 SECOND)'
    );
    $stmt->execute([$gameId, $tokenHash]);

    if ((int) $stmt->fetchColumn() >= 5) {
        kkc_too_many_requests('Chat is moving too fast. Try again in a few seconds.', 10);
    }

    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM kkc_chat
         WHERE game_id = ?
           AND player_token_hash = ?
           AND created_at > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE)'
    );
    $stmt->execute([$gameId, $tokenHash]);

    if ((int) $stmt->fetchColumn() >= 50) {
        kkc_too_many_requests('Chat limit reached for this room. Try again shortly.', 60);
    }
}
