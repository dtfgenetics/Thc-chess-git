export function resolveRoomCode(rooms: Iterable<string>, explicitCode?: string): string | undefined {
    const joinedRooms = Array.from(rooms);

    if (explicitCode) {
        return joinedRooms.includes(explicitCode) ? explicitCode : undefined;
    }

    return joinedRooms.length === 2 ? joinedRooms[1] : undefined;
}
