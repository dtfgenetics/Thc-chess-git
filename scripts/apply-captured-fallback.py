from pathlib import Path

game_path = Path("client/src/components/game/GamePage.tsx")
board_path = Path("client/src/components/game/ThreeChessBoard.tsx")
game = game_path.read_text(encoding="utf-8")
board = board_path.read_text(encoding="utf-8")

if 'import CapturedPieces from "./CapturedPieces";\n' not in game:
    anchor = 'import PromotionPicker from "./PromotionPicker";\n'
    if anchor not in game:
        raise SystemExit("PromotionPicker import anchor not found")
    game = game.replace(anchor, 'import CapturedPieces from "./CapturedPieces";\n' + anchor, 1)

capture_block = '''        <CapturedPieces
          history={
            navIndex === null
              ? (lobby.actualGame.history({ verbose: true }) as Move[])
              : (lobby.actualGame.history({ verbose: true }) as Move[]).slice(0, navIndex + 1)
          }
        />
'''
if '<CapturedPieces' not in game:
    anchor = '''        </div>
      </div>

      <div className="flex max-w-lg flex-1 flex-col items-center justify-center gap-4">
'''
    replacement = '''        </div>
''' + capture_block + '''      </div>

      <div className="flex max-w-lg flex-1 flex-col items-center justify-center gap-4">
'''
    if anchor not in game:
        raise SystemExit("board column closing anchor not found")
    game = game.replace(anchor, replacement, 1)

if 'fallback={' not in board:
    anchor = '''      <Canvas
        key={`${orientation}-${cameraView}-${cameraReset}`}
'''
    replacement = '''      <Canvas
        fallback={
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-base-200 p-6 text-center">
            <strong>3D is unavailable on this device.</strong>
            <span className="max-w-xs text-sm opacity-75">
              Use the 2D button above to keep playing the same multiplayer match.
            </span>
          </div>
        }
        key={`${orientation}-${cameraView}-${cameraReset}`}
'''
    if anchor not in board:
        raise SystemExit("Canvas anchor not found")
    board = board.replace(anchor, replacement, 1)

game_path.write_text(game, encoding="utf-8")
board_path.write_text(board, encoding="utf-8")
print("captured trays and WebGL fallback applied")
