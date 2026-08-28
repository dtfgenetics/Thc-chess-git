<?php
declare(strict_types=1);

const KKC_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function kkc_headers(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
}

function kkc_json(array $payload, int $status = 200): never {
    kkc_headers();
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function kkc_config(): array {
    $path = __DIR__ . '/config.php';
    if (!file_exists($path)) {
        kkc_json(['ok' => false, 'error' => 'Missing api/config.php. Copy config.example.php and fill in Hostinger database values.'], 500);
    }
    $config = require $path;
    if (!is_array($config)) {
        kkc_json(['ok' => false, 'error' => 'Invalid api/config.php.'], 500);
    }
    return $config;
}

function kkc_db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $config = kkc_config();
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']);
    try {
        $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $e) {
        kkc_json(['ok' => false, 'error' => 'Database connection failed. Check Hostinger database values.'], 500);
    }
    return $pdo;
}

function kkc_body(): array {
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    if (is_array($data)) {
        return $data;
    }
    return $_POST ?: $_GET ?: [];
}

function kkc_clean(string $value, int $max): string {
    $value = trim(strip_tags($value));
    $value = preg_replace('/\s+/', ' ', $value) ?? '';
    return mb_substr($value, 0, $max);
}

function kkc_room_code(?string $value = null): string {
    if ($value !== null && $value !== '') {
        $value = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $value) ?? '');
        if (strlen($value) >= 4 && strlen($value) <= 12) {
            return $value;
        }
    }
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    for ($i = 0; $i < 6; $i++) {
        $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $code;
}

function kkc_token(?string $value = null): string {
    $value = preg_replace('/[^a-f0-9]/i', '', (string) $value) ?? '';
    if (strlen($value) === 64) {
        return strtolower($value);
    }
    return bin2hex(random_bytes(32));
}

function kkc_get_game(string $roomCode): ?array {
    $stmt = kkc_db()->prepare('SELECT * FROM kkc_games WHERE room_code = ? LIMIT 1');
    $stmt->execute([$roomCode]);
    $game = $stmt->fetch();
    return $game ?: null;
}

function kkc_require_game(string $roomCode): array {
    $game = kkc_get_game($roomCode);
    if (!$game) {
        kkc_json(['ok' => false, 'error' => 'Game room not found.'], 404);
    }
    return $game;
}

function kkc_side_from_fen(string $fen): string {
    $parts = explode(' ', trim($fen));
    return ($parts[1] ?? 'w') === 'b' ? 'dark' : 'light';
}

function kkc_fen_has_piece_for_side(string $fen, string $square, string $side): bool {
    if (!preg_match('/^[a-h][1-8]$/', $square)) {
        return false;
    }
    [$board] = explode(' ', $fen);
    $rows = explode('/', $board);
    $file = ord($square[0]) - ord('a');
    $rank = 8 - intval($square[1]);
    if (!isset($rows[$rank])) {
        return false;
    }
    $expanded = '';
    foreach (str_split($rows[$rank]) as $ch) {
        $expanded .= ctype_digit($ch) ? str_repeat(' ', intval($ch)) : $ch;
    }
    $piece = $expanded[$file] ?? ' ';
    if ($piece === ' ') {
        return false;
    }
    return $side === 'light' ? ctype_upper($piece) : ctype_lower($piece);
}

function kkc_player_side(int $gameId, string $token): ?string {
    $stmt = kkc_db()->prepare('SELECT side FROM kkc_players WHERE game_id = ? AND player_token = ? LIMIT 1');
    $stmt->execute([$gameId, $token]);
    $row = $stmt->fetch();
    return $row['side'] ?? null;
}

function kkc_moves(int $gameId): array {
    $stmt = kkc_db()->prepare('SELECT move_number, side, from_square, to_square, promotion, fen_after, san, created_at FROM kkc_moves WHERE game_id = ? ORDER BY move_number ASC');
    $stmt->execute([$gameId]);
    return $stmt->fetchAll();
}

function kkc_chat(int $gameId): array {
    $stmt = kkc_db()->prepare('SELECT player_name, message, created_at FROM kkc_chat WHERE game_id = ? ORDER BY id DESC LIMIT 50');
    $stmt->execute([$gameId]);
    return array_reverse($stmt->fetchAll());
}

function kkc_public_game(array $game): array {
    $moves = kkc_moves((int) $game['id']);
    return [
        'room_code' => $game['room_code'],
        'light_player_name' => $game['light_player_name'],
        'dark_player_name' => $game['dark_player_name'],
        'current_fen' => $game['current_fen'],
        'pgn' => $game['pgn'],
        'moves' => $moves,
        'status' => $game['status'],
        'winner' => $game['winner'],
        'end_reason' => $game['end_reason'],
        'turn' => kkc_side_from_fen($game['current_fen']),
        'created_at' => $game['created_at'],
        'updated_at' => $game['updated_at'],
    ];
}
