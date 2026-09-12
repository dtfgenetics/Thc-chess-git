import assert from "node:assert/strict";
import fs from "node:fs";

const gamePage = fs.readFileSync("client/src/components/game/GamePage.tsx", "utf8");
const wrapper = fs.readFileSync("client/src/components/game/GameAuthWrapper.tsx", "utf8");
const alert = fs.readFileSync("client/src/components/game/VisibleTurnAlert.tsx", "utf8");

assert.match(gamePage, /document\.title = `\(your turn\) \$\{APP_NAME\}`/, "GamePage must remain the authoritative local-turn title signal");
assert.match(gamePage, /lobby\.side === lobby\.actualGame\.turn\(\)/, "authoritative turn signal must still come from chess state");

assert.match(wrapper, /import VisibleTurnAlert from "\.\/VisibleTurnAlert"/, "game shell must import the visible turn alert");
assert.match(wrapper, /<VisibleTurnAlert \/>/, "game shell must render the visible turn alert beside GamePage");

assert.match(alert, /const TURN_TITLE_PREFIX = "\(your turn\)"/, "turn alert must mirror the existing title prefix");
assert.match(alert, /new MutationObserver\(sync\)/, "turn alert must react to authoritative title changes");
assert.match(alert, /role="status"/, "turn alert must expose a semantic status region");
assert.match(alert, /aria-live="polite"/, "turn alert must announce turn changes without interrupting gameplay");
assert.match(alert, /YOUR MOVE/, "turn alert needs direct non-color-only copy");
assert.match(alert, /data-kush-turn-alert="your-turn"/, "turn alert must expose a stable QA marker");
assert.doesNotMatch(alert, /socket|emit\(|makeMove|sendMove|Chess\(/, "visual turn alert must not own chess or socket behavior");

console.log("Kush Kings visible turn-alert contract passed.");
