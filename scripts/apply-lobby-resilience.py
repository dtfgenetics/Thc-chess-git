from pathlib import Path

game_path = Path("client/src/components/game/GamePage.tsx")
socket_path = Path("client/src/components/game/socketEvents.ts")
game = game_path.read_text(encoding="utf-8")
socket = socket_path.read_text(encoding="utf-8")

# GamePage imports and state.
game = game.replace(
    'import { initSocket } from "./socketEvents";\n',
    'import { initSocket, type SocketConnectionState } from "./socketEvents";\n',
    1,
)

if 'const [connectionState, setConnectionState]' not in game:
    anchor = '  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);\n'
    if anchor not in game:
        raise SystemExit("pending promotion state anchor not found")
    game = game.replace(
        anchor,
        anchor + '  const [connectionState, setConnectionState] = useState<SocketConnectionState>("connecting");\n',
        1,
    )

connect_anchor = '''    if (!session?.user || !session.user?.id) return;
    socket.connect();
'''
if 'setConnectionState("connecting");\n    socket.connect();' not in game:
    if connect_anchor not in game:
        raise SystemExit("socket connect anchor not found")
    game = game.replace(
        connect_anchor,
        '''    if (!session?.user || !session.user?.id) return;
    setConnectionState("connecting");
    socket.connect();
''',
        1,
    )

if '      setConnectionState,\n      setPlayBtnLoading\n' not in game:
    actions_anchor = '''      makeMove,
      setNavFen,
      setNavIndex
'''
    if actions_anchor not in game:
        raise SystemExit("initSocket action anchor not found")
    game = game.replace(
        actions_anchor,
        '''      makeMove,
      setNavFen,
      setNavIndex,
      setConnectionState,
      setPlayBtnLoading
''',
        1,
    )

# Replace the generic 3D-ready badge with live connection feedback.
old_badge = '''            <span className="badge badge-success badge-sm">3D ready</span>
            <span>
              {boardMode === "3d" ? "Interactive grow-room board" : "2D compatibility board"}
            </span>
'''
new_badge = '''            <span
              className={`badge badge-sm ${
                connectionState === "connected"
                  ? "badge-success"
                  : connectionState === "connecting"
                    ? "badge-warning"
                    : "badge-error"
              }`}
            >
              {connectionState === "connected"
                ? "online"
                : connectionState === "connecting"
                  ? "connecting"
                  : "reconnecting"}
            </span>
            <span>
              {boardMode === "3d" ? "Interactive grow-room board" : "2D compatibility board"}
            </span>
'''
if old_badge in game:
    game = game.replace(old_badge, new_badge, 1)
elif 'connectionState === "connected"' not in game:
    raise SystemExit("board status badge anchor not found")

# Add compact room/role/spectator HUD above the secondary panel.
if 'Room {initialLobby.code}' not in game:
    panel_anchor = '''      <div className="flex max-w-lg flex-1 flex-col items-center justify-center gap-4">
        <div className="mb-auto flex w-full p-2">
'''
    panel_replacement = '''      <div className="flex max-w-lg flex-1 flex-col items-center justify-center gap-4">
        <div className="flex w-full flex-wrap items-center gap-2 px-2 text-xs">
          <span className="badge badge-outline">Room {initialLobby.code}</span>
          <span className="badge badge-outline">
            {lobby.side === "w" ? "Light player" : lobby.side === "b" ? "Dark player" : "Spectator"}
          </span>
          <span className="badge badge-outline">{lobby.observers?.length ?? 0} watching</span>
        </div>
        <div className="mb-auto flex w-full p-2">
'''
    if panel_anchor not in game:
        raise SystemExit("secondary panel anchor not found")
    game = game.replace(panel_anchor, panel_replacement, 1)

# socketEvents: make connection state explicit and clear join loading after server sync.
if 'export type SocketConnectionState' not in socket:
    import_anchor = 'import { syncPgn, syncSide } from "./utils";\n'
    if import_anchor not in socket:
        raise SystemExit("socket utils import anchor not found")
    socket = socket.replace(
        import_anchor,
        import_anchor + '\nexport type SocketConnectionState = "connecting" | "connected" | "disconnected";\n',
        1,
    )

socket_actions_old = '''        makeMove: Function;
        setNavFen: Dispatch<SetStateAction<string | null>>;
        setNavIndex: Dispatch<SetStateAction<number | null>>;
'''
socket_actions_new = '''        makeMove: Function;
        setNavFen: Dispatch<SetStateAction<string | null>>;
        setNavIndex: Dispatch<SetStateAction<number | null>>;
        setConnectionState: Dispatch<SetStateAction<SocketConnectionState>>;
        setPlayBtnLoading: Dispatch<SetStateAction<boolean>>;
'''
if 'setConnectionState: Dispatch<SetStateAction<SocketConnectionState>>;' not in socket:
    if socket_actions_old not in socket:
        raise SystemExit("socket actions type anchor not found")
    socket = socket.replace(socket_actions_old, socket_actions_new, 1)

connect_old = '''    socket.on("connect", () => {
        socket.emit("joinLobby", lobby.code);
    });
    // TODO: handle disconnect
'''
connect_new = '''    socket.on("connect", () => {
        actions.setConnectionState("connected");
        socket.emit("joinLobby", lobby.code);
    });

    socket.on("disconnect", () => {
        actions.setConnectionState("disconnected");
        actions.setPlayBtnLoading(false);
    });

    socket.on("connect_error", () => {
        actions.setConnectionState("disconnected");
        actions.setPlayBtnLoading(false);
    });
'''
if connect_old in socket:
    socket = socket.replace(connect_old, connect_new, 1)
elif 'socket.on("disconnect"' not in socket:
    raise SystemExit("socket connect/disconnect anchor not found")

latest_anchor = '''    socket.on("receivedLatestGame", (latestGame: Game) => {
        if (latestGame.pgn && latestGame.pgn !== lobby.actualGame.pgn()) {
'''
if 'actions.setPlayBtnLoading(false);\n        if (latestGame.pgn' not in socket:
    if latest_anchor not in socket:
        raise SystemExit("latest game anchor not found")
    socket = socket.replace(
        latest_anchor,
        '''    socket.on("receivedLatestGame", (latestGame: Game) => {
        actions.setPlayBtnLoading(false);
        if (latestGame.pgn && latestGame.pgn !== lobby.actualGame.pgn()) {
''',
        1,
    )

game_path.write_text(game, encoding="utf-8")
socket_path.write_text(socket, encoding="utf-8")
print("lobby connection resilience applied")
