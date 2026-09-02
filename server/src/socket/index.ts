import type { Socket } from "socket.io";

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

    socket.on("joinLobby", joinLobby);
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
    });
    socket.on("claimAbandoned", claimAbandoned);
    socket.on("resignGame", resignGame);
    socket.on("offerDraw", offerDraw);
    socket.on("respondToDraw", respondToDraw);
};

export const init = () => {
    io.on("connection", socketConnect);
};
