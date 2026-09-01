from pathlib import Path

path = Path("client/src/components/game/GamePage.tsx")
text = path.read_text(encoding="utf-8")

if 'import PromotionPicker from "./PromotionPicker";\n' not in text:
    text = text.replace(
        'import ThreeChessBoard from "./ThreeChessBoard";\n',
        'import PromotionPicker from "./PromotionPicker";\nimport ThreeChessBoard from "./ThreeChessBoard";\n',
        1,
    )

if 'type PromotionPiece = "q" | "r" | "b" | "n";\n' not in text:
    text = text.replace(
        'const socket = io(API_URL, { withCredentials: true, autoConnect: false });\n',
        'const socket = io(API_URL, { withCredentials: true, autoConnect: false });\n\ntype PromotionPiece = "q" | "r" | "b" | "n";\n',
        1,
    )

if 'const [pendingPromotion, setPendingPromotion]' not in text:
    text = text.replace(
        '  const [boardMode, setBoardMode] = useState<"3d" | "2d">("3d");\n',
        '  const [boardMode, setBoardMode] = useState<"3d" | "2d">("3d");\n  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);\n',
        1,
    )

old_drop = '''  function onDrop(sourceSquare: Square, targetSquare: Square) {
    if (lobby.side === "s" || navFen || lobby.endReason || lobby.winner) return false;

    // premove
    if (lobby.side !== lobby.actualGame.turn()) return true;

    const moveDetails = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q"
    };

    const move = makeMove(moveDetails);
    if (!move) return false; // illegal move
    socket.emit("sendMove", moveDetails);
    return true;
  }
'''

new_drop = '''  function needsPromotion(from: Square, to: Square) {
    const piece = lobby.actualGame.get(from);
    if (!piece || piece.type !== "p") return false;
    const moves = lobby.actualGame.moves({ square: from, verbose: true }) as Move[];
    return moves.some((move) => move.to === to && Boolean(move.promotion));
  }

  function sendMove(from: Square, to: Square, promotion?: PromotionPiece) {
    const moveDetails = { from, to, ...(promotion ? { promotion } : {}) };
    const move = makeMove(moveDetails);
    if (!move) return false;
    setMoveFrom(null);
    socket.emit("sendMove", moveDetails);
    return true;
  }

  function attemptMove(from: Square, to: Square) {
    if (needsPromotion(from, to)) {
      setPendingPromotion({ from, to });
      updateCustomSquares({ options: {} });
      return "promotion" as const;
    }
    return sendMove(from, to);
  }

  function choosePromotion(piece: PromotionPiece) {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    setPendingPromotion(null);
    sendMove(from, to, piece);
  }

  function cancelPromotion() {
    setPendingPromotion(null);
    setMoveFrom(null);
    updateCustomSquares({ options: {} });
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    if (lobby.side === "s" || navFen || lobby.endReason || lobby.winner) return false;

    // premove
    if (lobby.side !== lobby.actualGame.turn()) return true;

    const result = attemptMove(sourceSquare, targetSquare);
    if (result === "promotion") return false;
    return result;
  }
'''

if old_drop in text:
    text = text.replace(old_drop, new_drop, 1)

old_click = '''    const moveDetails = {
      from: moveFrom,
      to: square,
      promotion: "q"
    };

    const move = makeMove(moveDetails);
    if (!move) {
      resetFirstMove(square);
    } else {
      setMoveFrom(null);
      socket.emit("sendMove", moveDetails);
    }
'''
new_click = '''    const result = attemptMove(moveFrom as Square, square);
    if (result === false) {
      resetFirstMove(square);
    }
'''
if old_click in text:
    text = text.replace(old_click, new_click, 1)

if '<PromotionPicker' not in text:
    text = text.replace(
        '  return (\n    <div className="flex w-full flex-wrap justify-center gap-6 px-4 py-4 lg:gap-10 2xl:gap-16">\n',
        '  return (\n    <>\n      {pendingPromotion && (\n        <PromotionPicker color={lobby.actualGame.turn()} onChoose={choosePromotion} onCancel={cancelPromotion} />\n      )}\n      <div className="flex w-full flex-wrap justify-center gap-6 px-4 py-4 lg:gap-10 2xl:gap-16">\n',
        1,
    )
    suffix = '    </div>\n  );\n}\n'
    if not text.endswith(suffix):
        raise SystemExit("GamePage closing anchor not found")
    text = text[:-len(suffix)] + '      </div>\n    </>\n  );\n}\n'

path.write_text(text, encoding="utf-8")
print("promotion picker wiring applied")
