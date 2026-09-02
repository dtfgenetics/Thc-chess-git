export type NormalizedMove = {
    from: string;
    to: string;
    promotion?: "q" | "r" | "b" | "n";
};

const SQUARE_PATTERN = /^[a-h][1-8]$/;
const PROMOTION_PATTERN = /^[qrbn]$/;

export function normalizeMoveInput(value: unknown): NormalizedMove | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;

    const candidate = value as Record<string, unknown>;
    if (typeof candidate.from !== "string" || typeof candidate.to !== "string") return null;
    if (!SQUARE_PATTERN.test(candidate.from) || !SQUARE_PATTERN.test(candidate.to)) return null;
    if (candidate.from === candidate.to) return null;

    if (candidate.promotion === undefined) {
        return { from: candidate.from, to: candidate.to };
    }

    if (typeof candidate.promotion !== "string" || !PROMOTION_PATTERN.test(candidate.promotion)) {
        return null;
    }

    return {
        from: candidate.from,
        to: candidate.to,
        promotion: candidate.promotion as NormalizedMove["promotion"]
    };
}
