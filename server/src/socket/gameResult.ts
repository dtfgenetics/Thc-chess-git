import type { Game, User } from "@chessu/types";

export type PlayerSide = "white" | "black";

export function resolveResignationWinner(
    game: Pick<Game, "white" | "black">,
    userId: User["id"]
): PlayerSide | null {
    if (!game.white || !game.black || userId === undefined) return null;
    if (game.white.id === userId) return "black";
    if (game.black.id === userId) return "white";
    return null;
}
