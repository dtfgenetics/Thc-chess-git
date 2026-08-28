type PlayerId = string | number;
type SeatOwner = { id: PlayerId } | null | undefined;

export function userAlreadySeated(userId: PlayerId, white: SeatOwner, black: SeatOwner): boolean {
    return white?.id === userId || black?.id === userId;
}
