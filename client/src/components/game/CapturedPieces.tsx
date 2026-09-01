"use client";

import { KUSH_PIECE_ASSETS } from "@/kushTheme";
import type { Color, Move, PieceSymbol } from "chess.js";

type CapturedPiecesProps = {
  history: Move[];
};

type Capture = {
  piece: PieceSymbol;
  capturedBy: Color;
};

const PIECE_LABELS: Record<PieceSymbol, string> = {
  p: "Seedling",
  n: "Rolling Knight",
  b: "Breeder",
  r: "Grow Tower",
  q: "Mother Plant",
  k: "Master Grower"
};

function assetKeyForCapture(capture: Capture) {
  const capturedColor = capture.capturedBy === "w" ? "b" : "w";
  return `${capturedColor}${capture.piece.toUpperCase()}` as keyof typeof KUSH_PIECE_ASSETS;
}

function CaptureRow({ color, captures }: { color: Color; captures: Capture[] }) {
  const sideLabel = color === "w" ? "Light harvest" : "Dark harvest";
  const sideCaptures = captures.filter((capture) => capture.capturedBy === color);

  return (
    <div className="flex min-h-7 items-center gap-2 rounded-md bg-base-200/70 px-2 py-1">
      <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide opacity-70">
        {sideLabel}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5" aria-label={`${sideLabel} captured pieces`}>
        {sideCaptures.length === 0 ? (
          <span className="text-xs opacity-45">none yet</span>
        ) : (
          sideCaptures.map((capture, index) => {
            const assetKey = assetKeyForCapture(capture);
            return (
              <span
                key={`${capture.capturedBy}-${capture.piece}-${index}`}
                role="img"
                aria-label={`Captured ${PIECE_LABELS[capture.piece]}`}
                title={`Captured ${PIECE_LABELS[capture.piece]}`}
                className="h-6 w-6 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${KUSH_PIECE_ASSETS[assetKey]})` }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default function CapturedPieces({ history }: CapturedPiecesProps) {
  const captures: Capture[] = history.flatMap((move) =>
    move.captured ? [{ piece: move.captured, capturedBy: move.color }] : []
  );

  return (
    <div className="mt-2 grid gap-1" aria-label="Captured pieces">
      <CaptureRow color="w" captures={captures} />
      <CaptureRow color="b" captures={captures} />
    </div>
  );
}
