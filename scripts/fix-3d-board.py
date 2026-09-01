from pathlib import Path

path = Path("client/src/components/game/ThreeChessBoard.tsx")
text = path.read_text(encoding="utf-8")

if '/* eslint-disable no-unused-vars */\n' not in text:
    text = text.replace('"use client";\n', '"use client";\n/* eslint-disable no-unused-vars */\n', 1)

wrong = 'const square = squareFromGrid(7 - row, column);'
right = 'const square = squareFromGrid(row, column);'
if wrong in text:
    text = text.replace(wrong, right, 1)
elif right not in text:
    raise SystemExit("3D board square mapping anchor not found")

path.write_text(text, encoding="utf-8")
print("3D board picking and lint compatibility fixed")
