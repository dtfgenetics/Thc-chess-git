export function resolveRoomCode(rooms: Iterable<string>, explicitCode?: string): string | undefined {
    if (explicitCode) return explicitCode;

    const joinedRooms = Array.from(rooms);
    return joinedRooms.length === 2 ? joinedRooms[1] : undefined;
}
