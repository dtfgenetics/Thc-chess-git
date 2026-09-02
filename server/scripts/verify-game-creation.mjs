import assert from "node:assert/strict";

import {
    ROOM_CODE_MAX_ATTEMPTS,
    generateUniqueRoomCode,
    normalizeStartingSide,
    normalizeUnlisted
} from "../dist/controllers/gameCreation.js";

assert.equal(normalizeUnlisted(undefined), false);
assert.equal(normalizeUnlisted(false), false);
assert.equal(normalizeUnlisted(true), true);
assert.equal(normalizeUnlisted("false"), null);
assert.equal(normalizeUnlisted(0), null);

assert.equal(normalizeStartingSide(undefined), "random");
assert.equal(normalizeStartingSide(""), "random");
assert.equal(normalizeStartingSide("random"), "random");
assert.equal(normalizeStartingSide("white"), "white");
assert.equal(normalizeStartingSide("black"), "black");
assert.equal(normalizeStartingSide("light"), null);
assert.equal(normalizeStartingSide(false), null);

const codes = ["ABC123", "XYZ789", "NEW456"];
let index = 0;
assert.equal(
    generateUniqueRoomCode(new Set(["ABC123", "XYZ789"]), () => codes[index++]),
    "NEW456"
);

let attempts = 0;
assert.equal(
    generateUniqueRoomCode(
        new Set(["TAKEN1"]),
        () => {
            attempts += 1;
            return "TAKEN1";
        }
    ),
    null
);
assert.equal(attempts, ROOM_CODE_MAX_ATTEMPTS);

console.log("Kush Kings game creation verification passed.");
