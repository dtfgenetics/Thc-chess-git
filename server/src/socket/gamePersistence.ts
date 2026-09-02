import type { Game } from "@chessu/types";

export type RecoverableGameState = Pick<
    Game,
    "pgn" | "winner" | "endReason" | "drawOfferFrom" | "id"
>;

export function snapshotRecoverableGameState(game: Game): RecoverableGameState {
    return {
        pgn: game.pgn,
        winner: game.winner,
        endReason: game.endReason,
        drawOfferFrom: game.drawOfferFrom,
        id: game.id
    };
}

export function restoreRecoverableGameState(game: Game, snapshot: RecoverableGameState) {
    game.pgn = snapshot.pgn;
    game.winner = snapshot.winner;
    game.endReason = snapshot.endReason;
    game.drawOfferFrom = snapshot.drawOfferFrom;
    game.id = snapshot.id;
}
