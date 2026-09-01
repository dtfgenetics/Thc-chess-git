from pathlib import Path

types_path = Path("types/index.d.ts")
server_game_path = Path("server/src/socket/game.socket.ts")
server_index_path = Path("server/src/socket/index.ts")
socket_events_path = Path("client/src/components/game/socketEvents.ts")
game_page_path = Path("client/src/components/game/GamePage.tsx")
archive_path = Path("client/src/components/archive/ArchivedGame.tsx")

types = types_path.read_text(encoding="utf-8")
server_game = server_game_path.read_text(encoding="utf-8")
server_index = server_index_path.read_text(encoding="utf-8")
socket_events = socket_events_path.read_text(encoding="utf-8")
game_page = game_page_path.read_text(encoding="utf-8")
archive = archive_path.read_text(encoding="utf-8")

# Shared contract.
if '"resigned"' not in types:
    old = 'endReason?: "draw" | "checkmate" | "stalemate" | "repetition" | "insufficient" | "abandoned";'
    new = 'endReason?: "draw" | "checkmate" | "stalemate" | "repetition" | "insufficient" | "abandoned" | "resigned";'
    if old not in types:
        raise SystemExit("Game endReason union anchor not found")
    types = types.replace(old, new, 1)

# Import the pure, verified ownership resolver.
resolver_import = 'import { resolveResignationWinner } from "./gameResult.js";\n'
if resolver_import not in server_game:
    anchor = 'import { upsertObserver } from "./observerRoster.js";\n'
    if anchor not in server_game:
        raise SystemExit("server socket local import anchor not found")
    server_game = server_game.replace(anchor, resolver_import + anchor, 1)

# Server-authoritative resignation endpoint.
if 'export async function resignGame' not in server_game:
    anchor = '''// eslint-disable-next-line no-unused-vars
export async function getLatestGame(this: Socket) {
'''
    resign_fn = '''export async function resignGame(this: Socket) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner || !game.pgn || !game.white || !game.black) return;

    const winnerSide = resolveResignationWinner(game, this.request.session.user.id);
    if (!winnerSide) {
        console.log(`resignGame: session user is not seated in the active game.`);
        return;
    }

    game.endReason = "resigned";
    game.winner = winnerSide;

    const saved = (await GameModel.save(game)) as Game | null;
    if (!saved?.id) {
        console.log(`resignGame: failed to persist game ${game.code}.`);
        this.emit("receivedLatestGame", game);
        return;
    }
    game.id = saved.id;

    const winnerName = winnerSide === "white" ? game.white.name : game.black.name;
    io.to(game.code as string).emit("gameOver", {
        reason: game.endReason,
        winnerName,
        winnerSide,
        id: game.id
    });

    if (game.timeout) clearTimeout(game.timeout);
    activeGames.splice(activeGames.indexOf(game), 1);
}

'''
    if anchor not in server_game:
        raise SystemExit("server getLatestGame anchor not found")
    server_game = server_game.replace(anchor, resign_fn + anchor, 1)
elif 'resolveResignationWinner(game, this.request.session.user.id)' not in server_game:
    raise SystemExit("Existing resignGame implementation does not use the verified resolver")

# Register event.
if 'resignGame,' not in server_index:
    import_anchor = '''    leaveLobby,
    sendMove
'''
    if import_anchor not in server_index:
        raise SystemExit("server socket import anchor not found")
    server_index = server_index.replace(
        import_anchor,
        '''    leaveLobby,
    resignGame,
    sendMove
''',
        1,
    )
if 'socket.on("resignGame", resignGame);' not in server_index:
    handler_anchor = '    socket.on("claimAbandoned", claimAbandoned);\n'
    if handler_anchor not in server_index:
        raise SystemExit("server claimAbandoned handler anchor not found")
    server_index = server_index.replace(
        handler_anchor,
        handler_anchor + '    socket.on("resignGame", resignGame);\n',
        1,
    )

# Client game-over chat message.
if 'reason === "resigned"' not in socket_events:
    anchor = '''            } else if (reason === "checkmate") {
                m.message = `Harvest complete: ${winnerName} (${displaySide(winnerSide)}) won by checkmate.`;
'''
    replacement = '''            } else if (reason === "resigned") {
                m.message = `Harvest complete: ${winnerName} (${displaySide(winnerSide)}) won after the other grower resigned.`;
            } else if (reason === "checkmate") {
                m.message = `Harvest complete: ${winnerName} (${displaySide(winnerSide)}) won by checkmate.`;
'''
    if anchor not in socket_events:
        raise SystemExit("client game-over reason anchor not found")
    socket_events = socket_events.replace(anchor, replacement, 1)

# GamePage action.
if 'function resignMatch()' not in game_page:
    anchor = '''  function claimAbandoned(type: "win" | "draw") {
'''
    resign_client = '''  function resignMatch() {
    if (lobby.side === "s" || lobby.endReason || lobby.winner || !lobby.pgn) return;
    if (!window.confirm("Resign this match? Your opponent will receive the win.")) return;
    socket.emit("resignGame");
  }

'''
    if anchor not in game_page:
        raise SystemExit("GamePage claimAbandoned anchor not found")
    game_page = game_page.replace(anchor, resign_client + anchor, 1)

if 'onClick={resignMatch}' not in game_page:
    anchor = '''          <span className="badge badge-outline">{lobby.observers?.length ?? 0} watching</span>
        </div>
'''
    replacement = '''          <span className="badge badge-outline">{lobby.observers?.length ?? 0} watching</span>
          {lobby.side !== "s" && lobby.pgn && !lobby.endReason && !lobby.winner && (
            <button type="button" className="btn btn-error btn-outline btn-xs" onClick={resignMatch}>
              Resign
            </button>
          )}
        </div>
'''
    if anchor not in game_page:
        raise SystemExit("GamePage room HUD anchor not found")
    game_page = game_page.replace(anchor, replacement, 1)

# Result copy in live game.
if 'won after resignation' not in game_page:
    anchor = '''                  {lobby.endReason === "abandoned"
                    ? lobby.winner === "draw"
'''
    replacement = '''                  {lobby.endReason === "resigned"
                    ? `The match was won by ${lobby.winner} after resignation.`
                    : lobby.endReason === "abandoned"
                      ? lobby.winner === "draw"
'''
    if anchor not in game_page:
        raise SystemExit("GamePage end message anchor not found")
    game_page = game_page.replace(anchor, replacement, 1)

# Result copy in archive.
if 'won after resignation' not in archive:
    anchor = '''            {game.endReason === "abandoned"
              ? game.winner === "draw"
'''
    replacement = '''            {game.endReason === "resigned"
              ? `The match was won by ${game.winner} after resignation.`
              : game.endReason === "abandoned"
                ? game.winner === "draw"
'''
    if anchor not in archive:
        raise SystemExit("ArchivedGame end message anchor not found")
    archive = archive.replace(anchor, replacement, 1)

types_path.write_text(types, encoding="utf-8")
server_game_path.write_text(server_game, encoding="utf-8")
server_index_path.write_text(server_index, encoding="utf-8")
socket_events_path.write_text(socket_events, encoding="utf-8")
game_page_path.write_text(game_page, encoding="utf-8")
archive_path.write_text(archive, encoding="utf-8")
print("authoritative resignation flow applied")
