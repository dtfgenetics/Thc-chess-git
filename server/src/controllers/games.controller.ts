import type { Game, User } from "@chessu/types";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";

import GameModel, { activeGames } from "../db/models/game.model.js";
import {
    generateUniqueRoomCode,
    normalizeStartingSide,
    normalizeUnlisted
} from "./gameCreation.js";
import { normalizeGameLookupQuery } from "./queryInput.js";

export const getGames = async (req: Request, res: Response) => {
    try {
        const hasId = req.query.id !== undefined;
        const hasUserId = req.query.userid !== undefined;

        if (!hasId && !hasUserId) {
            // get all active games
            res.status(200).json(activeGames.filter((g) => !g.unlisted && !g.winner));
            return;
        }

        const lookup = normalizeGameLookupQuery(req.query.id, req.query.userid);
        if (!lookup) {
            res.status(400).json({ message: "Provide exactly one valid positive integer: id or userid." });
            return;
        }

        if (lookup.id !== undefined) {
            // get finished game by id
            const game = await GameModel.findById(lookup.id);
            if (!game) {
                res.status(404).end();
            } else {
                res.status(200).json(game);
            }
            return;
        }

        // get finished games by user id
        const games = await GameModel.findByUserId(lookup.userId as number);
        if (!games) {
            res.status(404).end();
        } else {
            res.status(200).json(games);
        }
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};

export const getActiveGame = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.code) {
            res.status(400).end();
            return;
        }

        const game = activeGames.find((g) => g.code === req.params.code);

        if (!game) {
            res.status(404).end();
        } else {
            res.status(200).json(game);
        }
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};

export const createGame = async (req: Request, res: Response) => {
    try {
        if (!req.session.user?.id) {
            console.log("unauthorized createGame");
            res.status(401).end();
            return;
        }

        const unlisted = normalizeUnlisted(req.body?.unlisted);
        const startingSide = normalizeStartingSide(req.body?.side);
        if (unlisted === null || startingSide === null) {
            res.status(400).json({ message: "Invalid match creation options." });
            return;
        }

        const code = generateUniqueRoomCode(
            activeGames.flatMap((game) => (game.code ? [game.code] : [])),
            () => nanoid(6)
        );
        if (!code) {
            console.error("createGame: failed to allocate a unique room code.");
            res.status(503).json({ message: "Unable to create a unique match room. Try again." });
            return;
        }

        const user: User = {
            id: req.session.user.id,
            name: req.session.user.name,
            connected: false
        };
        const game: Game = {
            code,
            unlisted,
            host: user,
            pgn: ""
        };

        if (startingSide === "white") {
            game.white = user;
        } else if (startingSide === "black") {
            game.black = user;
        } else if (Math.floor(Math.random() * 2) === 0) {
            game.white = user;
        } else {
            game.black = user;
        }
        activeGames.push(game);

        res.status(201).json({ code: game.code });
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};
