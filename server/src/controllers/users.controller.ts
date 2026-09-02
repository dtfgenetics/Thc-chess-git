import type { Request, Response } from "express";

import GameModel from "../db/models/game.model.js";
import UserModel from "../db/models/user.model.js";
import { normalizeGrowerName } from "./authInput.js";

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const name = normalizeGrowerName(req.params?.name);
        if (!name) {
            res.status(400).json({ message: "Invalid grower profile name." });
            return;
        }

        const user = await UserModel.findByName(name);
        if (!user || typeof user.id !== "number") {
            res.status(404).end();
            return;
        }

        const recentGames = await GameModel.findByUserId(user.id);
        if (!recentGames) {
            res.status(500).end();
            return;
        }

        const publicUser = {
            id: user.id,
            name: user.name,
            wins: user.wins,
            losses: user.losses,
            draws: user.draws
        };

        res.status(200).json({ ...publicUser, recentGames });
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};
