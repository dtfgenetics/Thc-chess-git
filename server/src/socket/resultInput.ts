export type AbandonClaimType = "win" | "draw";

export function normalizeDrawResponse(value: unknown): boolean | null {
    return typeof value === "boolean" ? value : null;
}

export function normalizeAbandonClaim(value: unknown): AbandonClaimType | null {
    return value === "win" || value === "draw" ? value : null;
}
