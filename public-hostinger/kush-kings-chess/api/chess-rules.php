<?php
declare(strict_types=1);

function kkc_chess_parse_fen(string $fen): array
{
    $parts = preg_split('/\s+/', trim($fen));
    if (!$parts || count($parts) !== 6) {
        throw new InvalidArgumentException('Invalid FEN.');
    }

    [$placement, $turn, $castling, $ep, $halfmove, $fullmove] = $parts;
    if (!in_array($turn, ['w', 'b'], true)) {
        throw new InvalidArgumentException('Invalid FEN turn.');
    }

    $ranks = explode('/', $placement);
    if (count($ranks) !== 8) {
        throw new InvalidArgumentException('Invalid FEN board.');
    }

    $board = [];
    foreach ($ranks as $rankIndex => $rankText) {
        $rank = 8 - $rankIndex;
        $file = 0;
        foreach (str_split($rankText) as $char) {
            if (ctype_digit($char)) {
                $file += (int) $char;
                continue;
            }
            if (!preg_match('/^[prnbqkPRNBQK]$/', $char) || $file > 7) {
                throw new InvalidArgumentException('Invalid FEN piece placement.');
            }
            $board[chr(97 + $file) . $rank] = $char;
            $file++;
        }
        if ($file !== 8) {
            throw new InvalidArgumentException('Invalid FEN rank width.');
        }
    }

    return [
        'board' => $board,
        'turn' => $turn,
        'castling' => $castling === '-' ? '' : $castling,
        'ep' => $ep,
        'halfmove' => max(0, (int) $halfmove),
        'fullmove' => max(1, (int) $fullmove),
    ];
}

function kkc_chess_export_fen(array $state): string
{
    $rankTexts = [];
    for ($rank = 8; $rank >= 1; $rank--) {
        $empty = 0;
        $text = '';
        for ($file = 0; $file < 8; $file++) {
            $square = chr(97 + $file) . $rank;
            $piece = $state['board'][$square] ?? null;
            if ($piece === null) {
                $empty++;
                continue;
            }
            if ($empty > 0) {
                $text .= (string) $empty;
                $empty = 0;
            }
            $text .= $piece;
        }
        if ($empty > 0) {
            $text .= (string) $empty;
        }
        $rankTexts[] = $text;
    }

    $castling = $state['castling'] !== '' ? $state['castling'] : '-';
    return sprintf(
        '%s %s %s %s %d %d',
        implode('/', $rankTexts),
        $state['turn'],
        $castling,
        $state['ep'] ?: '-',
        (int) $state['halfmove'],
        (int) $state['fullmove']
    );
}

function kkc_chess_piece_color(string $piece): string
{
    return ctype_upper($piece) ? 'w' : 'b';
}

function kkc_chess_other_color(string $color): string
{
    return $color === 'w' ? 'b' : 'w';
}

function kkc_chess_square(int $file, int $rank): ?string
{
    if ($file < 0 || $file > 7 || $rank < 1 || $rank > 8) {
        return null;
    }
    return chr(97 + $file) . $rank;
}

function kkc_chess_coords(string $square): array
{
    return [ord($square[0]) - 97, (int) $square[1]];
}

function kkc_chess_is_opponent(?string $piece, string $color): bool
{
    return $piece !== null && kkc_chess_piece_color($piece) !== $color;
}

