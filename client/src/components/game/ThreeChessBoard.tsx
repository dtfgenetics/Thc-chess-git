"use client";
/* eslint-disable no-unused-vars */

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";

import { KUSH_BOARD_THEME } from "@/kushTheme";

type BoardOrientation = "white" | "black";

type ThreeChessBoardProps = {
  fen: string;
  orientation: BoardOrientation;
  disabled?: boolean;
  selectedSquare?: string | null;
  legalSquares?: string[];
  lastMoveSquares?: string[];
  checkSquares?: string[];
  markerSquares?: string[];
  onSquareClick: (square: Square) => void;
  onSquareRightClick?: (square: Square) => void;
};

type HighlightKind = "selected" | "legal" | "last" | "check" | "marker" | null;

type PieceDescriptor = {
  square: Square;
  type: PieceSymbol;
  color: Color;
};

const BOARD_SIZE = 8;
const TILE_SIZE = 1;
const GOLD = "#D4A017";
const LEAF = "#4F8F46";
const LEAF_DARK = "#276738";
const LIGHT_PIECE = "#F1E3BF";
const DARK_PIECE = "#24170F";
const DARK_TRIM = "#0D2817";

const PIECE_NAMES: Record<PieceSymbol, string> = {
  k: "Master Grower",
  q: "Mother Plant",
  b: "Breeder",
  n: "Rolling Knight",
  r: "Grow Tower",
  p: "Seedling"
};

function squareFromGrid(row: number, column: number): Square {
  return `${String.fromCharCode(97 + column)}${8 - row}` as Square;
}

function worldFromSquare(square: Square): [number, number, number] {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return [file - 3.5, 0.2, 4.5 - rank];
}

function PieceMaterial({ color, accent = false }: { color: Color; accent?: boolean }) {
  const materialColor = accent ? GOLD : color === "w" ? LIGHT_PIECE : DARK_PIECE;
  return <meshStandardMaterial color={materialColor} metalness={accent ? 0.65 : 0.28} roughness={0.34} />;
}

function LeafCluster({ color }: { color: Color }) {
  const leafColor = color === "w" ? LEAF : LEAF_DARK;
  const rotations = [-0.95, -0.48, 0, 0.48, 0.95];
  return (
    <group position={[0, 0.28, 0]}>
      {rotations.map((rotation, index) => (
        <mesh
          castShadow
          key={rotation}
          position={[Math.sin(rotation) * 0.16, Math.abs(rotation) * -0.03, Math.cos(rotation) * 0.06]}
          rotation={[0.2, 0, rotation]}
          scale={[0.11 + index * 0.006, 0.04, 0.26 - Math.abs(index - 2) * 0.02]}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={leafColor} metalness={0.08} roughness={0.55} />
        </mesh>
      ))}
      <mesh castShadow position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.34, 10]} />
        <meshStandardMaterial color={leafColor} roughness={0.6} />
      </mesh>
    </group>
  );
}

function StandardBase({ color, scale = 1 }: { color: Color; scale?: number }) {
  return (
    <group scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.2, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.23, 0]}>
        <cylinderGeometry args={[0.29, 0.34, 0.08, 24]} />
        <PieceMaterial color={color} accent />
      </mesh>
    </group>
  );
}

function SeedlingPiece({ color }: { color: Color }) {
  return (
    <group>
      <StandardBase color={color} scale={0.86} />
      <mesh castShadow position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.34, 18]} />
        <PieceMaterial color={color} />
      </mesh>
      <LeafCluster color={color} />
    </group>
  );
}

function GrowTowerPiece({ color }: { color: Color }) {
  return (
    <group>
      <StandardBase color={color} />
      <mesh castShadow position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.27, 0.3, 0.72, 18]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.36, 0.3, 0.16, 12]} />
        <PieceMaterial color={color} accent />
      </mesh>
      {[0, Math.PI / 2].map((rotation) => (
        <mesh castShadow key={rotation} position={[0, 1.14, 0]} rotation={[Math.PI / 2, 0, rotation]}>
          <boxGeometry args={[0.12, 0.58, 0.16]} />
          <PieceMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function BreederPiece({ color }: { color: Color }) {
  return (
    <group>
      <StandardBase color={color} />
      <mesh castShadow position={[0, 0.65, 0]}>
        <coneGeometry args={[0.3, 0.78, 20]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 1.12, 0]} scale={[0.18, 0.28, 0.16]} rotation={[0, 0, 0.45]}>
        <sphereGeometry args={[1, 18, 12]} />
        <PieceMaterial color={color} accent />
      </mesh>
    </group>
  );
}

function RollingKnightPiece({ color }: { color: Color }) {
  return (
    <group>
      <StandardBase color={color} />
      <mesh castShadow position={[0, 0.68, 0]} rotation={[0, 0, -0.16]}>
        <cylinderGeometry args={[0.22, 0.28, 0.72, 18]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0.12, 1.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.2, 0.58, 18]} />
        <PieceMaterial color={color} accent />
      </mesh>
      <mesh castShadow position={[0.36, 1.08, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.2, 0.34, 18]} />
        <meshStandardMaterial color={color === "w" ? LEAF : LEAF_DARK} roughness={0.5} />
      </mesh>
    </group>
  );
}

function MotherPlantPiece({ color }: { color: Color }) {
  return (
    <group>
      <StandardBase color={color} />
      <mesh castShadow position={[0, 0.63, 0]}>
        <cylinderGeometry args={[0.18, 0.29, 0.72, 20]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.97, 0]}>
        <torusGeometry args={[0.27, 0.055, 10, 28]} />
        <PieceMaterial color={color} accent />
      </mesh>
      <group position={[0, 0.96, 0]} scale={0.78}>
        <LeafCluster color={color} />
      </group>
    </group>
  );
}

