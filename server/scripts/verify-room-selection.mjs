import assert from "node:assert/strict";

import { resolveRoomCode } from "../dist/socket/roomSelection.js";

assert.equal(resolveRoomCode(new Set(["socket-id", "GAME42"])), "GAME42");
assert.equal(resolveRoomCode(new Set(["socket-id", "GAME42"]), "GAME42"), "GAME42");
assert.equal(resolveRoomCode(new Set(["socket-id", "GAME42"]), "OTHER99"), undefined);
assert.equal(resolveRoomCode(new Set(["socket-id"])), undefined);
assert.equal(resolveRoomCode(new Set(["socket-id", "GAME42", "EXTRA"])), undefined);

console.log("Kush Kings room selection verification passed.");
