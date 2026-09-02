import assert from "node:assert/strict";

import { ROOM_CODE_LENGTH, normalizeRoomCode } from "../dist/roomCode.js";

assert.equal(ROOM_CODE_LENGTH, 6);
assert.equal(normalizeRoomCode("ABC123"), "ABC123");
assert.equal(normalizeRoomCode("a_b-9Z"), "a_b-9Z");
assert.equal(normalizeRoomCode("  ABC123  "), "ABC123");
assert.equal(normalizeRoomCode("ABC12"), null);
assert.equal(normalizeRoomCode("ABC1234"), null);
assert.equal(normalizeRoomCode("ABC/12"), null);
assert.equal(normalizeRoomCode("ABC 12"), null);
assert.equal(normalizeRoomCode("https://example.com/ABC123"), null);
assert.equal(normalizeRoomCode(undefined), null);
assert.equal(normalizeRoomCode(["ABC123"]), null);

console.log("Kush Kings room code verification passed.");
