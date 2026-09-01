import assert from 'node:assert/strict';
import { resolveResignationWinner } from '../dist/socket/gameResult.js';

const game = {
  white: { id: 'white-user', name: 'White Grower' },
  black: { id: 'black-user', name: 'Dark Grower' }
};

assert.equal(resolveResignationWinner(game, 'white-user'), 'black');
assert.equal(resolveResignationWinner(game, 'black-user'), 'white');
assert.equal(resolveResignationWinner(game, 'observer-user'), null);
assert.equal(resolveResignationWinner({ white: game.white }, 'white-user'), null);
assert.equal(resolveResignationWinner(game, undefined), null);

console.log('Kush Kings resignation ownership guard passed.');
