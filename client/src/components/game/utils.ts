import { KUSH_BOARD_THEME } from "@/kushTheme";
import type { Action, CustomSquares, Lobby } from "@/types";
import type { Game, User } from "@chessu/types";
import type { Dispatch, SetStateAction } from "react";

export const syncPgn = (
    latestPgn: string,
    lobby: Lobby,
    actions: {
        updateCustomSquares: Dispatch<Partial<CustomSquares>>;
        setNavFen: Dispatch<SetStateAction<string | null>>;
        setNavIndex: Dispatch<SetStateAction<number | null>>;
    }
) => {
    actions.setNavFen(null);
    actions.setNavIndex(null);
    lobby.actualGame.loadPgn(latestPgn as string);

    const lastMove = lobby.actualGame.history({ verbose: true }).pop();

    let lastMoveSquares = undefined;
    let kingSquare = undefined;
    if (lastMove) {
        lastMoveSquares = {
            [lastMove.from]: { background: KUSH_BOARD_THEME.moveHighlight },
            [lastMove.to]: { background: KUSH_BOARD_THEME.moveHighlight }
        };
    }
    if (lobby.actualGame.inCheck()) {
        const kingPos = lobby.actualGame.board().reduce((acc, row, index) => {
            const squareIndex = row.findIndex(
                (square) =>
                    square && square.type === "k" && square.color === lobby.actualGame.turn()
            );
            return squareIndex >= 0 ? `${String.fromCharCode(squareIndex + 97)}${8 - index}` : acc;
        }, "");
        kingSquare = {
            [kingPos]: {
                background: `radial-gradient(${KUSH_BOARD_THEME.checkWarning}, transparent 70%)`,
                borderRadius: "50%"
            }
        };
    }
    actions.updateCustomSquares({
        lastMove: lastMoveSquares,
        check: kingSquare
    });
};

export const syncSide = (
    user: User,
    game: Game | undefined,
    lobby: Lobby,
    actions: { updateLobby: Dispatch<Action> }
) => {
    if (!game) game = lobby;
    if (game.black?.id === user?.id) {
        if (lobby.side !== "b") actions.updateLobby({ type: "setSide", payload: "b" });
    } else if (game.white?.id === user?.id) {
        if (lobby.side !== "w") actions.updateLobby({ type: "setSide", payload: "w" });
    } else if (lobby.side !== "s") {
        actions.updateLobby({ type: "setSide", payload: "s" });
    }
};
