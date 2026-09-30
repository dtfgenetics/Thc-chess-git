<?php
declare(strict_types=1);

const KKC_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const KKC_MAX_NAME_LENGTH = 24;
const KKC_MAX_CHAT_LENGTH = 240;
const KKC_MAX_PGN_LENGTH = 60000;

$KKC_CONFIG = [
    'db_host' => getenv('KKC_DB_HOST') ?: 'localhost',
    'db_port' => getenv('KKC_DB_PORT') ?: '3306',
    'db_name' => getenv('KKC_DB_NAME') ?: '',
    'db_user' => getenv('KKC_DB_USER') ?: '',
    'db_pass' => getenv('KKC_DB_PASS') ?: '',
    'token_pepper' => getenv('KKC_TOKEN_PEPPER') ?: 'change-this-before-production',
];

$localConfigPath = __DIR__ . '/config.php';
if (is_file($localConfigPath)) {
    $localConfig = require $localConfigPath;
    if (is_array($localConfig)) {
        $KKC_CONFIG = array_merge($KKC_CONFIG, $localConfig);
    }
}

kkc_send_headers();

function kkc_send_headers(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
        header('Access-Control-Allow-Headers: Content-Type, Accept, X-KKC-Player-Token');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        http_response_code(204);
        exit;
    }
}

function kkc_db(): PDO
{
    static $pdo = null;
    global $KKC_CONFIG;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    foreach (['db_host', 'db_name', 'db_user'] as $key) {
        if (empty($KKC_CONFIG[$key])) {
            kkc_error('Database configuration is missing.', 500);
        }
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $KKC_CONFIG['db_host'],
        $KKC_CONFIG['db_port'] ?: '3306',
        $KKC_CONFIG['db_name']
    );

    $pdo = new PDO($dsn, (string) $KKC_CONFIG['db_user'], (string) $KKC_CONFIG['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function kkc_request_data(): array
{
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        return $_GET;
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return $_POST;
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        kkc_error('Invalid JSON request body.', 400);
    }

    return $data;
}

function kkc_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function kkc_error(string $message, int $status = 400): void
{
    kkc_json(['ok' => false, 'error' => $message], $status);
}

function kkc_clean_name(?string $name): string
{
    $clean = trim((string) $name);
    $clean = preg_replace('/\s+/', ' ', $clean) ?: '';
    $clean = substr($clean, 0, KKC_MAX_NAME_LENGTH);
    return $clean !== '' ? $clean : 'Grower';
}

function kkc_require_token(array $data): string
{
    $token = trim((string) ($data['token'] ?? ''));
    if (!preg_match('/^[A-Za-z0-9._:-]{20,128}$/', $token)) {
        kkc_error('A valid local player token is required.', 401);
    }
    return $token;
}

function kkc_token_hash(string $token): string
{
    global $KKC_CONFIG;
    return hash('sha256', (string) $KKC_CONFIG['token_pepper'] . ':' . $token);
}

function kkc_hash_matches(?string $knownHash, string $tokenHash): bool
{
    return is_string($knownHash) && $knownHash !== '' && hash_equals($knownHash, $tokenHash);
}

function kkc_normalize_code(?string $code): string
{
    $normalized = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $code) ?: '');
    if (!preg_match('/^[A-Z0-9]{4,12}$/', $normalized)) {
        kkc_error('A valid room code is required.', 400);
    }
    return $normalized;
}

function kkc_generate_code(PDO $pdo): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for ($attempt = 0; $attempt < 30; $attempt++) {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        $stmt = $pdo->prepare('SELECT id FROM kkc_games WHERE code = ? LIMIT 1');
        $stmt->execute([$code]);
        if (!$stmt->fetch()) {
            return $code;
        }
    }

    kkc_error('Could not allocate a room code.', 500);
}

function kkc_load_game(PDO $pdo, string $code, bool $forUpdate = false): array
{
    $sql = 'SELECT * FROM kkc_games WHERE code = ? LIMIT 1';
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$code]);
    $game = $stmt->fetch();

    if (!$game) {
        kkc_error('Room not found.', 404);
    }

    return $game;
}

function kkc_touch_player(PDO $pdo, int $gameId, string $tokenHash, string $name, string $side): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO kkc_players (game_id, token_hash, display_name, side, last_seen)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE
            display_name = VALUES(display_name),
            side = VALUES(side),
            last_seen = CURRENT_TIMESTAMP'
    );
    $stmt->execute([$gameId, $tokenHash, $name, $side]);
}

function kkc_viewer_side(array $game, ?string $tokenHash): string
{
    if ($tokenHash && kkc_hash_matches($game['white_token_hash'] ?? null, $tokenHash)) {
        return 'white';
    }
    if ($tokenHash && kkc_hash_matches($game['black_token_hash'] ?? null, $tokenHash)) {
        return 'black';
    }
    return 'spectator';
}

