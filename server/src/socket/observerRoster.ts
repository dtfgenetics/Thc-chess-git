import type { User } from "@chessu/types";

type IdentifiedUser = User & {
    id: NonNullable<User["id"]>;
};

export function upsertObserver(observers: User[] | undefined, user: IdentifiedUser): User[] {
    const next: User[] = [];
    let inserted = false;

    for (const observer of observers ?? []) {
        if (observer.id !== user.id) {
            next.push(observer);
            continue;
        }
        if (!inserted) {
            next.push({ ...observer, name: user.name });
            inserted = true;
        }
    }

    if (!inserted) next.push({ ...user });
    return next;
}
