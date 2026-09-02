import assert from "node:assert/strict";

import {
    normalizeGameLookupQuery,
    parsePositiveInteger
} from "../dist/controllers/queryInput.js";

assert.equal(parsePositiveInteger("1"), 1);
assert.equal(parsePositiveInteger("42"), 42);
assert.equal(parsePositiveInteger("12junk"), null);
assert.equal(parsePositiveInteger("01"), null);
assert.equal(parsePositiveInteger("0"), null);
assert.equal(parsePositiveInteger("-1"), null);
assert.equal(parsePositiveInteger("1.5"), null);
assert.equal(parsePositiveInteger(" 12 "), null);
assert.equal(parsePositiveInteger(Number.MAX_SAFE_INTEGER.toString()), Number.MAX_SAFE_INTEGER);
assert.equal(parsePositiveInteger((Number.MAX_SAFE_INTEGER + 1).toString()), null);
assert.equal(parsePositiveInteger(["12"]), null);

assert.deepEqual(normalizeGameLookupQuery("12", undefined), { id: 12 });
assert.deepEqual(normalizeGameLookupQuery(undefined, "34"), { userId: 34 });
assert.equal(normalizeGameLookupQuery("12", "34"), null);
assert.equal(normalizeGameLookupQuery(undefined, undefined), null);
assert.equal(normalizeGameLookupQuery("12junk", undefined), null);
assert.equal(normalizeGameLookupQuery(undefined, "0"), null);

console.log("Kush Kings archive query input verification passed.");
