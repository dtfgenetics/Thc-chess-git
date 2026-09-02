import type { Game, User } from "@chessu/types";

type DatabaseTimestamp = Date | string | number | null | undefined;

export type GameRow = {
    id?: number | null;
    winner?: Game["winner"] | null;
    end_reason?: Game["endReason"] | null;
    pgn?: string | null;
    white_id?: User["id"] | null;
    white_name?: string | null;
    black_id?: User["id"] | null;
    black_name?: string | null;
    started_at?: DatabaseTimestamp;
    ended_at?: DatabaseTimestamp;
};

function toTimestamp(value: DatabaseTimestamp): number | undefined {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (typeof value === "string") {
        const timestamp = Date.parse(value);
        return Number.isNaN(timestamp) ? undefined : timestamp;
    }
    return undefined;
}

export function mapGameRow(row: GameRow): Game {
    return {
        id: row.id ?? undefined,
        winner: row.winner ?? undefined,
        endReason: row.end_reason ?? undefined,
        pgn: row.pgn ?? undefined,
        white: {
            id: row.white_id ?? undefined,
            name: row.white_name ?? undefined
        },
        black: {
            id: row.black_id ?? undefined,
            name: row.black_name ?? undefined
        },
        startedAt: toTimestamp(row.started_at),
        endedAt: toTimestamp(row.ended_at)
    };
}
