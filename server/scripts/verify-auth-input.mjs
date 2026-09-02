import assert from "node:assert/strict";

import {
    EMAIL_MAX_LENGTH,
    GROWER_NAME_MAX_LENGTH,
    PASSWORD_MAX_LENGTH,
    normalizeGrowerName,
    normalizeLoginIdentifier,
    normalizeOptionalEmail,
    normalizePassword
} from "../dist/controllers/authInput.js";

assert.equal(normalizeGrowerName(" Grower7 "), "Grower7");
assert.equal(normalizeGrowerName("A"), null);
assert.equal(normalizeGrowerName("x".repeat(GROWER_NAME_MAX_LENGTH + 1)), null);
assert.equal(normalizeGrowerName("grower-name"), null);
assert.equal(normalizeGrowerName(undefined), null);

assert.equal(normalizeOptionalEmail(undefined), undefined);
assert.equal(normalizeOptionalEmail(""), undefined);
assert.equal(normalizeOptionalEmail(" grower@example.com "), "grower@example.com");
assert.equal(normalizeOptionalEmail("not-an-email"), null);
assert.equal(normalizeOptionalEmail(`${"a".repeat(EMAIL_MAX_LENGTH)}@example.com`), null);

assert.equal(normalizeLoginIdentifier("Grower7"), "Grower7");
assert.equal(normalizeLoginIdentifier("grower+chess@example.com"), "grower+chess@example.com");
assert.equal(normalizeLoginIdentifier("bad email@example.com"), null);
assert.equal(normalizeLoginIdentifier("bad-name"), null);

assert.equal(normalizePassword("abc"), "abc");
assert.equal(normalizePassword("ab"), null);
assert.equal(normalizePassword("x".repeat(PASSWORD_MAX_LENGTH)), "x".repeat(PASSWORD_MAX_LENGTH));
assert.equal(normalizePassword("x".repeat(PASSWORD_MAX_LENGTH + 1)), null);
assert.equal(normalizePassword(undefined), null);

console.log("Kush Kings auth input verification passed.");
