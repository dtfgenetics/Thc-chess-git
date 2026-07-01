import type { User } from "@chessu/types";
import PGSimple from "connect-pg-simple";
import type { Session } from "express-session";
import session from "express-session";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";

const PGSession = PGSimple(session);

declare module "express-session" {
    // eslint-disable-next-line no-unused-vars
    interface SessionData {
        user: User;
    }
}
declare module "http" {
    // eslint-disable-next-line no-unused-vars
    interface IncomingMessage {
        session: Session & {
            user: User;
        };
    }
}

const isProduction = process.env.NODE_ENV === "production";

const sessionMiddleware = session({
    store: new PGSession({ pool: db, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "make sure to change this!",
    resave: false,
    saveUninitialized: false,
    name: process.env.SESSION_COOKIE_NAME || "kush_kings_chess",
    proxy: true,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        domain: process.env.SESSION_COOKIE_DOMAIN || undefined
    },
    genid: function () {
        return nanoid(21);
    }
});

export default sessionMiddleware;
