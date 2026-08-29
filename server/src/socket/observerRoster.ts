type ObserverId = string | number;

type Observer = {
    id: ObserverId;
    name: string;
};

export function upsertObserver(observers: Observer[] | undefined, user: Observer): Observer[] {
    const next: Observer[] = [];
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
