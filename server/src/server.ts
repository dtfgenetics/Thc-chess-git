import cors from "cors";
import "dotenv/config";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { INIT_TABLES, db } from "./db/index.js";
import session from "./middleware/session.js";
import routes from "./routes/index.js";
import { init as initSocket } from "./socket/index.js";

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsConfig = {
    origin: allowedOrigins,
    credentials: true
};

const maintenanceMode = process.env.GAME_MAINTENANCE_MODE === "true";
const multiplayerEnabled = process.env.GAME_MULTIPLAYER_ENABLED !== "false";
const operationalMetrics = {
    socketConnections: 0,
    socketDisconnects: 0,
    socketRejected: 0
};

const app = express();
const server = createServer(app);

// database
await db.connect();
db.query(INIT_TABLES, (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Tables initialized");
    }
});

// middleware
app.use(cors(corsConfig));
app.use(express.json());
app.set("trust proxy", 1);
app.use(session);
app.use("/v1", routes);

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: maintenanceMode ? "maintenance" : "ok",
        app: process.env.APP_NAME || "Kush Kings Chess",
        maintenance: maintenanceMode,
        multiplayerEnabled,
        uptimeSeconds: Math.round(process.uptime()),
        operationalMetrics: {
            ...operationalMetrics,
            connectedSockets: io?.engine?.clientsCount ?? 0
        }
    });
});

// socket.io
export const io = new Server(server, { cors: corsConfig, pingInterval: 30000, pingTimeout: 50000 });
io.use((_socket, next) => {
    if (maintenanceMode) {
        operationalMetrics.socketRejected += 1;
        return next(new Error("Kush Kings is temporarily under maintenance."));
    }
    if (!multiplayerEnabled) {
        operationalMetrics.socketRejected += 1;
        return next(new Error("Kush Kings multiplayer is temporarily disabled."));
    }
    next();
});
io.use((socket, next) => {
    session(socket.request as Request, {} as Response, next as NextFunction);
});
io.use((socket, next) => {
    const session = socket.request.session;
    if (session && session.user) {
        next();
    } else {
        console.log("io.use: no session");
        socket.disconnect();
    }
});
io.on("connection", (socket) => {
    operationalMetrics.socketConnections += 1;
    socket.on("disconnect", () => {
        operationalMetrics.socketDisconnects += 1;
    });
});
initSocket();

const port = process.env.PORT || 3001;
server.listen(port, () => {
    console.log(`${process.env.APP_NAME || "Kush Kings Chess"} api server listening on :${port}`);
});