function kkc_player_presence(PDO $pdo, int $gameId): array
{
    $stmt = $pdo->prepare(
        "SELECT side, token_hash, display_name, TIMESTAMPDIFF(SECOND, last_seen, CURRENT_TIMESTAMP) AS idle_seconds
         FROM kkc_players
         WHERE game_id = ? AND side IN ('white', 'black')"
    );
    $stmt->execute([$gameId]);

    $presence = [
        'white' => ['connected' => false, 'name' => null],
        'black' => ['connected' => false, 'name' => null],
    ];

    foreach ($stmt->fetchAll() as $row) {
        $side = $row['side'];
        $presence[$side] = [
            'connected' => (int) $row['idle_seconds'] <= 20,
            'name' => $row['display_name'],
        ];
    }

    return $presence;
}

function kkc_chat_messages(PDO $pdo, int $gameId, int $afterId = 0): array
{
    if ($afterId > 0) {
        $stmt = $pdo->prepare(
            'SELECT id, player_name, side, message, created_at
             FROM kkc_chat
             WHERE game_id = ? AND id > ?
             ORDER BY id ASC
             LIMIT 50'
        );
        $stmt->execute([$gameId, $afterId]);
        return kkc_shape_chat($stmt->fetchAll());
    }

    $stmt = $pdo->prepare(
        'SELECT id, player_name, side, message, created_at
         FROM kkc_chat
         WHERE game_id = ?
         ORDER BY id DESC
         LIMIT 40'
    );
    $stmt->execute([$gameId]);
    return array_reverse(kkc_shape_chat($stmt->fetchAll()));
}

function kkc_shape_chat(array $rows): array
{
    return array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'playerName' => $row['player_name'],
            'side' => $row['side'],
            'message' => $row['message'],
            'createdAt' => $row['created_at'],
        ];
    }, $rows);
}

function kkc_public_game(PDO $pdo, array $game, ?string $viewerHash = null, int $chatAfterId = 0): array
{
    $gameId = (int) $game['id'];
    $presence = kkc_player_presence($pdo, $gameId);
    $viewerSide = kkc_viewer_side($game, $viewerHash);

    return [
        'ok' => true,
        'code' => $game['code'],
        'status' => $game['status'],
        'side' => $viewerSide,
        'fen' => $game['fen'] ?: KKC_START_FEN,
        'pgn' => $game['pgn'] ?: '',
        'turn' => $game['turn'] ?: 'w',
        'moveNumber' => (int) $game['move_number'],
        'winner' => $game['winner'],
        'endReason' => $game['end_reason'],
        'white' => [
            'name' => $game['white_name'],
            'connected' => $presence['white']['connected'],
        ],
        'black' => [
            'name' => $game['black_name'],
            'connected' => $presence['black']['connected'],
        ],
        'chat' => kkc_chat_messages($pdo, $gameId, $chatAfterId),
        'updatedAt' => $game['updated_at'],
    ];
}

function kkc_validate_square(string $square): string
{
    $square = strtolower(trim($square));
    if (!preg_match('/^[a-h][1-8]$/', $square)) {
        kkc_error('Invalid move square.', 400);
    }
    return $square;
}

function kkc_validate_fen(string $fen): string
{
    $fen = trim($fen);
    if (strlen($fen) > 128 || !preg_match('/^[pnbrqkPNBRQK1-8\/]+ [wb] (-|K?Q?k?q?) (-|[a-h][36]) \d+ \d+$/', $fen)) {
        kkc_error('Invalid board state.', 400);
    }
    return $fen;
}

function kkc_fen_turn(string $fen): string
{
    $parts = explode(' ', $fen);
    return $parts[1] ?? 'w';
}

function kkc_validate_pgn(string $pgn): string
{
    $pgn = trim($pgn);
    if (strlen($pgn) > KKC_MAX_PGN_LENGTH) {
        kkc_error('Move history is too large.', 400);
    }
    return $pgn;
}

function kkc_finish_archive(PDO $pdo, array $game): void
{
    if ($game['status'] !== 'finished') {
        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO kkc_archives (game_id, code, pgn, fen, winner, end_reason, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE
            pgn = VALUES(pgn),
            fen = VALUES(fen),
            winner = VALUES(winner),
            end_reason = VALUES(end_reason),
            archived_at = CURRENT_TIMESTAMP'
    );
    $stmt->execute([
        $game['id'],
        $game['code'],
        $game['pgn'],
        $game['fen'],
        $game['winner'],
        $game['end_reason'],
    ]);
}
