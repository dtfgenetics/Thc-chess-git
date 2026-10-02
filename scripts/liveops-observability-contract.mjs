import assert from 'node:assert/strict';
import fs from 'node:fs';

const server=fs.readFileSync('server/src/server.ts','utf8');

for (const marker of [
  'GAME_MAINTENANCE_MODE',
  'GAME_MULTIPLAYER_ENABLED',
  'socketConnections',
  'socketDisconnects',
  'socketRejected',
  'connectedSockets',
  'uptimeSeconds'
]) {
  assert.ok(server.includes(marker), `missing Kush Kings live-ops marker: ${marker}`);
}

assert.match(server,/maintenanceMode = process\.env\.GAME_MAINTENANCE_MODE === "true"/);
assert.match(server,/multiplayerEnabled = process\.env\.GAME_MULTIPLAYER_ENABLED !== "false"/);
assert.match(server,/temporarily under maintenance/);
assert.match(server,/multiplayer is temporarily disabled/);
assert.match(server,/app\.get\("\/health"/);
assert.match(server,/operationalMetrics/);

console.log('Kush Kings live-ops and observability contract passed.');