function MasterGrowerPiece({ color }: { color: Color }) {
  return (
    <group>
      <StandardBase color={color} />
      <mesh castShadow position={[0, 0.68, 0]}>
        <cylinderGeometry args={[0.19, 0.3, 0.8, 20]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.3, 0.22, 0.13, 18]} />
        <PieceMaterial color={color} accent />
      </mesh>
      {[-0.24, 0, 0.24].map((x, index) => (
        <mesh castShadow key={x} position={[x, 1.28 + (index === 1 ? 0.08 : 0), 0]}>
          <coneGeometry args={[0.12, 0.36, 12]} />
          <PieceMaterial color={color} accent={index === 1} />
        </mesh>
      ))}
      <group position={[0, 1.28, 0.08]} scale={0.42}>
        <LeafCluster color={color} />
      </group>
    </group>
  );
}

function KushPieceModel({ type, color }: { type: PieceSymbol; color: Color }) {
  switch (type) {
    case "k":
      return <MasterGrowerPiece color={color} />;
    case "q":
      return <MotherPlantPiece color={color} />;
    case "b":
      return <BreederPiece color={color} />;
    case "n":
      return <RollingKnightPiece color={color} />;
    case "r":
      return <GrowTowerPiece color={color} />;
    default:
      return <SeedlingPiece color={color} />;
  }
}

function highlightColor(kind: HighlightKind): string | null {
  switch (kind) {
    case "selected":
    case "last":
      return GOLD;
    case "legal":
      return "#4CAF50";
    case "check":
      return "#B43A2E";
    case "marker":
      return "#2E7D32";
    default:
      return null;
  }
}

function BoardSquare({
  square,
  row,
  column,
  highlight,
  disabled,
  onSquareClick,
  onSquareRightClick
}: {
  square: Square;
  row: number;
  column: number;
  highlight: HighlightKind;
  disabled: boolean;
  onSquareClick: (square: Square) => void;
  onSquareRightClick?: (square: Square) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const light = (row + column) % 2 === 0;
  const highlightValue = highlightColor(highlight);

  function click(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (!disabled) onSquareClick(square);
  }

  function contextMenu(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    onSquareRightClick?.(square);
  }

  return (
    <group position={[column - 3.5, 0, row - 3.5]}>
      <mesh
        receiveShadow
        position={[0, hovered && !disabled ? 0.025 : 0, 0]}
        onClick={click}
        onContextMenu={contextMenu}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[TILE_SIZE, 0.18, TILE_SIZE]} />
        <meshStandardMaterial
          color={light ? KUSH_BOARD_THEME.lightSquare : KUSH_BOARD_THEME.darkSquare}
          metalness={0.08}
          roughness={0.68}
        />
      </mesh>
      {highlightValue && (
        <mesh position={[0, 0.105, 0]} onClick={click} onContextMenu={contextMenu}>
          <boxGeometry args={[0.88, 0.03, 0.88]} />
          <meshStandardMaterial
            color={highlightValue}
            emissive={highlightValue}
            emissiveIntensity={highlight === "check" ? 0.42 : 0.16}
            transparent
            opacity={highlight === "legal" ? 0.48 : 0.58}
          />
        </mesh>
      )}
    </group>
  );
}