function kkc_chess_is_attacked(array $state, string $square, string $byColor): bool
{
    [$file, $rank] = kkc_chess_coords($square);
    $board = $state['board'];

    $pawn = $byColor === 'w' ? 'P' : 'p';
    $pawnSourceRank = $rank + ($byColor === 'w' ? -1 : 1);
    foreach ([-1, 1] as $df) {
        $source = kkc_chess_square($file + $df, $pawnSourceRank);
        if ($source !== null && ($board[$source] ?? null) === $pawn) {
            return true;
        }
    }

    $knight = $byColor === 'w' ? 'N' : 'n';
    foreach ([[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]] as [$df, $dr]) {
        $source = kkc_chess_square($file + $df, $rank + $dr);
        if ($source !== null && ($board[$source] ?? null) === $knight) {
            return true;
        }
    }

    $king = $byColor === 'w' ? 'K' : 'k';
    for ($df = -1; $df <= 1; $df++) {
        for ($dr = -1; $dr <= 1; $dr++) {
            if ($df === 0 && $dr === 0) continue;
            $source = kkc_chess_square($file + $df, $rank + $dr);
            if ($source !== null && ($board[$source] ?? null) === $king) {
                return true;
            }
        }
    }

    foreach ([
        [1,0,'RQ'],[-1,0,'RQ'],[0,1,'RQ'],[0,-1,'RQ'],
        [1,1,'BQ'],[1,-1,'BQ'],[-1,1,'BQ'],[-1,-1,'BQ'],
    ] as [$df, $dr, $types]) {
        $f = $file + $df;
        $r = $rank + $dr;
        while (($source = kkc_chess_square($f, $r)) !== null) {
            $piece = $board[$source] ?? null;
            if ($piece !== null) {
                if (kkc_chess_piece_color($piece) === $byColor && str_contains($types, strtoupper($piece))) {
                    return true;
                }
                break;
            }
            $f += $df;
            $r += $dr;
        }
    }

    return false;
}

function kkc_chess_king_square(array $state, string $color): ?string
{
    $king = $color === 'w' ? 'K' : 'k';
    foreach ($state['board'] as $square => $piece) {
        if ($piece === $king) return $square;
    }
    return null;
}

function kkc_chess_in_check(array $state, string $color): bool
{
    $kingSquare = kkc_chess_king_square($state, $color);
    if ($kingSquare === null) {
        return true;
    }
    return kkc_chess_is_attacked($state, $kingSquare, kkc_chess_other_color($color));
}

function kkc_chess_add_move(array &$moves, string $from, string $to, ?string $promotion = null, bool $capture = false, bool $enPassant = false, ?string $castle = null): void
{
    $moves[] = [
        'from' => $from,
        'to' => $to,
        'promotion' => $promotion,
        'capture' => $capture,
        'enPassant' => $enPassant,
        'castle' => $castle,
    ];
}

