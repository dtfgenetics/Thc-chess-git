export const ROOM_CODE_LENGTH = 6;

const ROOM_CODE_PATTERN = /^[A-Za-z0-9_-]{6}$/;

export function normalizeRoomCode(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const code = value.trim();
    return ROOM_CODE_PATTERN.test(code) ? code : null;
}
