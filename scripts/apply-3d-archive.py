from pathlib import Path

path = Path("client/src/components/archive/ArchivedGame.tsx")
text = path.read_text(encoding="utf-8")

if 'import CapturedPieces from "@/components/game/CapturedPieces";\n' not in text:
    anchor = 'import { SITE_URL } from "@/config";\n'
    if anchor not in text:
        raise SystemExit("archive config import anchor not found")
    text = text.replace(
        anchor,
        anchor + 'import CapturedPieces from "@/components/game/CapturedPieces";\nimport ThreeChessBoard from "@/components/game/ThreeChessBoard";\n',
        1,
    )

if 'const [boardMode, setBoardMode]' not in text:
    anchor = '  const [boardWidth, setBoardWidth] = useState(480);\n'
    if anchor not in text:
        raise SystemExit("archive board width state anchor not found")
    text = text.replace(
        anchor,
        anchor + '  const [boardMode, setBoardMode] = useState<"3d" | "2d">("3d");\n',
        1,
    )

# Make archive board fit narrow phones too.
old_resize = '''    } else {
      setBoardWidth(350);
    }
'''
new_resize = '''    } else {
      setBoardWidth(Math.min(350, Math.max(240, window.innerWidth - 24)));
    }
'''
if old_resize in text:
    text = text.replace(old_resize, new_resize, 1)

old_board = '''      <div className="h-min">
        <Chessboard
          boardWidth={boardWidth}
          customDarkSquareStyle={{ backgroundColor: KUSH_BOARD_THEME.darkSquare }}
          customLightSquareStyle={{ backgroundColor: KUSH_BOARD_THEME.lightSquare }}
          customPieces={customPieces}
          position={navFen || actualGame.fen()}
          boardOrientation={flipBoard ? "black" : "white"}
          isDraggablePiece={() => false}
          onSquareClick={() => updateCustomSquares({ rightClicked: {} })}
          onSquareRightClick={onSquareRightClick}
          customSquareStyles={{
            ...getNavMoveSquares(),
            ...customSquares.rightClicked
          }}
        />
      </div>
'''

new_board = '''      <div className="h-min">
        <div className="mb-2 flex items-center justify-between gap-2" style={{ width: boardWidth }}>
          <span className="text-xs opacity-70">Archived 3D replay</span>
          <div className="join">
            <button
              type="button"
              className={`btn join-item btn-xs ${boardMode === "3d" ? "btn-primary" : "btn-ghost"}`}
              aria-pressed={boardMode === "3d"}
              onClick={() => setBoardMode("3d")}
            >
              3D
            </button>
            <button
              type="button"
              className={`btn join-item btn-xs ${boardMode === "2d" ? "btn-primary" : "btn-ghost"}`}
              aria-pressed={boardMode === "2d"}
              onClick={() => setBoardMode("2d")}
            >
              2D
            </button>
          </div>
        </div>

        <div style={{ width: boardWidth, height: boardWidth }}>
          {boardMode === "3d" ? (
            <ThreeChessBoard
              fen={navFen || actualGame.fen()}
              orientation={flipBoard ? "black" : "white"}
              disabled
              lastMoveSquares={Object.keys(getNavMoveSquares() || {})}
              markerSquares={Object.keys(customSquares.rightClicked)}
              onSquareClick={() => undefined}
              onSquareRightClick={onSquareRightClick}
            />
          ) : (
            <Chessboard
              boardWidth={boardWidth}
              customDarkSquareStyle={{ backgroundColor: KUSH_BOARD_THEME.darkSquare }}
              customLightSquareStyle={{ backgroundColor: KUSH_BOARD_THEME.lightSquare }}
              customPieces={customPieces}
              position={navFen || actualGame.fen()}
              boardOrientation={flipBoard ? "black" : "white"}
              isDraggablePiece={() => false}
              onSquareClick={() => updateCustomSquares({ rightClicked: {} })}
              onSquareRightClick={onSquareRightClick}
              customSquareStyles={{
                ...getNavMoveSquares(),
                ...customSquares.rightClicked
              }}
            />
          )}
        </div>

        <CapturedPieces
          history={
            navIndex === null
              ? actualGame.history({ verbose: true })
              : actualGame.history({ verbose: true }).slice(0, navIndex + 1)
          }
        />
      </div>
'''

if old_board in text:
    text = text.replace(old_board, new_board, 1)
elif 'Archived 3D replay' not in text:
    raise SystemExit("archive chessboard block not found")

path.write_text(text, encoding="utf-8")
print("3D archive replay applied")
