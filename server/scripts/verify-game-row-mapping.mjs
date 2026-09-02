import assert from "node:assert/strict";

import { mapGameRow } from "../dist/db/models/gameRow.js";

const startedAt = new Date("2026-09-01T18:00:00.000Z");
const endedAt = new Date("2026-09-01T18:42:00.000Z");

const mapped = mapGameRow({
    id: 42,
    winner: "white",
    end_reason: "checkmate",
    pgn: "1. e4 e5 2. Qh5",
    white_id: 7,
    white_name: "Grower A",
    black_id: 8,
    black_name: "Grower B",
    started_at: startedAt,
    ended_at: endedAt
});

assert.equal(mapped.id, 42);
assert.equal(mapped.winner, "white");
assert.equal(mapped.endReason, "checkmate");
assert.equal(mapped.pgn, "1. e4 e5 2. Qh5");
assert.deepEqual(mapped.white, { id: 7, name: "Grower A" });
assert.deepEqual(mapped.black, { id: 8, name: "Grower B" });
assert.equal(mapped.startedAt, startedAt.getTime());
assert.equal(mapped.endedAt, endedAt.getTime());

const guestMapped = mapGameRow({
    id: 43,
    winner: "draw",
    end_reason: "stalemate",
    white_name: "Guest White",
    black_name: "Guest Black",
    started_at: "2026-09-01T19:00:00.000Z"
});

assert.equal(guestMapped.endReason, "stalemate");
assert.deepEqual(guestMapped.white, { id: undefined, name: "Guest White" });
assert.deepEqual(guestMapped.black, { id: undefined, name: "Guest Black" });
assert.equal(guestMapped.startedAt, Date.parse("2026-09-01T19:00:00.000Z"));
assert.equal(guestMapped.endedAt, undefined);

console.log("Kush Kings game row mapping verification passed.");
