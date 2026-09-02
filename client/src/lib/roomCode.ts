const ROOM_CODE_PATTERN = /^[A-Za-z0-9_-]{6}$/;

export function parseRoomInvite(value: string): string | null {
    const input = value.trim();
    if (!input) return null;
    if (ROOM_CODE_PATTERN.test(input)) return input;

    try {
        const url = new URL(input);
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;

        const segments = url.pathname.split("/").filter(Boolean);
        const candidate = segments.at(-1);
        return candidate && ROOM_CODE_PATTERN.test(candidate) ? candidate : null;
    } catch {
        return null;
    }
}
