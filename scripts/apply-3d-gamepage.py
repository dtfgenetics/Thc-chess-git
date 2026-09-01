from pathlib import Path

path = Path("client/src/components/game/GamePage.tsx")
text = path.read_text(encoding="utf-8")

import_anchor = 'import { syncPgn, syncSide } from "./utils";\n'
import_line = 'import ThreeChessBoard from "./ThreeChessBoard";\n'
if import_line not in text:
    if import_anchor not in text:
        raise SystemExit("GamePage import anchor not found")
    text = text.replace(import_anchor, import_anchor + import_line, 1)

state_anchor = '  const [boardWidth, setBoardWidth] = useState(480);\n'
state_line = '  const [boardMode, setBoardMode] = useState<"3d" | "2d">("3d");\n'
if state_line not in text:
    if state_anchor not in text:
        raise SystemExit("GamePage board state anchor not found")
    text = text.replace(state_anchor, state_anchor + state_line, 1)

old_board = '''        <Chessboard
          boardWidth={boardWidth}
          customDarkSquareStyle={{ backgroundColor: KUSH_BOARD_THEME.darkSquare }}
          customLightSquareStyle={{ backgroundColor: KUSH_BOARD_THEME.lightSquare }}
          customPieces={customPieces}
          position={navFen || lobby.actualGame.fen()}
          boardOrientation={lobby.side === "b" ? "black" : "white"}
          isDraggablePiece={isDraggablePiece}
          onPieceDragBegin={onPieceDragBegin}
          onPieceDragEnd={onPieceDragEnd}
          onPieceDrop={onDrop}
          onSquareClick={onSquareClick}
          onSquareRightClick={onSquareRightClick}
          arePremovesAllowed={!navFen}
          customSquareStyles={{
            ...(navIndex === null ? customSquares.lastMove : getNavMoveSquares()),
            ...(navIndex === null ? customSquares.check : {}),
            ...customSquares.rightClicked,
            ...(navIndex === null ? customSquares.options : {})
          }}
          ref={chessboardRef}
        />'''

new_board = '''        <div className="mb-2 flex items-center justify-between gap-2" style={{ width: boardWidth }}>
          <div className="flex items-center gap-2 text-xs opacity-75">
            <span className="badge badge-success badge-sm">3D ready</span>
            <span>
              {boardMode === "3d" ? "Interactive grow-room board" : "2D compatibility board"}
            </span>
          </div>
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
              fen={navFen || lobby.actualGame.fen()}
              orientation={lobby.side === "b" ? "black" : "white"}
              disabled={
                lobby.side === "s" ||
                !!navFen ||
                !!lobby.endReason ||
                !!lobby.winner ||
                lobby.side !== lobby.actualGame.turn()
              }
              selectedSquare={moveFrom ? String(moveFrom) : null}
              legalSquares={Object.keys(customSquares.options).filter((square) => square !== moveFrom)}
              lastMoveSquares={Object.keys(
                navIndex === null ? customSquares.lastMove : getNavMoveSquares() || {}
              )}
              checkSquares={Object.keys(navIndex === null ? customSquares.check : {})}
              markerSquares={Object.keys(customSquares.rightClicked)}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
            />
          ) : (
            <Chessboard
              boardWidth={boardWidth}
              customDarkSquareStyle={{ backgroundColor: KUSH_BOARD_THEME.darkSquare }}
              customLightSquareStyle={{ backgroundColor: KUSH_BOARD_THEME.lightSquare }}
              customPieces={customPieces}
              position={navFen || lobby.actualGame.fen()}
              boardOrientation={lobby.side === "b" ? "black" : "white"}
              isDraggablePiece={isDraggablePiece}
              onPieceDragBegin={onPieceDragBegin}
              onPieceDragEnd={onPieceDragEnd}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
              arePremovesAllowed={!navFen}
              customSquareStyles={{
                ...(navIndex === null ? customSquares.lastMove : getNavMoveSquares()),
                ...(navIndex === null ? customSquares.check : {}),
                ...customSquares.rightClicked,
                ...(navIndex === null ? customSquares.options : {})
              }}
              ref={chessboardRef}
            />
          )}
        </div>'''

if "<ThreeChessBoard" not in text:
    if old_board not in text:
        raise SystemExit("GamePage 2D board block not found")
    text = text.replace(old_board, new_board, 1)

path.write_text(text, encoding="utf-8")
print("3D GamePage integration applied")