function kkc_chess_pseudo_moves(array $state, string $color): array
{
    $moves = [];
    $board = $state['board'];

    foreach ($board as $from => $piece) {
        if (kkc_chess_piece_color($piece) !== $color) continue;
        [$file, $rank] = kkc_chess_coords($from);
        $type = strtoupper($piece);

        if ($type === 'P') {
            $direction = $color === 'w' ? 1 : -1;
            $startRank = $color === 'w' ? 2 : 7;
            $promotionRank = $color === 'w' ? 8 : 1;
            $one = kkc_chess_square($file, $rank + $direction);
            if ($one !== null && !isset($board[$one])) {
                if (($rank + $direction) === $promotionRank) {
                    foreach (['q','r','b','n'] as $promotion) {
                        kkc_chess_add_move($moves, $from, $one, $promotion);
                    }
                } else {
                    kkc_chess_add_move($moves, $from, $one);
                    $two = kkc_chess_square($file, $rank + 2 * $direction);
                    if ($rank === $startRank && $two !== null && !isset($board[$two])) {
                        kkc_chess_add_move($moves, $from, $two);
                    }
                }
            }

            foreach ([-1, 1] as $df) {
                $to = kkc_chess_square($file + $df, $rank + $direction);
                if ($to === null) continue;
                $target = $board[$to] ?? null;
                $isCapture = $target !== null && kkc_chess_is_opponent($target, $color) && strtoupper($target) !== 'K';
                $isEp = false;
                if ($state['ep'] !== '-' && $to === $state['ep'] && $target === null) {
                    $captureSquare = kkc_chess_square($file + $df, $rank);
                    $expectedPawn = $color === 'w' ? 'p' : 'P';
                    $isEp = $captureSquare !== null && ($board[$captureSquare] ?? null) === $expectedPawn;
                }
                if (!$isCapture && !$isEp) continue;

                if (($rank + $direction) === $promotionRank) {
                    foreach (['q','r','b','n'] as $promotion) {
                        kkc_chess_add_move($moves, $from, $to, $promotion, true, $isEp);
                    }
                } else {
                    kkc_chess_add_move($moves, $from, $to, null, true, $isEp);
                }
            }
            continue;
        }

        if ($type === 'N') {
            foreach ([[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]] as [$df, $dr]) {
                $to = kkc_chess_square($file + $df, $rank + $dr);
                if ($to === null) continue;
                $target = $board[$to] ?? null;
                if ($target === null) {
                    kkc_chess_add_move($moves, $from, $to);
                } elseif (kkc_chess_is_opponent($target, $color) && strtoupper($target) !== 'K') {
                    kkc_chess_add_move($moves, $from, $to, null, true);
                }
            }
            continue;
        }

        if (in_array($type, ['B','R','Q'], true)) {
            $directions = [];
            if (in_array($type, ['R','Q'], true)) {
                $directions = array_merge($directions, [[1,0],[-1,0],[0,1],[0,-1]]);
            }
            if (in_array($type, ['B','Q'], true)) {
                $directions = array_merge($directions, [[1,1],[1,-1],[-1,1],[-1,-1]]);
            }
            foreach ($directions as [$df, $dr]) {
                $f = $file + $df;
                $r = $rank + $dr;
                while (($to = kkc_chess_square($f, $r)) !== null) {
                    $target = $board[$to] ?? null;
                    if ($target === null) {
                        kkc_chess_add_move($moves, $from, $to);
                    } else {
                        if (kkc_chess_is_opponent($target, $color) && strtoupper($target) !== 'K') {
                            kkc_chess_add_move($moves, $from, $to, null, true);
                        }
                        break;
                    }
                    $f += $df;
                    $r += $dr;
                }
            }
            continue;
        }

        if ($type === 'K') {
            for ($df = -1; $df <= 1; $df++) {
                for ($dr = -1; $dr <= 1; $dr++) {
                    if ($df === 0 && $dr === 0) continue;
                    $to = kkc_chess_square($file + $df, $rank + $dr);
                    if ($to === null) continue;
                    $target = $board[$to] ?? null;
                    if ($target === null) {
                        kkc_chess_add_move($moves, $from, $to);
                    } elseif (kkc_chess_is_opponent($target, $color) && strtoupper($target) !== 'K') {
                        kkc_chess_add_move($moves, $from, $to, null, true);
                    }
                }
            }

            $homeRank = $color === 'w' ? 1 : 8;
            $kingHome = 'e' . $homeRank;
            if ($from === $kingHome && !kkc_chess_in_check($state, $color)) {
                $enemy = kkc_chess_other_color($color);
                $kingRight = $color === 'w' ? 'K' : 'k';
                $queenRight = $color === 'w' ? 'Q' : 'q';
                $rookPiece = $color === 'w' ? 'R' : 'r';

                if (str_contains($state['castling'], $kingRight)
                    && ($board['h' . $homeRank] ?? null) === $rookPiece
                    && !isset($board['f' . $homeRank])
                    && !isset($board['g' . $homeRank])
                    && !kkc_chess_is_attacked($state, 'f' . $homeRank, $enemy)
                    && !kkc_chess_is_attacked($state, 'g' . $homeRank, $enemy)) {
                    kkc_chess_add_move($moves, $from, 'g' . $homeRank, null, false, false, 'k');
                }

                if (str_contains($state['castling'], $queenRight)
                    && ($board['a' . $homeRank] ?? null) === $rookPiece
                    && !isset($board['b' . $homeRank])
                    && !isset($board['c' . $homeRank])
                    && !isset($board['d' . $homeRank])
                    && !kkc_chess_is_attacked($state, 'd' . $homeRank, $enemy)
                    && !kkc_chess_is_attacked($state, 'c' . $homeRank, $enemy)) {
                    kkc_chess_add_move($moves, $from, 'c' . $homeRank, null, false, false, 'q');
                }
            }
        }
    }

    return $moves;
}

