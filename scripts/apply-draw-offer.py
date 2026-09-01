from pathlib import Path

types_path = Path("types/index.d.ts")
result_path = Path("server/src/socket/gameResult.ts")
server_game_path = Path("server/src/socket/game.socket.ts")
server_index_path = Path("server/src/socket/index.ts")
game_page_path = Path("client/src/components/game/GamePage.tsx")

types = types_path.read_text(encoding="utf-8")
result = result_path.read_text(encoding="utf-8")
server_game = server_game_path.read_text(encoding="utf-8")
server_index = server_index_path.read_text(encoding="utf-8")
game_page = game_page_path.read_text(encoding="utf-8")

# Shared transient state. It is never persisted; it only belongs to an active lobby.
if "drawOfferBy?:" not in types:
    anchor = "    observers?: User[];\n"
    if anchor not in types:
        raise SystemExit("Game observers anchor not found")
    types = types.replace(anchor, anchor + "    drawOfferBy?: number | string;\n", 1)

# Pure ownership helpers for server verification.
if "export function canOfferDraw" not in result:
    result += '''\nexport function canOfferDraw(\n    game: Pick<Game, "white" | "black" | "drawOfferBy">,\n    userId: User["id"]\n): boolean {\n    if (!game.white || !game.black || userId === undefined || game.drawOfferBy !== undefined) return false;\n    return game.white.id === userId || game.black.id === userId;\n}\n\nexport function canRespondToDraw(\n    game: Pick<Game, "white" | "black" | "drawOfferBy">,\n    userId: User["id"]\n): boolean {\n    if (!game.white || !game.black || userId === undefined || game.drawOfferBy === undefined) return false;\n    if (game.drawOfferBy === userId) return false;\n    const isPlayer = game.white.id === userId || game.black.id === userId;\n    const offererIsPlayer = game.white.id === game.drawOfferBy || game.black.id === game.drawOfferBy;\n    return isPlayer && offererIsPlayer;\n}\n'''

# Import ownership guards.
old_import = 'import { resolveResignationWinner } from "./gameResult.js";'
new_import = 'import { canOfferDraw, canRespondToDraw, resolveResignationWinner } from "./gameResult.js";'
if old_import in server_game:
    server_game = server_game.replace(old_import, new_import, 1)
elif "canOfferDraw" not in server_game.split("\n", 12)[0:12].__str__():
    raise SystemExit("gameResult import anchor not found")

# Server-authoritative draw offer/respond actions.
if "export async function offerDraw" not in server_game:
    anchor = "export async function resignGame(this: Socket) {\n"
    if anchor not in server_game:
        raise SystemExit("resignGame anchor not found")
    draw_functions = '''export async function offerDraw(this: Socket) {\n    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);\n    if (!game || game.endReason || game.winner || !game.pgn || !canOfferDraw(game, this.request.session.user.id)) {\n        return;\n    }\n\n    game.drawOfferBy = this.request.session.user.id;\n    io.to(game.code as string).emit("receivedLatestGame", game);\n}\n\nexport async function respondToDraw(this: Socket, accept: boolean) {\n    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);\n    if (!game || game.endReason || game.winner || !game.pgn || !canRespondToDraw(game, this.request.session.user.id)) {\n        return;\n    }\n\n    if (!accept) {\n        game.drawOfferBy = undefined;\n        io.to(game.code as string).emit("receivedLatestGame", game);\n        return;\n    }\n\n    game.drawOfferBy = undefined;\n    game.endReason = "draw";\n    game.winner = "draw";\n\n    const saved = (await GameModel.save(game)) as Game | null;\n    if (!saved?.id) {\n        console.log(`respondToDraw: failed to persist game ${game.code}.`);\n        this.emit("receivedLatestGame", game);\n        return;\n    }\n    game.id = saved.id;\n\n    io.to(game.code as string).emit("gameOver", {\n        reason: game.endReason,\n        winnerSide: undefined,\n        id: game.id\n    });\n\n    if (game.timeout) clearTimeout(game.timeout);\n    activeGames.splice(activeGames.indexOf(game), 1);\n}\n\n'''
    server_game = server_game.replace(anchor, draw_functions + anchor, 1)

