"use client";
/* eslint-disable no-unused-vars */

import { KUSH_PIECE_ASSETS } from "@/kushTheme";
import type { Color, PieceSymbol } from "chess.js";

type PromotionPiece = Extract<PieceSymbol, "q" | "r" | "b" | "n">;

type PromotionPickerProps = {
  color: Color;
  onChoose: (piece: PromotionPiece) => void;
  onCancel: () => void;
};

const OPTIONS: Array<{
  piece: PromotionPiece;
  title: string;
  chessName: string;
}> = [
  { piece: "q", title: "Mother Plant", chessName: "Queen" },
  { piece: "r", title: "Grow Tower", chessName: "Rook" },
  { piece: "b", title: "Breeder", chessName: "Bishop" },
  { piece: "n", title: "Rolling Knight", chessName: "Knight" }
];

export default function PromotionPicker({ color, onChoose, onCancel }: PromotionPickerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-primary/30 bg-base-200 p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <h2 id="promotion-title" className="text-xl font-bold">
            Upgrade your Seedling
          </h2>
          <p className="mt-1 text-sm opacity-75">Choose the piece for this promotion.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map(({ piece, title, chessName }) => {
            const assetKey = `${color}${piece.toUpperCase()}` as keyof typeof KUSH_PIECE_ASSETS;
            return (
              <button
                key={piece}
                type="button"
                className="btn h-auto min-h-24 flex-col gap-1 border border-base-300 bg-base-100 py-3 hover:border-primary"
                onClick={() => onChoose(piece)}
              >
                <span
                  aria-hidden="true"
                  className="h-12 w-12 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${KUSH_PIECE_ASSETS[assetKey]})` }}
                />
                <span className="font-semibold">{title}</span>
                <span className="text-xs font-normal opacity-65">{chessName}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="btn btn-ghost mt-4 w-full" onClick={onCancel}>
          Cancel promotion
        </button>
      </div>
    </div>
  );
}
