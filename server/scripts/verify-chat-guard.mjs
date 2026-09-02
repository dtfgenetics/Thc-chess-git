import assert from "node:assert/strict";

import {
    CHAT_MAX_LENGTH,
    CHAT_MAX_MESSAGES_PER_WINDOW,
    CHAT_WINDOW_MS,
    createChatRateLimiter,
    normalizeChatMessage
} from "../dist/socket/chatGuard.js";

assert.equal(normalizeChatMessage(null), null);
assert.equal(normalizeChatMessage(123), null);
assert.equal(normalizeChatMessage("   \n\t  "), null);
assert.equal(normalizeChatMessage("  grow   room\nchat  "), "grow room chat");
assert.equal(normalizeChatMessage("x".repeat(CHAT_MAX_LENGTH + 50))?.length, CHAT_MAX_LENGTH);

const canSend = createChatRateLimiter();
for (let index = 0; index < CHAT_MAX_MESSAGES_PER_WINDOW; index += 1) {
    assert.equal(canSend(index), true);
}
assert.equal(canSend(CHAT_MAX_MESSAGES_PER_WINDOW), false);
assert.equal(canSend(CHAT_WINDOW_MS), true);

console.log("Kush Kings chat guard verification passed.");
