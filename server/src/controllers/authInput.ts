export const GROWER_NAME_MIN_LENGTH = 2;
export const GROWER_NAME_MAX_LENGTH = 16;
export const EMAIL_MAX_LENGTH = 128;
export const PASSWORD_MIN_LENGTH = 3;
export const PASSWORD_MAX_LENGTH = 128;

const GROWER_NAME_PATTERN = /^[A-Za-z0-9]+$/;
const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+$/;

export function normalizeGrowerName(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const name = value.trim();
    if (
        name.length < GROWER_NAME_MIN_LENGTH ||
        name.length > GROWER_NAME_MAX_LENGTH ||
        !GROWER_NAME_PATTERN.test(name)
    ) {
        return null;
    }
    return name;
}

export function normalizeOptionalEmail(value: unknown): string | undefined | null {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value !== "string") return null;

    const email = value.trim();
    if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return null;
    return email;
}

export function normalizeLoginIdentifier(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const identifier = value.trim();
    if (identifier.includes("@")) {
        return normalizeOptionalEmail(identifier) ?? null;
    }
    return normalizeGrowerName(identifier);
}

export function normalizePassword(value: unknown): string | null {
    if (typeof value !== "string") return null;
    if (value.length < PASSWORD_MIN_LENGTH || value.length > PASSWORD_MAX_LENGTH) return null;
    return value;
}
