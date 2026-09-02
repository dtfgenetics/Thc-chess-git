import type { Game, User } from "@chessu/types";

export type PlayerSide = "white" | "black";

export const ABANDON_GRACE_MS = 50_000;

export function resolveResignationWinner(
    game: Pick<Game, "white" | "black">,
    userId: User["id"]
): PlayerSide | null {
    if (!game.white || !game.black || userId === undefined) return null;
    if (game.white.id === userId) return "black";
    if (game.black.id === userId) return "white";
    return null;
}

export function canOfferDraw(
    game: Pick<Game, "white" | "black" | "drawOfferFrom">,
    userId: User["id"]
): boolean {
    if (!game.white || !game.black || userId === undefined || game.drawOfferFrom !== undefined) return false;
    return game.white.id === userId || game.black.id === userId;
}

export function canRespondToDraw(
    game: Pick<Game, "white" | "black" | "drawOfferFrom">,
    userId: User["id"]
): boolean {
    if (!game.white || !game.black || userId === undefined || game.drawOfferFrom === undefined) return false;
    if (game.drawOfferFrom === userId) return false;
    const userIsPlayer = game.white.id === userId || game.black.id === userId;
    const offererIsPlayer = game.white.id === game.drawOfferFrom || game.black.id === game.drawOfferFrom;
    return userIsPlayer && offererIsPlayer;
}

export function canClaimAbandoned(
    game: Pick<Game, "white" | "black">,
    userId: User["id"],
    now = Date.now(),
    graceMs = ABANDON_GRACE_MS
): boolean {
    if (!game.white || !game.black || userId === undefined) return false;

    const opponent =
        game.white.id === userId ? game.black : game.black.id === userId ? game.white : undefined;
    if (!opponent || opponent.connected !== false || typeof opponent.disconnectedOn !== "number") {
        return false;
    }

    return now - opponent.disconnectedOn >= graceMs;
}
