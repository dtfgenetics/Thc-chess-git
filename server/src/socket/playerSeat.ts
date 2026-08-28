type SeatOwner = { id: string } | null | undefined;

export function userAlreadySeated(userId: string, white: SeatOwner, black: SeatOwner): boolean {
    return white?.id === userId || black?.id === userId;
}
