import assert from 'node:assert/strict';
import { userAlreadySeated } from '../dist/socket/playerSeat.js';

const white = { id: 'white-user' };
const black = { id: 'black-user' };

assert.equal(userAlreadySeated('white-user', white, black), true);
assert.equal(userAlreadySeated('black-user', white, black), true);
assert.equal(userAlreadySeated('observer-user', white, black), false);
assert.equal(userAlreadySeated('white-user', white, undefined), true);
assert.equal(userAlreadySeated('observer-user', undefined, undefined), false);

console.log('Kush Kings player-seat guard passed.');
