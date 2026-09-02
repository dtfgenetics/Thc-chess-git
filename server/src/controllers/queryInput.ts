export type GameLookupQuery =
    | { kind: "game"; id: number }
    | { kind: "user"; userId: number };

export function parsePositiveInteger(value: unknown): number | null {
    if (typeof value !== "string") return null;
    if (!/^[1-9]\d*$/.test(value)) return null;

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) return null;
    return parsed;
}

export function normalizeGameLookupQuery(
    idValue: unknown,
    userIdValue: unknown
): GameLookupQuery | null {
    const hasId = idValue !== undefined;
    const hasUserId = userIdValue !== undefined;

    if (hasId === hasUserId) return null;

    if (hasId) {
        const id = parsePositiveInteger(idValue);
        return id === null ? null : { kind: "game", id };
    }

    const userId = parsePositiveInteger(userIdValue);
    return userId === null ? null : { kind: "user", userId };
}
