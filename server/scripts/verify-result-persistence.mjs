import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    restoreRecoverableGameState,
    snapshotRecoverableGameState
} from "../dist/socket/gamePersistence.js";
import {
    normalizeAbandonClaim,
    normalizeDrawResponse
} from "../dist/socket/resultInput.js";

assert.equal(normalizeDrawResponse(true), true);
assert.equal(normalizeDrawResponse(false), false);
assert.equal(normalizeDrawResponse("false"), null);
assert.equal(normalizeDrawResponse(1), null);
assert.equal(normalizeDrawResponse(undefined), null);

assert.equal(normalizeAbandonClaim("win"), "win");
assert.equal(normalizeAbandonClaim("draw"), "draw");
assert.equal(normalizeAbandonClaim("loss"), null);
assert.equal(normalizeAbandonClaim(true), null);
assert.equal(normalizeAbandonClaim(undefined), null);

const game = {
    pgn: "1. e4 e5",
    drawOfferFrom: 42
};
const snapshot = snapshotRecoverableGameState(game);
game.pgn = "1. e4 e5 2. Nf3";
game.winner = "white";
game.endReason = "checkmate";
game.drawOfferFrom = undefined;
game.id = 99;
restoreRecoverableGameState(game, snapshot);
assert.deepEqual(game, {
    pgn: "1. e4 e5",
    winner: undefined,
    endReason: undefined,
    drawOfferFrom: 42,
    id: undefined
});

const modelSource = await readFile(new URL("../src/db/models/game.model.ts", import.meta.url), "utf8");
const saveSource = modelSource.split("export const findById")[0];
assert.match(saveSource, /client = await db\.connect\(\)/);
assert.match(saveSource, /client\.query\("BEGIN"\)/);
assert.match(saveSource, /client\.query\("COMMIT"\)/);
assert.match(saveSource, /client\.query\("ROLLBACK"\)/);
assert.equal(saveSource.includes("await db.query("), false);
assert.ok(saveSource.indexOf("mapGameRow(res.rows[0])") < saveSource.indexOf('client.query("COMMIT")'));

const socketSource = await readFile(new URL("../src/socket/game.socket.ts", import.meta.url), "utf8");
assert.match(socketSource, /restoreRecoverableGameState\(game, previousState\)/);
assert.match(socketSource, /failed to persist terminal game/);
assert.match(socketSource, /io\.to\(game\.code as string\)\.emit\("receivedLatestGame", game\)/);

console.log("Kush Kings result input and persistence verification passed.");
