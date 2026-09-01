from pathlib import Path

types_path = Path("types/index.d.ts")
server_game_path = Path("server/src/socket/game.socket.ts")
server_index_path = Path("server/src/socket/index.ts")
socket_events_path = Path("client/src/components/game/socketEvents.ts")
game_page_path = Path("client/src/components/game/GamePage.tsx")

types = types_path.read_text(encoding="utf-8")
server_game = server_game_path.read_text(encoding="utf-8")
server_index = server_index_path.read_text(encoding="utf-8")
socket_events = socket_events_path.read_text(encoding="utf-8")
game_page = game_page_path.read_text(encoding="utf-8")

# Shared transient lobby state.
if "drawOfferFrom?:" not in types:
    anchor = "    endedAt?: number;\n"
    if anchor not in types:
        raise SystemExit("types endedAt anchor not found")
    types = types.replace(anchor, anchor + "    drawOfferFrom?: User[\"id\"];\n", 1)

# Server handlers.
if "export async function offerDraw" not in server_game:
    anchor = "export async function resignGame(this: Socket) {\n"
    block = '''export async function offerDraw(this: Socket) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner || !game.pgn || !game.white || !game.black) return;

    const userId = this.request.session.user.id;
    if (userId !== game.white.id && userId !== game.black.id) {
        console.log(`offerDraw: session user is not seated in the active game.`);
        return;
    }
    if (game.drawOfferFrom === userId) return;

    game.drawOfferFrom = userId;
    io.to(game.code as string).emit("drawOffered", {
        from: userId,
        name: this.request.session.user.name
    });
}

export async function respondToDraw(this: Socket, accept: boolean) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner || !game.pgn || !game.white || !game.black) return;

    const userId = this.request.session.user.id;
    if (userId !== game.white.id && userId !== game.black.id) {
        console.log(`respondToDraw: session user is not seated in the active game.`);
        return;
    }
    if (game.drawOfferFrom === undefined || game.drawOfferFrom === userId) return;

    if (!accept) {
        game.drawOfferFrom = undefined;
        io.to(game.code as string).emit("drawOfferCleared", {
            message: `${this.request.session.user.name} declined the draw offer.`
        });
        return;
    }

    game.drawOfferFrom = undefined;
    game.endReason = "draw";
    game.winner = "draw";

    const saved = (await GameModel.save(game)) as Game | null;
    if (!saved?.id) {
        console.log(`respondToDraw: failed to persist game ${game.code}.`);
        this.emit("receivedLatestGame", game);
        return;
    }
    game.id = saved.id;

    io.to(game.code as string).emit("gameOver", {
        reason: game.endReason,
        winnerSide: "draw",
        id: game.id
    });

    if (game.timeout) clearTimeout(game.timeout);
    activeGames.splice(activeGames.indexOf(game), 1);
}

'''
    if anchor not in server_game:
        raise SystemExit("server resign anchor not found")
    server_game = server_game.replace(anchor, block + anchor, 1)

# A legal move declines/clears any pending draw offer before broadcasting the move.
move_anchor = '''        if (newMove) {
            game.pgn = chess.pgn();
            this.to(game.code as string).emit("receivedMove", m);
'''
if "game.drawOfferFrom = undefined;\n                io.to(game.code as string).emit(\"drawOfferCleared\"" not in server_game:
    move_replacement = '''        if (newMove) {
            game.pgn = chess.pgn();
            if (game.drawOfferFrom !== undefined) {
                game.drawOfferFrom = undefined;
                io.to(game.code as string).emit("drawOfferCleared", {
                    message: "The draw offer was declined by continuing play."
                });
            }
            this.to(game.code as string).emit("receivedMove", m);
'''
    if move_anchor not in server_game:
        raise SystemExit("sendMove success anchor not found")
    server_game = server_game.replace(move_anchor, move_replacement, 1)

# Register socket events.
if "offerDraw," not in server_index:
    anchor = "    leaveLobby,\n"
    if anchor not in server_index:
        raise SystemExit("server index leaveLobby anchor not found")
    server_index = server_index.replace(anchor, anchor + "    offerDraw,\n", 1)
