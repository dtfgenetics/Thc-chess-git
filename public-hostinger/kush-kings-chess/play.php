<?php
declare(strict_types=1);
require __DIR__ . '/api/db.php';

function h(string $value): string { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function board_rows(string $fen): array {
    $rows = explode('/', explode(' ', $fen)[0]);
    $out = [];
    foreach ($rows as $row) {
        $cells = [];
        foreach (str_split($row) as $ch) {
            if (ctype_digit($ch)) {
                for ($i = 0; $i < (int)$ch; $i++) { $cells[] = ''; }
            } else { $cells[] = $ch; }
        }
        $out[] = $cells;
    }
    return $out;
}
function sq(int $r, int $c): string { return chr(97 + $c) . (string)(8 - $r); }
function piece_label(string $p): string { return ['K'=>'K','Q'=>'Q','R'=>'R','B'=>'B','N'=>'N','P'=>'P','k'=>'K','q'=>'Q','r'=>'R','b'=>'B','n'=>'N','p'=>'P'][$p] ?? ''; }

$room = kkc_room_code((string)($_GET['room'] ?? $_POST['room_code'] ?? ''));
$notice = '';
$game = $room ? kkc_get_game($room) : null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'create') {
    $name = kkc_clean((string)($_POST['player_name'] ?? 'Grower'), 80) ?: 'Grower';
    $code = kkc_room_code();
    $pdo = kkc_db();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT INTO kkc_games (room_code, light_player_name, current_fen, move_json, status) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$code, $name, KKC_START_FEN, '[]', 'waiting']);
    $gameId = (int)$pdo->lastInsertId();
    $stmt = $pdo->prepare('INSERT INTO kkc_players (game_id, player_token, player_name, side) VALUES (?, ?, ?, ?)');
    $stmt->execute([$gameId, bin2hex(random_bytes(32)), $name, 'light']);
    $pdo->commit();
    header('Location: play.php?room=' . urlencode($code));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'join' && $game) {
    $name = kkc_clean((string)($_POST['player_name'] ?? 'Grower'), 80) ?: 'Grower';
    if (empty($game['dark_player_name'])) {
        $stmt = kkc_db()->prepare('UPDATE kkc_games SET dark_player_name = ?, status = ? WHERE id = ?');
        $stmt->execute([$name, 'active', $game['id']]);
        $notice = 'Joined as dark side.';
        $game = kkc_get_game($room);
    } else { $notice = 'Both sides are occupied. You can watch this board.'; }
}
?>
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kush Kings Chess PHP</title><link rel="stylesheet" href="css/style.css"></head>
<body>
<main class="app-shell">
<section class="hero-card"><div class="brand-mark">♔</div><div><p class="eyebrow">DTF Seeds Game Room</p><h1>Kush Kings Chess</h1><p class="lede">Shared-hosting PHP fallback. No VPS. No Node. No new service.</p></div></section>
<?php if (!$game): ?>
<section class="lobby-card">
<form method="post"><input type="hidden" name="action" value="create"><label>Grower name <input name="player_name" maxlength="80" placeholder="Grower"></label><p><button>Create Match</button></p></form>
<form method="get"><label>Room code <input name="room" maxlength="12" placeholder="ABC123"></label><p><button>Open Room</button></p></form>
</section>
<?php else: ?>
<section class="game-layout">
<aside class="panel"><h2>Grow Room</h2><p><strong>Room:</strong> <?= h($game['room_code']) ?></p><p><strong>Light:</strong> <?= h((string)$game['light_player_name']) ?></p><p><strong>Dark:</strong> <?= h((string)($game['dark_player_name'] ?? 'Waiting')) ?></p><p><strong>Status:</strong> <?= h($game['status']) ?></p><p class="notice"><?= h($notice) ?></p><form method="post"><input type="hidden" name="action" value="join"><input type="hidden" name="room_code" value="<?= h($game['room_code']) ?>"><label>Join name <input name="player_name" maxlength="80" placeholder="Grower"></label><p><button>Join Dark Side</button></p></form><p class="small-note">Invite: <?= h('https://dtfseeds.com/games/kush-kings-chess/play.php?room=' . $game['room_code']) ?></p></aside>
<section class="board-wrap"><div class="board">
<?php foreach (board_rows($game['current_fen']) as $r => $row): foreach ($row as $c => $p): $light = (($r + $c) % 2) === 0; ?>
<div class="square <?= $light ? 'light' : 'dark' ?>" title="<?= h(sq($r, $c)) ?>"><?php if ($p): ?><span class="piece <?= ctype_upper($p) ? 'light-side' : 'dark-side' ?>">☘<?= h(piece_label($p)) ?></span><?php endif; ?></div>
<?php endforeach; endforeach; ?>
</div></section>
<aside class="panel"><h2>Moves</h2><p><?= h((string)($game['pgn'] ?? 'No moves yet.')) ?></p><p class="small-note">The full click-to-move frontend is the next file to add. This fallback proves PHP/MySQL hosting can render and manage rooms.</p></aside>
</section>
<?php endif; ?>
</main>
</body>
</html>