# An opponent move implicitly rejects a pending draw offer.
if "game.drawOfferBy !== undefined && game.drawOfferBy !== this.request.session.user.id" not in server_game:
    anchor = '''        const newMove = chess.move(m);\n\n        if (newMove) {\n'''
    replacement = '''        const newMove = chess.move(m);\n\n        if (newMove) {\n            if (game.drawOfferBy !== undefined && game.drawOfferBy !== this.request.session.user.id) {\n                game.drawOfferBy = undefined;\n            }\n'''
    if anchor not in server_game:
        raise SystemExit("sendMove newMove anchor not found")
    server_game = server_game.replace(anchor, replacement, 1)

# Register socket events.
if "offerDraw," not in server_index:
    anchor = '''    leaveLobby,\n    resignGame,\n    sendMove\n'''
    replacement = '''    leaveLobby,\n    offerDraw,\n    resignGame,\n    respondToDraw,\n    sendMove\n'''
    if anchor not in server_index:
        raise SystemExit("socket import anchor not found")
    server_index = server_index.replace(anchor, replacement, 1)

if 'socket.on("offerDraw", offerDraw);' not in server_index:
    anchor = '    socket.on("resignGame", resignGame);\n'
    if anchor not in server_index:
        raise SystemExit("resign socket handler anchor not found")
    server_index = server_index.replace(
        anchor,
        anchor + '    socket.on("offerDraw", offerDraw);\n    socket.on("respondToDraw", respondToDraw);\n',
        1,
    )

# Client actions.
if "function offerDraw()" not in game_page:
    anchor = '''  function resignMatch() {\n'''
    draw_client = '''  function offerDraw() {\n    if (lobby.side === "s" || lobby.endReason || lobby.winner || !lobby.pgn || lobby.drawOfferBy !== undefined) return;\n    socket.emit("offerDraw");\n  }\n\n  function respondToDraw(accept: boolean) {\n    if (lobby.side === "s" || lobby.endReason || lobby.winner || lobby.drawOfferBy === undefined) return;\n    socket.emit("respondToDraw", accept);\n  }\n\n'''
    if anchor not in game_page:
        raise SystemExit("resignMatch client anchor not found")
    game_page = game_page.replace(anchor, draw_client + anchor, 1)

# Match-control HUD.
if 'onClick={offerDraw}' not in game_page:
    anchor = '''          {lobby.side !== "s" && lobby.pgn && !lobby.endReason && !lobby.winner && (\n            <button type="button" className="btn btn-error btn-outline btn-xs" onClick={resignMatch}>\n              Resign\n            </button>\n          )}\n'''
    replacement = '''          {lobby.side !== "s" && lobby.pgn && !lobby.endReason && !lobby.winner && (\n            <>\n              {lobby.drawOfferBy === undefined ? (\n                <button type="button" className="btn btn-outline btn-xs" onClick={offerDraw}>\n                  Offer Draw\n                </button>\n              ) : lobby.drawOfferBy === session?.user?.id ? (\n                <span className="badge badge-warning badge-sm">Draw offered</span>\n              ) : (\n                <span className="flex items-center gap-1">\n                  <span className="badge badge-warning badge-sm">Draw offered</span>\n                  <button type="button" className="btn btn-success btn-xs" onClick={() => respondToDraw(true)}>\n                    Accept\n                  </button>\n                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => respondToDraw(false)}>\n                    Decline\n                  </button>\n                </span>\n              )}\n              <button type="button" className="btn btn-error btn-outline btn-xs" onClick={resignMatch}>\n                Resign\n              </button>\n            </>\n          )}\n'''
    if anchor not in game_page:
        raise SystemExit("resign HUD anchor not found")
    game_page = game_page.replace(anchor, replacement, 1)

types_path.write_text(types, encoding="utf-8")
result_path.write_text(result, encoding="utf-8")
server_game_path.write_text(server_game, encoding="utf-8")
server_index_path.write_text(server_index, encoding="utf-8")
game_page_path.write_text(game_page, encoding="utf-8")
print("authoritative draw offer flow applied")