if "respondToDraw," not in server_index:
    anchor = "    resignGame,\n"
    if anchor not in server_index:
        raise SystemExit("server index resignGame anchor not found")
    server_index = server_index.replace(anchor, anchor + "    respondToDraw,\n", 1)
if 'socket.on("offerDraw", offerDraw);' not in server_index:
    anchor = '    socket.on("resignGame", resignGame);\n'
    if anchor not in server_index:
        raise SystemExit("resign socket handler anchor not found")
    server_index = server_index.replace(
        anchor,
        anchor + '    socket.on("offerDraw", offerDraw);\n    socket.on("respondToDraw", respondToDraw);\n',
        1,
    )

# Client socket state/messages.
if 'socket.on("drawOffered"' not in socket_events:
    anchor = '''    socket.on("userJoinedAsPlayer", ({ name, side }: { name: string; side: "white" | "black" }) => {
'''
    block = '''    socket.on("drawOffered", ({ from, name }: { from: User["id"]; name?: string | null }) => {
        actions.updateLobby({ type: "updateLobby", payload: { drawOfferFrom: from } });
        actions.addMessage({
            author: { name: "Grow Room" },
            message: `${name || "A grower"} offered an even harvest.`
        });
    });

    socket.on("drawOfferCleared", ({ message }: { message?: string }) => {
        actions.updateLobby({ type: "updateLobby", payload: { drawOfferFrom: undefined } });
        if (message) {
            actions.addMessage({ author: { name: "Grow Room" }, message });
        }
    });

'''
    if anchor not in socket_events:
        raise SystemExit("socket userJoinedAsPlayer anchor not found")
    socket_events = socket_events.replace(anchor, block + anchor, 1)

# GamePage handlers.
if "function offerDraw()" not in game_page:
    anchor = "  function resignMatch() {\n"
    block = '''  function offerDraw() {
    if (lobby.side === "s" || lobby.endReason || lobby.winner || !lobby.pgn) return;
    socket.emit("offerDraw");
  }

  function respondToDraw(accept: boolean) {
    if (lobby.side === "s" || lobby.endReason || lobby.winner || lobby.drawOfferFrom === undefined) return;
    socket.emit("respondToDraw", accept);
  }

'''
    if anchor not in game_page:
        raise SystemExit("GamePage resignMatch anchor not found")
    game_page = game_page.replace(anchor, block + anchor, 1)

# Draw action UI beside resign button.
if "onClick={offerDraw}" not in game_page:
    anchor = '''          {lobby.side !== "s" && lobby.pgn && !lobby.endReason && !lobby.winner && (
            <button type="button" className="btn btn-error btn-outline btn-xs" onClick={resignMatch}>
              Resign
            </button>
          )}
'''
    replacement = '''          {lobby.side !== "s" && lobby.pgn && !lobby.endReason && !lobby.winner && (
            <>
              {lobby.drawOfferFrom === undefined ? (
                <button type="button" className="btn btn-outline btn-xs" onClick={offerDraw}>
                  Offer Draw
                </button>
              ) : lobby.drawOfferFrom === session?.user?.id ? (
                <span className="badge badge-warning badge-sm">Draw offered</span>
              ) : (
                <div className="join">
                  <button type="button" className="btn btn-success btn-outline join-item btn-xs" onClick={() => respondToDraw(true)}>
                    Accept Draw
                  </button>
                  <button type="button" className="btn btn-ghost join-item btn-xs" onClick={() => respondToDraw(false)}>
                    Decline
                  </button>
                </div>
              )}
              <button type="button" className="btn btn-error btn-outline btn-xs" onClick={resignMatch}>
                Resign
              </button>
            </>
          )}
'''
    if anchor not in game_page:
        raise SystemExit("GamePage resign UI anchor not found")
    game_page = game_page.replace(anchor, replacement, 1)

types_path.write_text(types, encoding="utf-8")
server_game_path.write_text(server_game, encoding="utf-8")
server_index_path.write_text(server_index, encoding="utf-8")
socket_events_path.write_text(socket_events, encoding="utf-8")
game_page_path.write_text(game_page, encoding="utf-8")
print("server-authoritative draw offer flow applied")
