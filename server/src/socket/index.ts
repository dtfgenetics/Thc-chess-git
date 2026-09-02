import type { Socket } from "socket.io";

import { normalizeRoomCode } from "../roomCode.js";
import { io } from "../server.js";
import { createChatRateLimiter, normalizeChatMessage } from "./chatGuard.js";
import {
    chat,
    claimAbandoned,
    getLatestGame,
    joinAsPlayer,
    joinLobby,
    leaveLobby,
    offerDraw,
    resignGame,
    respondToDraw,
    sendMove
} from "./game.socket.js";
import { normalizeAbandonClaim, normalizeDrawResponse } from "./resultInput.js";

const socketConnect = (socket: Socket) => {
    const req = socket.request;
    const canSendChat = createChatRateLimiter();

    socket.use((__, next) => {
        req.session.reload((err) => {
            if (err) {
                socket.disconnect();
            } else {
                next();
            }
        });
    });

    socket.on("disconnect", leaveLobby);

    socket.on("joinLobby", (code: unknown) => {
        const normalized = normalizeRoomCode(code);
        if (!normalized) return;
        void joinLobby.call(socket, normalized);
    });
    socket.on("leaveLobby", (code?: string) => {
        void leaveLobby.call(socket, undefined, code);
    });

    socket.on("getLatestGame", getLatestGame);
    socket.on("sendMove", sendMove);
    socket.on("joinAsPlayer", joinAsPlayer);
    socket.on("chat", (message: unknown) => {
        const normalized = normalizeChatMessage(message);
        if (!normalized) return;

        if (!canSendChat()) {
            socket.emit("chatRejected", { reason: "rate_limited" });
            return;
        }

        void chat.call(socket, normalized);
        socket.emit("chat", {
            author: req.session.user,
            message: normalized
        });
    });
    socket.on("claimAbandoned", (type: unknown) => {
        const normalized = normalizeAbandonClaim(type);
        if (!normalized) return;
        void claimAbandoned.call(socket, normalized);
    });
    socket.on("resignGame", resignGame);
    socket.on("offerDraw", offerDraw);
    socket.on("respondToDraw", (accept: unknown) => {
        const normalized = normalizeDrawResponse(accept);
        if (normalized === null) return;
        void respondToDraw.call(socket, normalized);
    });
};

export const init = () => {
    io.on("connection", socketConnect);
};
