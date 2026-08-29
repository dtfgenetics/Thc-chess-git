import assert from 'node:assert/strict';
import { upsertObserver } from '../dist/socket/observerRoster.js';

let observers = upsertObserver(undefined, { id: 'watcher', name: 'Watcher One' });
assert.deepEqual(observers, [{ id: 'watcher', name: 'Watcher One' }]);

observers = upsertObserver(observers, { id: 'watcher', name: 'Watcher Renamed' });
assert.deepEqual(observers, [{ id: 'watcher', name: 'Watcher Renamed' }]);

observers = upsertObserver([
    { id: 'watcher', name: 'Old A' },
    { id: 'other', name: 'Other' },
    { id: 'watcher', name: 'Old B' }
], { id: 'watcher', name: 'Watcher Current' });
assert.deepEqual(observers, [
    { id: 'watcher', name: 'Watcher Current' },
    { id: 'other', name: 'Other' }
]);

observers = upsertObserver(observers, { id: 42, name: 'Numeric Observer' });
assert.equal(observers.length, 3);
assert.equal(observers.at(-1)?.id, 42);

console.log('Kush Kings observer roster guard passed.');
