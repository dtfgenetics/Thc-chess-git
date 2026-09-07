import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 4181;
const origin = `http://127.0.0.1:${port}`;
const publicOrigin = 'https://chess.dtfseeds.com';
const baseHeaders = {
  Origin: publicOrigin,
  'X-Forwarded-Proto': 'https'
};

const child = spawn(process.execPath, ['server/dist/server.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    APP_NAME: 'Kush Kings Chess',
    CORS_ORIGIN: `${publicOrigin},https://dtfseeds.com,https://www.dtfseeds.com`,
    SESSION_SECRET: 'ci-production-runtime-secret-0123456789abcdef',
    SESSION_COOKIE_NAME: 'kush_kings_chess',
    PGHOST: process.env.PGHOST || '127.0.0.1',
    PGPORT: process.env.PGPORT || '5432',
    PGUSER: process.env.PGUSER || 'postgres',
    PGPASSWORD: process.env.PGPASSWORD || 'postgres',
    PGDATABASE: process.env.PGDATABASE || 'kush_kings_test'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';
child.stdout.on('data', chunk => { stdout += chunk.toString(); });
child.stderr.on('data', chunk => { stderr += chunk.toString(); });

async function waitForHealth() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Server exited early (${child.exitCode}).\n${stdout}\n${stderr}`);
    try {
      const response = await fetch(`${origin}/health`, { headers: baseHeaders });
      if (response.ok) return response;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 125));
  }
  throw new Error(`Kush Kings API did not become healthy.\n${stdout}\n${stderr}`);
}

function cookieFrom(response) {
  const raw = response.headers.get('set-cookie');
  assert.ok(raw, 'Guest-session response did not set a session cookie.');
  const cookie = raw.split(';', 1)[0];
  assert.match(cookie, /^kush_kings_chess=/);
  assert.match(raw, /HttpOnly/i);
  assert.match(raw, /Secure/i);
  assert.match(raw, /SameSite=None/i);
  return cookie;
}

try {
  const health = await waitForHealth();
  const healthJson = await health.json();
  assert.equal(healthJson.status, 'ok');
  assert.equal(healthJson.app, 'Kush Kings Chess');

  const guest = await fetch(`${origin}/v1/auth/guest`, {
    method: 'POST',
    headers: { ...baseHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'SmokeGrower' })
  });
  assert.equal(guest.status, 201, `Guest session returned ${guest.status}`);
  const user = await guest.json();
  assert.equal(user.name, 'SmokeGrower');
  assert.equal(typeof user.id, 'string');
  const cookie = cookieFrom(guest);

  const session = await fetch(`${origin}/v1/auth/`, {
    headers: { ...baseHeaders, Cookie: cookie }
  });
  assert.equal(session.status, 200, `Session lookup returned ${session.status}`);
  const sessionUser = await session.json();
  assert.equal(sessionUser.name, 'SmokeGrower');
  assert.equal(sessionUser.id, user.id);

  const handshake = await fetch(`${origin}/socket.io/?EIO=4&transport=polling&t=kush-runtime`, {
    headers: { ...baseHeaders, Cookie: cookie }
  });
  assert.equal(handshake.status, 200, `Engine.IO handshake returned ${handshake.status}`);
  const openText = await handshake.text();
  assert.match(openText, /^0\{/);
  const openPacket = JSON.parse(openText.slice(1));
  assert.ok(openPacket.sid);

  const connectUrl = `${origin}/socket.io/?EIO=4&transport=polling&sid=${encodeURIComponent(openPacket.sid)}`;
  const connectPost = await fetch(connectUrl, {
    method: 'POST',
    headers: { ...baseHeaders, Cookie: cookie, 'Content-Type': 'text/plain;charset=UTF-8' },
    body: '40'
  });
  assert.equal(connectPost.status, 200, `Socket namespace connect POST returned ${connectPost.status}`);

  const connectPoll = await fetch(connectUrl, { headers: { ...baseHeaders, Cookie: cookie } });
  assert.equal(connectPoll.status, 200, `Socket namespace connect poll returned ${connectPoll.status}`);
  const namespacePacket = await connectPoll.text();
  assert.match(namespacePacket, /40(?:\{|$)/, `Authenticated Socket.IO namespace did not connect: ${namespacePacket}`);
  assert.doesNotMatch(namespacePacket, /44\{/, 'Socket.IO namespace returned a connect error.');

  console.log(JSON.stringify({
    ok: true,
    health: '/health',
    guestSession: true,
    postgresSessionPersistence: true,
    secureCookie: true,
    engineIoHandshake: true,
    authenticatedSocketNamespace: true
  }, null, 2));
} finally {
  child.kill('SIGTERM');
}