function kkc_chess_remove_castling_right(string $castling, string $right): string
{
    return str_replace($right, '', $castling);
}

function kkc_chess_apply_raw(array $state, array $move): array
{
    $from = $move['from'];
    $to = $move['to'];
    $piece = $state['board'][$from];
    $color = kkc_chess_piece_color($piece);
    $target = $state['board'][$to] ?? null;
    $type = strtoupper($piece);
    [$fromFile, $fromRank] = kkc_chess_coords($from);
    [$toFile, $toRank] = kkc_chess_coords($to);

    unset($state['board'][$from]);

    if ($move['enPassant']) {
        $captureSquare = kkc_chess_square($toFile, $toRank + ($color === 'w' ? -1 : 1));
        if ($captureSquare !== null) unset($state['board'][$captureSquare]);
    }

    if ($move['castle'] === 'k') {
        $homeRank = $color === 'w' ? 1 : 8;
        $rook = $state['board']['h' . $homeRank] ?? ($color === 'w' ? 'R' : 'r');
        unset($state['board']['h' . $homeRank]);
        $state['board']['f' . $homeRank] = $rook;
    } elseif ($move['castle'] === 'q') {
        $homeRank = $color === 'w' ? 1 : 8;
        $rook = $state['board']['a' . $homeRank] ?? ($color === 'w' ? 'R' : 'r');
        unset($state['board']['a' . $homeRank]);
        $state['board']['d' . $homeRank] = $rook;
    }

    $placedPiece = $piece;
    if ($type === 'P' && $move['promotion']) {
        $placedPiece = $color === 'w' ? strtoupper($move['promotion']) : strtolower($move['promotion']);
    }
    $state['board'][$to] = $placedPiece;

    if ($type === 'K') {
        foreach ($color === 'w' ? ['K','Q'] : ['k','q'] as $right) {
            $state['castling'] = kkc_chess_remove_castling_right($state['castling'], $right);
        }
    }

    $rookRights = [
        'a1' => 'Q', 'h1' => 'K', 'a8' => 'q', 'h8' => 'k',
    ];
    if ($type === 'R' && isset($rookRights[$from])) {
        $state['castling'] = kkc_chess_remove_castling_right($state['castling'], $rookRights[$from]);
    }
    if ($target !== null && strtoupper($target) === 'R' && isset($rookRights[$to])) {
        $state['castling'] = kkc_chess_remove_castling_right($state['castling'], $rookRights[$to]);
    }

    $state['ep'] = '-';
    if ($type === 'P' && abs($toRank - $fromRank) === 2) {
        $state['ep'] = kkc_chess_square($fromFile, intdiv($fromRank + $toRank, 2)) ?? '-';
    }

    $state['halfmove'] = ($type === 'P' || $move['capture']) ? 0 : ((int) $state['halfmove'] + 1);
    if ($color === 'b') {
        $state['fullmove'] = (int) $state['fullmove'] + 1;
    }
    $state['turn'] = kkc_chess_other_color($color);

    return $state;
}

function kkc_chess_legal_moves(array $state, ?string $color = null): array
{
    $color = $color ?? $state['turn'];
    $working = $state;
    $working['turn'] = $color;
    $legal = [];
    foreach (kkc_chess_pseudo_moves($working, $color) as $move) {
        $after = kkc_chess_apply_raw($working, $move);
        if (!kkc_chess_in_check($after, $color)) {
            $legal[] = $move;
        }
    }
    return $legal;
}

function kkc_chess_insufficient_material(array $state): bool
{
    $nonKings = [];
    foreach ($state['board'] as $square => $piece) {
        if (strtoupper($piece) !== 'K') {
            $nonKings[] = [$square, strtoupper($piece)];
        }
    }

    if (count($nonKings) === 0) return true;
    if (count($nonKings) === 1 && in_array($nonKings[0][1], ['B','N'], true)) return true;

    foreach ($nonKings as [, $type]) {
        if ($type !== 'B') return false;
    }

    $colors = [];
    foreach ($nonKings as [$square]) {
        [$file, $rank] = kkc_chess_coords($square);
        $colors[(($file + $rank) % 2)] = true;
    }
    return count($colors) <= 1;
}

