import assert from "node:assert/strict";

import { normalizeMoveInput } from "../dist/socket/moveInput.js";

assert.deepEqual(normalizeMoveInput({ from: "e2", to: "e4" }), { from: "e2", to: "e4" });
assert.deepEqual(normalizeMoveInput({ from: "a7", to: "a8", promotion: "q" }), {
    from: "a7",
    to: "a8",
    promotion: "q"
});
assert.deepEqual(normalizeMoveInput({ from: "h2", to: "h1", promotion: "n", extra: true }), {
    from: "h2",
    to: "h1",
    promotion: "n"
});

for (const bad of [
    null,
    undefined,
    [],
    "e2e4",
    { from: "e2" },
    { to: "e4" },
    { from: "E2", to: "e4" },
    { from: "e9", to: "e4" },
    { from: "i2", to: "e4" },
    { from: "e2", to: "e2" },
    { from: 12, to: "e4" },
    { from: "e2", to: 34 },
    { from: "a7", to: "a8", promotion: "k" },
    { from: "a7", to: "a8", promotion: "Q" },
    { from: "a7", to: "a8", promotion: true }
]) {
    assert.equal(normalizeMoveInput(bad), null);
}

for (const promotion of ["q", "r", "b", "n"]) {
    assert.equal(normalizeMoveInput({ from: "a7", to: "a8", promotion })?.promotion, promotion);
}

console.log("Kush Kings move input verification passed.");
