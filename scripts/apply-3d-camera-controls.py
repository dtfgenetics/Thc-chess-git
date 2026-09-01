from pathlib import Path

path = Path("client/src/components/game/ThreeChessBoard.tsx")
text = path.read_text(encoding="utf-8")

anchor = '''}: ThreeChessBoardProps) {
  return (
'''
replacement = '''}: ThreeChessBoardProps) {
  const [cameraView, setCameraView] = useState<"player" | "top">("player");
  const [cameraReset, setCameraReset] = useState(0);
  const cameraPosition: [number, number, number] =
    cameraView === "top" ? [0, 12.5, 0.001] : [0, 8.4, 9.6];

  function selectCamera(view: "player" | "top") {
    setCameraView(view);
    setCameraReset((value) => value + 1);
  }

  return (
'''
if 'const [cameraView, setCameraView]' not in text:
    if anchor not in text:
        raise SystemExit("ThreeChessBoard anchor not found")
    text = text.replace(anchor, replacement, 1)

old_canvas = '''      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 8.4, 9.6], fov: 42, near: 0.1, far: 50 }}
'''
new_canvas = '''      <Canvas
        key={`${orientation}-${cameraView}-${cameraReset}`}
        shadows
        dpr={[1, 1.35]}
        camera={{ position: cameraPosition, fov: cameraView === "top" ? 38 : 42, near: 0.1, far: 50 }}
'''
if old_canvas in text:
    text = text.replace(old_canvas, new_canvas, 1)

old_hint = '''      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/55 px-2 py-1 text-[10px] text-white/80">
        Drag to rotate · pinch/scroll to zoom · click to move
      </div>
'''
new_controls = '''      <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-lg bg-black/55 p-1 backdrop-blur-sm">
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
'''
if 'aria-label="Use player camera"' not in text:
    if old_hint not in text:
        raise SystemExit("camera hint anchor not found")
    text = text.replace(old_hint, new_controls, 1)

path.write_text(text, encoding="utf-8")
print("3D camera controls applied")
