import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const controller = await readFile(new URL("../src/controllers/users.controller.ts", import.meta.url), "utf8");
const model = await readFile(new URL("../src/db/models/user.model.ts", import.meta.url), "utf8");

assert.match(controller, /normalizeGrowerName\(req\.params\?\.name\)/);
assert.match(controller, /UserModel\.findByName\(name\)/);
assert.doesNotMatch(controller, /findByNameEmail/);
assert.match(model, /FROM \"user\" WHERE name=\$1 LIMIT 1/);

console.log("Kush Kings grower profile lookup verification passed.");
