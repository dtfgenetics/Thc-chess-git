import assert from "node:assert/strict";

import { ABANDON_GRACE_MS, canClaimAbandoned } from "../dist/socket/gameResult.js";

const now = 1_000_000;
const whiteId = "white-player";
const blackId = "black-player";

function game(overrides = {}) {
    return {
        white: { id: whiteId, connected: true },
        black: { id: blackId, connected: false, disconnectedOn: now - ABANDON_GRACE_MS },
        ...overrides
    };
}

assert.equal(canClaimAbandoned(game(), whiteId, now), true);
assert.equal(canClaimAbandoned(game(), blackId, now), false);
assert.equal(canClaimAbandoned(game(), "spectator", now), false);

assert.equal(
    canClaimAbandoned(
        game({ black: { id: blackId, connected: true, disconnectedOn: now - ABANDON_GRACE_MS } }),
        whiteId,
        now
    ),
    false
);

assert.equal(
    canClaimAbandoned(game({ black: { id: blackId, connected: false } }), whiteId, now),
    false
);

assert.equal(
    canClaimAbandoned(
        game({
            black: {
                id: blackId,
                connected: false,
                disconnectedOn: now - ABANDON_GRACE_MS + 1
            }
        }),
        whiteId,
        now
    ),
    false
);

assert.equal(
    canClaimAbandoned(
        game({
            black: {
                id: blackId,
                connected: false,
                disconnectedOn: now - ABANDON_GRACE_MS
            }
        }),
        whiteId,
        now
    ),
    true
);

assert.equal(
    canClaimAbandoned(
        game({
            black: {
                id: blackId,
                connected: false,
                disconnectedOn: now + 1_000
            }
        }),
        whiteId,
        now
    ),
    false
);

console.log("Kush Kings abandonment claim verification passed.");
