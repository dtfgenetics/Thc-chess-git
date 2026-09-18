const FRONTEND = process.env.KUSH_FRONTEND_URL || 'https://chess.dtfseeds.com';
const API = process.env.KUSH_API_URL || 'https://chess-api.dtfseeds.com';
const DTF_PROXY = process.env.KUSH_DTF_PROXY_URL || 'https://dtfseeds.com/games/kush-kings-chess/';
const TIMEOUT = 12000;

async function request(url, accept='*/*') {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT),
    headers: {
      accept,
      'user-agent': 'kush-kings-live-check/1.0',
      'cache-control': 'no-cache, no-store, max-age=0',
      pragma: 'no-cache'
    }
  });
  return { response, body: await response.text() };
}

function must(condition, message) {
  if (!condition) throw new Error(message);
}

async function checkFrontend(url, label) {
  const { response, body } = await request(url, 'text/html');
  must(response.status === 200, `${label} expected HTTP 200, got ${response.status}`);
  must((response.headers.get('content-type') || '').includes('text/html'), `${label} must return HTML`);
  must(/Kush Kings Chess/i.test(body), `${label} is missing game identity`);
  for (const marker of [
    'data-dtf-shell="header-v6"',
    'data-dtf-sitewide-header="canonical-six-v1"',
    '>Genetics</a>',
    '>Learn</a>',
    '>Tools</a>',
    '>Games</a>',
    '>Community</a>',
    '>Shop</a>'
  ]) must(body.includes(marker), `${label} missing V6 marker: ${marker}`);
  must(!body.includes('>Courses</a>'), `${label} still exposes retired Courses nav`);
  must(!body.includes('>Diagnostic</a>'), `${label} still exposes retired Diagnostic nav`);
  console.log(`PASS ${label}: ${response.url}`);
}

async function checkApi() {
  const { response, body } = await request(new URL('/health', API), 'application/json');
  must(response.status === 200, `API health expected 200, got ${response.status}`);
  const json = JSON.parse(body);
  must(json.status === 'ok', 'API health status must be ok');
  must(json.app === 'Kush Kings Chess', `Unexpected API app marker: ${json.app}`);
  console.log(`PASS API health: ${response.url}`);
}

async function checkSocket() {
  const url = new URL('/socket.io/', API);
  url.searchParams.set('EIO','4');
  url.searchParams.set('transport','polling');
  url.searchParams.set('t',Date.now().toString(36));
  const { response, body } = await request(url, 'text/plain');
  must(response.status === 200, `Socket.IO handshake expected 200, got ${response.status}`);
  must(body.startsWith('0{'), `Socket.IO did not return Engine.IO open packet: ${body.slice(0,80)}`);
  const packet=JSON.parse(body.slice(1));
  must(typeof packet.sid === 'string' && packet.sid.length > 0, 'Socket.IO handshake missing sid');
  must(Array.isArray(packet.upgrades), 'Socket.IO handshake missing upgrades');
  console.log(`PASS Socket.IO transport: ${response.url}`);
}

try {
  await checkFrontend(FRONTEND, 'frontend');
  await checkApi();
  await checkSocket();
  await checkFrontend(DTF_PROXY, 'DTFSeeds proxy');
  console.log('Kush Kings live check passed: V6 frontend/proxy, API health, and Socket.IO transport are reachable.');
} catch (error) {
  console.error(`Kush Kings live check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
