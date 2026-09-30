import assert from "node:assert/strict";

const calls = [];
globalThis.window = {
  location: { href: "https://dtfseeds.com/games/kush-kings-chess/?code=ABC123" },
  fetch: async (input, init = {}) => {
    calls.push({ input: String(input), init });
    return { ok: true };
  }
};

await import("../../public-hostinger/kush-kings-chess/assets/poll-auth.js");

const token = "a".repeat(48);
await window.fetch(`./api/get-game.php?code=ABC123&token=${token}&chatAfterId=9`, {
  headers: { Accept: "application/json" },
  cache: "no-store"
});

assert.equal(calls.length, 1);
const protectedCall = calls[0];
const protectedUrl = new URL(protectedCall.input);
assert.equal(protectedUrl.searchParams.get("code"), "ABC123");
assert.equal(protectedUrl.searchParams.get("chatAfterId"), "9");
assert.equal(protectedUrl.searchParams.has("token"), false, "player token must be removed from the network URL");
assert.equal(new Headers(protectedCall.init.headers).get("X-KKC-Player-Token"), token);

calls.length = 0;
await window.fetch("./api/health.php", { headers: { Accept: "application/json" } });
assert.equal(calls[0].input, "./api/health.php", "unrelated requests must remain untouched");

console.log("Kush Kings polling credential test passed.");
