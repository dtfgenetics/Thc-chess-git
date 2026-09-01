from pathlib import Path

board_path = Path("client/src/components/game/ThreeChessBoard.tsx")
game_path = Path("client/src/components/game/GamePage.tsx")
board = board_path.read_text(encoding="utf-8")
game = game_path.read_text(encoding="utf-8")

board = board.replace(
    'import { Canvas, type ThreeEvent } from "@react-three/fiber";\n',
    'import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";\n',
    1,
)
board = board.replace(
    'import { useMemo, useState } from "react";\n',
    'import { useMemo, useRef, useState } from "react";\nimport type { Group } from "three";\n',
    1,
)

old_actor = '''function PieceActor({
  piece,
  disabled,
  onSquareClick,
  onSquareRightClick
}: {
  piece: PieceDescriptor;
  disabled: boolean;
  onSquareClick: (square: Square) => void;
  onSquareRightClick?: (square: Square) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [x, y, z] = worldFromSquare(piece.square);

  function click(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!disabled) onSquareClick(piece.square);
  }

  function contextMenu(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    onSquareRightClick?.(piece.square);
  }

  return (
    <group
      position={[x, y + (hovered && !disabled ? 0.07 : 0), z]}
      onClick={click}
      onContextMenu={contextMenu}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      scale={hovered && !disabled ? 1.035 : 1}
      userData={{ square: piece.square, piece: PIECE_NAMES[piece.type] }}
    >
      <KushPieceModel type={piece.type} color={piece.color} />
    </group>
  );
}
'''

new_actor = '''function PieceActor({
  piece,
  animateFrom,
  disabled,
  onSquareClick,
  onSquareRightClick
}: {
  piece: PieceDescriptor;
  animateFrom?: Square;
  disabled: boolean;
  onSquareClick: (square: Square) => void;
  onSquareRightClick?: (square: Square) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);
  const target = worldFromSquare(piece.square);
  const source = animateFrom ? worldFromSquare(animateFrom) : target;
  const progress = useRef(animateFrom ? 0 : 1);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    progress.current = Math.min(1, progress.current + delta * 4.2);
    const eased = 1 - Math.pow(1 - progress.current, 3);
    const hoverLift = hovered && !disabled ? 0.07 : 0;
    const travelLift = animateFrom ? Math.sin(Math.PI * eased) * 0.3 : 0;

    group.position.set(
      source[0] + (target[0] - source[0]) * eased,
      target[1] + travelLift + hoverLift,
      source[2] + (target[2] - source[2]) * eased
    );
  });

  function click(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!disabled) onSquareClick(piece.square);
  }

  function contextMenu(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    onSquareRightClick?.(piece.square);
  }

  return (
    <group
      ref={groupRef}
      position={source}
      onClick={click}
      onContextMenu={contextMenu}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      scale={hovered && !disabled ? 1.035 : 1}
      userData={{ square: piece.square, piece: PIECE_NAMES[piece.type] }}
    >
      <KushPieceModel type={piece.type} color={piece.color} />
    </group>
  );
}
'''

if old_actor in board:
    board = board.replace(old_actor, new_actor, 1)
elif 'animateFrom?: Square;' not in board:
    raise SystemExit("PieceActor anchor not found")

old_map = '''        {pieces.map((piece) => (
          <PieceActor
            key={`${piece.square}-${piece.color}-${piece.type}`}
            piece={piece}
            disabled={disabled ?? false}
            onSquareClick={onSquareClick}
            onSquareRightClick={onSquareRightClick}
          />
        ))}
'''
new_map = '''        {pieces.map((piece) => {
          const animateFrom =
            lastMoveSquares.length >= 2 && lastMoveSquares[1] === piece.square
              ? (lastMoveSquares[0] as Square)
              : undefined;
          return (
            <PieceActor
              key={`${piece.square}-${piece.color}-${piece.type}`}
              piece={piece}
              animateFrom={animateFrom}
              disabled={disabled ?? false}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
            />
          );
        })}
'''
if old_map in board:
    board = board.replace(old_map, new_map, 1)
elif 'animateFrom={animateFrom}' not in board:
    raise SystemExit("PieceActor map anchor not found")

board = board.replace(
    'className="relative h-full w-full overflow-hidden rounded-xl border border-base-300 bg-[#08130D] shadow-2xl"',
    'className="relative h-full w-full touch-none overflow-hidden rounded-xl border border-base-300 bg-[#08130D] shadow-2xl"',
    1,
)

old_resize = '''    } else {
      setBoardWidth(350);
    }
'''
new_resize = '''    } else {
      setBoardWidth(Math.min(350, Math.max(240, window.innerWidth - 24)));
    }
'''
if old_resize in game:
    game = game.replace(old_resize, new_resize, 1)
elif 'Math.max(240, window.innerWidth - 24)' not in game:
    raise SystemExit("mobile board resize anchor not found")

board_path.write_text(board, encoding="utf-8")
game_path.write_text(game, encoding="utf-8")
print("3D animation and mobile sizing applied")
