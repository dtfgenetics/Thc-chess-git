import type { Action, CustomSquares, Lobby, Message } from "@/types";
import type { Game, User } from "@chessu/types";
import type { Dispatch, SetStateAction } from "react";
import type { Socket } from "socket.io-client";

import { syncPgn, syncSide } from "./utils";

export type SocketConnectionState = "connecting" | "connected" | "disconnected";

function displaySide(side?: "white" | "black" | "draw") {
    if (side === "white") return "light side";
    if (side === "black") return "dark side";
    return "even harvest";
}

export function initSocket(
    user: User,
    socket: Socket,
    lobby: Lobby,
    actions: {
        updateLobby: Dispatch<Action>;
        addMessage: Function;
        updateCustomSquares: Dispatch<Partial<CustomSquares>>;
        makeMove: Function;
        setNavFen: Dispatch<SetStateAction<string | null>>;
        setNavIndex: Dispatch<SetStateAction<number | null>>;
        setConnectionState: Dispatch<SetStateAction<SocketConnectionState>>;
        setPlayBtnLoading: Dispatch<SetStateAction<boolean>>;
    }
) {
    socket.on("connect", () => {
        actions.setConnectionState("connected");
        socket.emit("joinLobby", lobby.code);
    });

    socket.on("disconnect", () => {
        actions.setConnectionState("disconnected");
        actions.setPlayBtnLoading(false);
    });

    socket.on("connect_error", () => {
        actions.setConnectionState("disconnected");
        actions.setPlayBtnLoading(false);
    });

    socket.on("chat", (message: Message) => {
        actions.addMessage(message);
    });

    socket.on("receivedLatestGame", (latestGame: Game) => {
        actions.setPlayBtnLoading(false);
        if (latestGame.pgn && latestGame.pgn !== lobby.actualGame.pgn()) {
            syncPgn(latestGame.pgn, lobby, actions);
        }
        actions.updateLobby({ type: "updateLobby", payload: latestGame });

        syncSide(user, latestGame, lobby, actions);
    });

    socket.on("receivedMove", (m: { from: string; to: string; promotion?: string }) => {
        const success = actions.makeMove(m);
        if (!success) {
            socket.emit("getLatestGame");
        }
    });

    socket.on("drawOffered", ({ from, name }: { from: User["id"]; name?: string | null }) => {
        actions.updateLobby({ type: "updateLobby", payload: { drawOfferFrom: from } });
        actions.addMessage({
            author: { name: "Grow Room" },
            message: `${name || "A grower"} offered an even harvest.`
        });
    });

    socket.on("drawOfferCleared", ({ message }: { message?: string }) => {
        actions.updateLobby({ type: "updateLobby", payload: { drawOfferFrom: undefined } });
        if (message) {
            actions.addMessage({ author: { name: "Grow Room" }, message });
        }
    });

    socket.on("userJoinedAsPlayer", ({ name, side }: { name: string; side: "white" | "black" }) => {
        actions.addMessage({
            author: { name: "Grow Room" },
            message: `${name} joined the match on the ${displaySide(side)}.`
        });
    });

    socket.on(
        "gameOver",
        ({
            reason,
            winnerName,
            winnerSide,
            id
        }: {
            reason: Game["endReason"];
            winnerName?: string;
            winnerSide?: "white" | "black" | "draw";
            id: number;
        }) => {
            const m = {
                author: { name: "Grow Room" }
            } as Message;

            if (reason === "abandoned") {
                if (!winnerSide) {
                    m.message = `${winnerName} claimed an even harvest due to abandonment.`;
                } else {
                    m.message = `${winnerName} (${displaySide(winnerSide)}) claimed the win due to abandonment.`;
                }
            } else if (reason === "resigned") {
                m.message = `Harvest complete: ${winnerName} (${displaySide(winnerSide)}) won after the other grower resigned.`;
            } else if (reason === "checkmate") {
                m.message = `Harvest complete: ${winnerName} (${displaySide(winnerSide)}) won by checkmate.`;
            } else {
                let message = "The match ended in an even harvest";
                if (reason === "repetition") {
                    message = message.concat(" due to threefold repetition");
                } else if (reason === "insufficient") {
                    message = message.concat(" due to insufficient material");
                } else if (reason === "stalemate") {
                    message = "The match ended in an even harvest due to stalemate";
                }
                m.message = message.concat(".");
            }
            actions.updateLobby({
                type: "updateLobby",
                payload: { endReason: reason, winner: winnerSide || "draw", id }
            });
            actions.addMessage(m);
        }
    );
}
