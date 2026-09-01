import assert from 'node:assert/strict';
import { canOfferDraw, canRespondToDraw } from '../dist/socket/gameResult.js';

const base = {
  white: { id: 'white-user' },
  black: { id: 'black-user' }
};

assert.equal(canOfferDraw(base, 'white-user'), true);
assert.equal(canOfferDraw(base, 'black-user'), true);
assert.equal(canOfferDraw(base, 'observer-user'), false);
assert.equal(canOfferDraw({ ...base, drawOfferFrom: 'white-user' }, 'black-user'), false);

const offered = { ...base, drawOfferFrom: 'white-user' };
assert.equal(canRespondToDraw(offered, 'black-user'), true);
assert.equal(canRespondToDraw(offered, 'white-user'), false);
assert.equal(canRespondToDraw(offered, 'observer-user'), false);
assert.equal(canRespondToDraw(base, 'black-user'), false);

console.log('Kush Kings draw-offer ownership guards passed.');
