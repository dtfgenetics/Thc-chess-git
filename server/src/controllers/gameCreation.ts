export type StartingSide = "white" | "black" | "random";

export const ROOM_CODE_MAX_ATTEMPTS = 20;

export function normalizeUnlisted(value: unknown): boolean | null {
    if (value === undefined) return false;
    return typeof value === "boolean" ? value : null;
}

export function normalizeStartingSide(value: unknown): StartingSide | null {
    if (value === undefined || value === null || value === "") return "random";
    if (value === "white" || value === "black" || value === "random") return value;
    return null;
}

export function generateUniqueRoomCode(
    existingCodes: Iterable<string>,
    generateCode: () => string,
    maxAttempts = ROOM_CODE_MAX_ATTEMPTS
): string | null {
    const existing = new Set(existingCodes);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const code = generateCode();
        if (!existing.has(code)) return code;
    }

    return null;
}
