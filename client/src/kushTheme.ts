export const KUSH_BOARD_THEME = {
  lightSquare: "#F5E7C8",
  darkSquare: "#123D23",
  moveHighlight: "rgba(212, 160, 23, 0.45)",
  legalMove: "rgba(76, 175, 80, 0.35)",
  checkWarning: "rgba(180, 58, 46, 0.55)",
  rightClickMarker: "rgba(46, 125, 50, 0.45)"
} as const;

export const KUSH_COPY = {
  waitingForOpponent: "Waiting for another grower.",
  joinLightSide: "Join as light side",
  joinDarkSide: "Join as dark side"
} as const;

export const KUSH_PIECE_ASSETS = {
  wK: "/kush-pieces/light-king.svg",
  wQ: "/kush-pieces/light-queen.svg",
  wB: "/kush-pieces/light-bishop.svg",
  wN: "/kush-pieces/light-knight.svg",
  wR: "/kush-pieces/light-rook.svg",
  wP: "/kush-pieces/light-pawn.svg",
  bK: "/kush-pieces/dark-king.svg",
  bQ: "/kush-pieces/dark-queen.svg",
  bB: "/kush-pieces/dark-bishop.svg",
  bN: "/kush-pieces/dark-knight.svg",
  bR: "/kush-pieces/dark-rook.svg",
  bP: "/kush-pieces/dark-pawn.svg"
} as const;
