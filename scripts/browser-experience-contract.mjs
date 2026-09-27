import assert from "node:assert/strict";
import fs from "node:fs";

const helper = fs.readFileSync("client/src/lib/browserExperience.ts", "utf8");
const gamePage = fs.readFileSync("client/src/components/game/GamePage.tsx", "utf8");

for (const marker of [
  "navigator.clipboard?.writeText",
  'document.createElement("textarea")',
  'document.execCommand?.("copy") === true',
  "navigator.share",
  'wakeLock?.request',
  'document.addEventListener("visibilitychange"',
  'document.removeEventListener("visibilitychange"'
]) {
  assert.ok(helper.includes(marker), `browserExperience.ts missing ${marker}`);
}

for (const marker of [
  'shareOrCopyLink',
  'createScreenWakeLockController',
  'preferShare: !archived',
  'role="status"',
  'aria-live="polite"'
]) {
  assert.ok(gamePage.includes(marker), `GamePage.tsx missing ${marker}`);
}

console.log("Kush Kings browser experience contract passed.");