function PieceActor({
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

function BoardScene({
  fen,
  orientation,
  disabled,
  selectedSquare,
  legalSquares,
  lastMoveSquares,
  checkSquares,
  markerSquares,
  onSquareClick,
  onSquareRightClick
}: Required<
  Pick<ThreeChessBoardProps, "fen" | "orientation" | "onSquareClick">
> &
  Omit<ThreeChessBoardProps, "fen" | "orientation" | "onSquareClick">) {
  const pieces = useMemo<PieceDescriptor[]>(() => {
    const board = new Chess(fen).board();
    return board.flatMap((row, rowIndex) =>
      row.flatMap((piece, columnIndex) =>
        piece
          ? [
              {
                square: squareFromGrid(rowIndex, columnIndex),
                type: piece.type,
                color: piece.color
              }
            ]
          : []
      )
    );
  }, [fen]);

  const legal = useMemo(() => new Set(legalSquares), [legalSquares]);
  const last = useMemo(() => new Set(lastMoveSquares), [lastMoveSquares]);
  const checks = useMemo(() => new Set(checkSquares), [checkSquares]);
  const markers = useMemo(() => new Set(markerSquares), [markerSquares]);

  function getHighlight(square: Square): HighlightKind {
    if (checks.has(square)) return "check";
    if (selectedSquare === square) return "selected";
    if (markers.has(square)) return "marker";
    if (last.has(square)) return "last";
    if (legal.has(square)) return "legal";
    return null;
  }

  return (
    <>
      <color attach="background" args={["#08130D"]} />
      <fog attach="fog" args={["#08130D", 13, 25]} />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#F5E7C8", "#123D23", 0.55]} />
      <directionalLight
        castShadow
        intensity={2.15}
        position={[4.5, 9.5, 5.5]}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
        shadow-camera-far={24}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <pointLight color={GOLD} intensity={12} distance={14} position={[-4, 5, -4]} />

      <group rotation={[0, orientation === "black" ? Math.PI : 0, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[8.8, 0.38, 8.8]} />
          <meshStandardMaterial color="#24170F" metalness={0.32} roughness={0.44} />
        </mesh>
        <mesh receiveShadow position={[0, -0.05, 0]}>
          <boxGeometry args={[8.26, 0.08, 8.26]} />
          <meshStandardMaterial color={DARK_TRIM} metalness={0.16} roughness={0.62} />
        </mesh>

        {Array.from({ length: BOARD_SIZE }, (_, row) =>
          Array.from({ length: BOARD_SIZE }, (_, column) => {
            const square = squareFromGrid(row, column);
            return (
              <BoardSquare
                key={square}
                square={square}
                row={row}
                column={column}
                highlight={getHighlight(square)}
                disabled={disabled ?? false}
                onSquareClick={onSquareClick}
                onSquareRightClick={onSquareRightClick}
              />
            );
          })
        )}

        {pieces.map((piece) => {
          const moveSquares = lastMoveSquares ?? [];
          const animateFrom =
            moveSquares.length >= 2 && moveSquares[1] === piece.square
              ? (moveSquares[0] as Square)
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
      </group>

      <mesh receiveShadow position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color="#07100B" roughness={0.96} />
      </mesh>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={8.2}
        maxDistance={15}
        minPolarAngle={0.48}
        maxPolarAngle={1.32}
        target={[0, 0.45, 0]}
      />
    </>
  );
}

export default function ThreeChessBoard({
  fen,
  orientation,
  disabled = false,
  selectedSquare = null,
  legalSquares = [],
  lastMoveSquares = [],
  checkSquares = [],
  markerSquares = [],
  onSquareClick,
  onSquareRightClick
}: ThreeChessBoardProps) {
  const [cameraView, setCameraView] = useState<"player" | "top">("player");
  const [cameraReset, setCameraReset] = useState(0);
  const cameraPosition: [number, number, number] =
    cameraView === "top" ? [0, 12.5, 0.001] : [0, 8.4, 9.6];

  function selectCamera(view: "player" | "top") {
    setCameraView(view);
    setCameraReset((value) => value + 1);
  }

  return (
    <div
      className="relative h-full w-full touch-none overflow-hidden rounded-xl border border-base-300 bg-[#08130D] shadow-2xl"
      role="application"
      aria-label="Interactive 3D Kush Kings chess board. Drag to rotate the camera, scroll or pinch to zoom, and click a piece then a highlighted square to move."
    >
      <Canvas
        key={`${orientation}-${cameraView}-${cameraReset}`}
        shadows
        dpr={[1, 1.35]}
        camera={{ position: cameraPosition, fov: cameraView === "top" ? 38 : 42, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <BoardScene
          fen={fen}
          orientation={orientation}
          disabled={disabled}
          selectedSquare={selectedSquare}
          legalSquares={legalSquares}
          lastMoveSquares={lastMoveSquares}
          checkSquares={checkSquares}
          markerSquares={markerSquares}
          onSquareClick={onSquareClick}
          onSquareRightClick={onSquareRightClick}
        />
      </Canvas>
      <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-lg bg-black/55 p-1 backdrop-blur-sm">
        <button
          type="button"
          className={`btn btn-xs ${cameraView === "player" ? "btn-primary" : "btn-ghost text-white"}`}
          aria-label="Use player camera"
          aria-pressed={cameraView === "player"}
          onClick={() => selectCamera("player")}
        >
          Player
        </button>
        <button
          type="button"
          className={`btn btn-xs ${cameraView === "top" ? "btn-primary" : "btn-ghost text-white"}`}
          aria-label="Use overhead camera"
          aria-pressed={cameraView === "top"}
          onClick={() => selectCamera("top")}
        >
          Top
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-xs text-white"
          aria-label="Reset camera"
          onClick={() => setCameraReset((value) => value + 1)}
        >
          Reset
        </button>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 max-w-[75%] rounded bg-black/55 px-2 py-1 text-[10px] text-white/80">
        Drag to rotate · pinch/scroll to zoom · click to move
      </div>
    </div>
  );
}
