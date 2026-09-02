export const CHAT_MAX_LENGTH = 400;
export const CHAT_WINDOW_MS = 10_000;
export const CHAT_MAX_MESSAGES_PER_WINDOW = 5;

export function normalizeChatMessage(input: unknown): string | null {
    if (typeof input !== "string") return null;

    const normalized = input.replace(/\s+/g, " ").trim();
    if (!normalized) return null;

    return normalized.slice(0, CHAT_MAX_LENGTH);
}

export function createChatRateLimiter(
    maxMessages = CHAT_MAX_MESSAGES_PER_WINDOW,
    windowMs = CHAT_WINDOW_MS
) {
    const sentAt: number[] = [];

    return (now = Date.now()) => {
        while (sentAt.length > 0 && now - sentAt[0] >= windowMs) {
            sentAt.shift();
        }

        if (sentAt.length >= maxMessages) return false;

        sentAt.push(now);
        return true;
    };
}