function kkc_chess_move_san(array $before, array $move, array $legalMoves, array $after): string
{
    $piece = $before['board'][$move['from']];
    $type = strtoupper($piece);

    if ($move['castle'] === 'k') {
        $san = 'O-O';
    } elseif ($move['castle'] === 'q') {
        $san = 'O-O-O';
    } else {
        $san = $type === 'P' ? '' : $type;
        if ($type !== 'P') {
            $others = [];
            foreach ($legalMoves as $candidate) {
                if ($candidate['from'] === $move['from'] || $candidate['to'] !== $move['to']) continue;
                $candidatePiece = $before['board'][$candidate['from']] ?? null;
                if ($candidatePiece !== null && strtoupper($candidatePiece) === $type) {
                    $others[] = $candidate;
                }
            }
            if ($others) {
                [$fromFile, $fromRank] = kkc_chess_coords($move['from']);
                $sameFile = false;
                $sameRank = false;
                foreach ($others as $other) {
                    [$otherFile, $otherRank] = kkc_chess_coords($other['from']);
                    if ($otherFile === $fromFile) $sameFile = true;
                    if ($otherRank === $fromRank) $sameRank = true;
                }
                if (!$sameFile) {
                    $san .= $move['from'][0];
                } elseif (!$sameRank) {
                    $san .= $move['from'][1];
                } else {
                    $san .= $move['from'];
                }
            }
        } elseif ($move['capture']) {
            $san .= $move['from'][0];
        }

        if ($move['capture']) $san .= 'x';
        $san .= $move['to'];
        if ($move['promotion']) {
            $san .= '=' . strtoupper($move['promotion']);
        }
    }

    $nextColor = $after['turn'];
    if (kkc_chess_in_check($after, $nextColor)) {
        $san .= count(kkc_chess_legal_moves($after, $nextColor)) === 0 ? '#' : '+';
    }
    return $san;
}

function kkc_chess_apply_move(string $fen, string $from, string $to, ?string $promotion = null): array
{
    $before = kkc_chess_parse_fen($fen);
    $legalMoves = kkc_chess_legal_moves($before, $before['turn']);
    $promotion = strtolower(trim((string) ($promotion ?: 'q')));
    if (!in_array($promotion, ['q','r','b','n'], true)) $promotion = 'q';

    $selected = null;
    foreach ($legalMoves as $move) {
        if ($move['from'] !== $from || $move['to'] !== $to) continue;
        if ($move['promotion'] !== null && $move['promotion'] !== $promotion) continue;
        $selected = $move;
        break;
    }

    if ($selected === null) {
        throw new InvalidArgumentException('Illegal chess move.');
    }

    $after = kkc_chess_apply_raw($before, $selected);
    $san = kkc_chess_move_san($before, $selected, $legalMoves, $after);
    $nextColor = $after['turn'];
    $nextLegal = kkc_chess_legal_moves($after, $nextColor);
    $inCheck = kkc_chess_in_check($after, $nextColor);

    $winner = null;
    $endReason = null;
    if (count($nextLegal) === 0) {
        if ($inCheck) {
            $winner = $before['turn'] === 'w' ? 'white' : 'black';
            $endReason = 'checkmate';
        } else {
            $winner = 'draw';
            $endReason = 'stalemate';
        }
    } elseif (kkc_chess_insufficient_material($after)) {
        $winner = 'draw';
        $endReason = 'insufficient';
    } elseif ((int) $after['halfmove'] >= 100) {
        $winner = 'draw';
        $endReason = 'draw';
    }

    return [
        'fen' => kkc_chess_export_fen($after),
        'san' => $san,
        'turn' => $after['turn'],
        'winner' => $winner,
        'endReason' => $endReason,
        'status' => $winner !== null ? 'finished' : 'active',
        'move' => $selected,
    ];
}

function kkc_chess_position_key(string $fen): string
{
    $parts = preg_split('/\s+/', trim($fen));
    return implode(' ', array_slice($parts ?: [], 0, 4));
}
