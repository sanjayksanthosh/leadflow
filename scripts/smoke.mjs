/**
 * Headless smoke test. Serves dist/ and drives real Chrome over the DevTools
 * Protocol so the app is exercised the way a partner would use it, not just
 * compiled.
 *
 *   npm run build && node scripts/smoke.mjs
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, mkdirSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const PORT = 4180;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9333;
const OUT = join(ROOT, '.smoke');
const PROFILE = join(OUT, 'chrome-profile');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

const server = createServer((req, res) => {
  const url = (req.url ?? '/').split('?')[0];
  const safe = normalize(url).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, safe);
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(DIST, 'index.html'); // SPA fallback
  }
  try {
    statSync(file);
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1440,960',
  BASE,
]);

const errors = [];
let ws;
let nextId = 1;
const pending = new Map();

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
          ws.onopen = resolve;
          ws.onerror = reject;
        });
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
          } else if (msg.method === 'Runtime.exceptionThrown') {
            errors.push(msg.params.exceptionDetails?.exception?.description ?? 'exception');
          } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
          }
        };
        return;
      }
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error('Chrome did not expose a debug target');
}

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

async function evaluate(expression) {
  const { result, exceptionDetails } = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'eval failed');
  return result.value;
}

async function goto(path) {
  await send('Page.navigate', { url: `${BASE}${path}` });
  await sleep(700);
}

async function shot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, 'base64'));
  console.log(`  shot  ${name}.png`);
}

async function viewport(width, height, mobile = false) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
  await sleep(300);
}

const text = (selector) =>
  evaluate(`document.querySelector(${JSON.stringify(selector)})?.innerText?.trim() ?? null`);

const count = (selector) => evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`);

async function click(selector) {
  const ok = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.click();
    return true;
  })()`);
  if (!ok) throw new Error(`click: not found ${selector}`);
  await sleep(400);
}

const checks = [];
function check(label, pass, detail = '') {
  checks.push({ label, pass, detail });
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
}

/** Nothing should cause a page-level horizontal scrollbar. */
async function noOverflow(where) {
  const info = await evaluate(`(() => {
    const d = document.documentElement;
    return { scroll: d.scrollWidth, client: d.clientWidth };
  })()`);
  check(`No horizontal overflow — ${where}`, info.scroll <= info.client + 1, `${info.scroll} vs ${info.client}`);
}

/** Fills an input or textarea the way a person does, so React notices. */
const FILL = `(el, value) => {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
  Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}`;

try {
  await connect();
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await goto('/');

  // ------------------------------------------------------------------ login
  check('Login screen renders', (await count('.login__form')) === 1);
  await shot('01-login');
  await evaluate(`document.querySelectorAll('.login__list button')[1].click()`);
  await sleep(200);
  await click('.btn--primary.btn--lg');
  await sleep(600);
  check('Choosing a partner opens the dashboard', (await count('.stat-grid')) === 1);
  check('Signed-in partner shows in the top bar', (await text('.profile-btn__name')) === 'Partner 2', await text('.profile-btn__name'));

  // --------------------------------------------------------------- dashboard
  check('Starts with no leads at all', (await count('tbody tr')) === 0);
  const emptyHint = await text('.empty');
  check('Dashboard invites the first lead', /No leads yet/i.test(emptyHint || ''), emptyHint);
  await shot('02-dashboard-empty');

  // ------------------------------------------------------------------ leads
  await goto('/leads');
  check('Lead list starts empty', (await count('tbody tr')) === 0);
  check('Empty state offers to add a lead', (await count('.empty .btn--primary')) === 1);
  await shot('03-leads-empty');

  // ------------------------------------------------------------- add a lead
  await click('.empty .btn--primary');
  await sleep(400);
  const fields = await evaluate(`[...document.querySelectorAll('.modal .field__label')].map(l => l.textContent.trim().replace('*', '').trim())`);
  check(
    'Form asks only for name, number, source and status',
    fields.length === 4 && fields[0] === 'Name' && fields[1] === 'Number' && fields[2] === 'Where they came from' && fields[3] === 'Status',
    fields.join(' | '),
  );
  await evaluate(`(() => {
    const fill = ${FILL};
    const inputs = [...document.querySelectorAll('.modal input.input')];
    fill(inputs[0], 'Smoke Test Buyer');
    fill(inputs[1], '9845000000');
  })()`);
  await sleep(200);
  await click('.modal__foot .btn--primary');
  await sleep(600);
  const added = await evaluate(`JSON.parse(localStorage.getItem('leadflow:v3')).leads.length`);
  check('New lead saved', added === 1, `${added} leads`);

  // ------------------------------------------------------------- table layout
  const snapshot = await evaluate(`localStorage.getItem('leadflow:v3')`);
  await evaluate(`(() => {
    const d = JSON.parse(localStorage.getItem('leadflow:v3'));
    d.leads[0].name = 'An Extremely Long Lead Name That Has To Be Truncated In The First Column';
    for (let i = 2; i <= 12; i++) {
      d.leads.push({ ...d.leads[0], id: 'filler' + i, name: 'Filler Lead ' + i, phone: '+91 90000 000' + i });
    }
    localStorage.setItem('leadflow:v3', JSON.stringify(d));
  })()`);
  await viewport(1440, 960, false);
  await goto('/leads');
  const clipped = await evaluate(`(() => {
    const name = document.querySelector('tbody .lead-cell__name');
    return {
      rows: document.querySelectorAll('tbody tr').length,
      ellipsis: name.scrollWidth > name.clientWidth,
      tableOverflow:
        document.querySelector('.table').scrollWidth >
        document.querySelector('.table-scroll').clientWidth + 1,
      pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  })()`);
  check(
    'Long names truncate instead of stretching the table',
    clipped.ellipsis && !clipped.tableOverflow && !clipped.pageOverflow,
    JSON.stringify(clipped),
  );

  await viewport(1280, 380, false);
  await goto('/leads');
  await evaluate(`window.scrollTo({ top: 300, behavior: 'instant' })`);
  await sleep(350);
  const pinned = await evaluate(`(() => {
    const th = document.querySelector('.table th');
    return {
      scrolled: window.scrollY,
      top: Math.round(th.getBoundingClientRect().top),
      bar: Math.round(document.querySelector('.topbar').getBoundingClientRect().bottom),
      position: getComputedStyle(th).position,
    };
  })()`);
  check(
    'Table heading pins under the top bar while scrolling',
    pinned.scrolled > 0 && pinned.position === 'sticky' && Math.abs(pinned.top - pinned.bar) <= 1,
    JSON.stringify(pinned),
  );

  await evaluate(`localStorage.setItem('leadflow:v3', ${JSON.stringify(snapshot)})`);
  await viewport(1440, 960, false);
  await goto('/leads');
  check('Back to a single lead after the layout checks', (await count('tbody tr')) === 1);

  // ------------------------------------------ change status without opening the lead
  await goto('/leads');
  const rowHasStatus = await evaluate(`(() => {
    const row = document.querySelector('tbody tr');
    return {
      selects: row.querySelectorAll('.status-select').length,
      assigned: row.querySelectorAll('.partner-tag').length,
    };
  })()`);
  check(
    'Each row shows an editable status and who it is assigned to',
    rowHasStatus.selects === 1 && rowHasStatus.assigned === 1,
    JSON.stringify(rowHasStatus),
  );
  const tintBefore = await evaluate(`(() => {
    const sel = document.querySelector('tbody .status-select');
    const dot = getComputedStyle(sel.closest('.status-picker'), '::before');
    return { bg: getComputedStyle(sel).backgroundColor, dot: dot.backgroundColor, dotSize: dot.width };
  })()`);
  check(
    'Status pill is tinted with the status colour',
    tintBefore.bg !== 'rgba(0, 0, 0, 0)' && tintBefore.dot !== 'rgba(0, 0, 0, 0)' && tintBefore.dotSize === '7px',
    JSON.stringify(tintBefore),
  );
  await evaluate(`(() => {
    const sel = document.querySelector('tbody .status-select');
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, 'waiting');
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(500);
  const inlineStatus = await evaluate(`(() => ({
    path: location.pathname,
    status: JSON.parse(localStorage.getItem('leadflow:v3')).leads[0].status,
    bg: getComputedStyle(document.querySelector('tbody .status-select')).backgroundColor,
  }))()`);
  check(
    'Status changes from the list and stays on the list',
    inlineStatus.status === 'waiting' && inlineStatus.path === '/leads',
    JSON.stringify(inlineStatus),
  );
  check(
    'Pill colour follows the new status',
    inlineStatus.bg !== tintBefore.bg,
    `${tintBefore.bg} -> ${inlineStatus.bg}`,
  );

  // ------------------------------------------------- home page lists the leads
  await goto('/');
  check('Home page lists the leads', (await count('tbody tr')) === 1, `${await count('tbody tr')} rows`);
  check(
    'Home rows carry status and assigned partner',
    (await count('tbody .status-select')) === 1 && (await count('tbody .partner-tag')) === 1,
  );
  await evaluate(`[...document.querySelectorAll('.stat')].find(b => b.innerText.includes('Converted')).click()`);
  await sleep(400);
  check('Status cards filter the home list', (await count('tbody tr')) === 0, `${await count('tbody tr')} rows`);
  check('Empty filter explains itself', /Nothing in Converted/i.test((await text('.empty')) || ''));
  await evaluate(`[...document.querySelectorAll('.stat')].find(b => b.innerText.includes('All leads')).click()`);
  await sleep(400);
  check('Tapping the card again clears the filter', (await count('tbody tr')) === 1);

  // ------------------------------------------------------------ lead details
  await goto('/leads');
  await evaluate(`[...document.querySelectorAll('tbody tr')].find(r => r.innerText.includes('Smoke Test Buyer'))?.click()`);
  await sleep(600);
  check('Lead details page opens', (await count('.lastcontact')) === 1);
  check('Fresh lead has no contacts yet', (await count('.tl-item')) === 0);
  await shot('04-lead-details');

  // ----------------------------------------------------------- log a contact
  await click('.leadhead__actions .btn--primary');
  await sleep(400);
  await evaluate(`(${FILL})(document.querySelector('.modal textarea'), 'Asked for a quote, sending pricing today.')`);
  await sleep(200);
  await click('.modal__foot .btn--primary');
  await sleep(700);
  const contacted = await evaluate(`(() => {
    const d = JSON.parse(localStorage.getItem('leadflow:v3'));
    const lead = d.leads.find(l => l.name === 'Smoke Test Buyer');
    return { status: lead.status, by: lead.lastContactedBy, entries: document.querySelectorAll('.tl-item').length };
  })()`);
  check(
    'Contact updates status, author and timeline',
    contacted.status === 'followup' && contacted.by === 'p2' && contacted.entries === 1,
    JSON.stringify(contacted),
  );
  await shot('05-after-contact');

  // -------------------------------------------------------- manual status set
  await evaluate(`(() => {
    const s = document.querySelector('.leadhead__actions select');
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, 'converted');
    s.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(500);
  const closed = await evaluate(`JSON.parse(localStorage.getItem('leadflow:v3')).leads.find(l => l.name === 'Smoke Test Buyer').status`);
  check('Status can be set by hand', closed === 'converted', closed);

  // -------------------------------------------------------------- persistence
  await goto('/leads');
  check('Data survives a reload', (await count('tbody tr')) === 1, `${await count('tbody tr')} rows`);

  await goto('/pipeline');
  check('Unknown routes fall back home', (await count('.stat-grid')) === 1);

  // ------------------------------------------------------------------ mobile
  await viewport(390, 844, true);
  for (const path of ['/', '/leads']) {
    await goto(path);
    await noOverflow(`390px ${path}`);
  }
  check('Bottom nav appears on phones', (await count('.bottomnav')) === 1);
  check('Table headers become labels on phones', (await evaluate(`getComputedStyle(document.querySelector('thead')).display`)) === 'none');
  const tap = await evaluate(`(() => {
    const b = document.querySelector('.page__actions .btn');
    return b ? Math.round(b.getBoundingClientRect().height) : 0;
  })()`);
  check('Buttons are big enough to tap', tap >= 40, `${tap}px`);
  await shot('06-mobile-leads');

  await goto('/leads');
  const card = await evaluate(`(() => {
    const row = document.querySelector('tbody tr');
    const labels = [...row.querySelectorAll('td')].map((td) =>
      getComputedStyle(td, '::before').content.replace(/"/g, ''),
    );
    return {
      rowIsBlock: getComputedStyle(row).display === 'block',
      labels,
      overflow: row.scrollWidth > row.clientWidth + 1,
      statusFits: !!row.querySelector('.status-select'),
    };
  })()`);
  check(
    'Phone rows stack with a label per field',
    card.rowIsBlock &&
      card.labels.includes('Status') &&
      card.labels.includes('Assigned to') &&
      card.labels.includes('Follow-up') &&
      card.statusFits &&
      !card.overflow,
    JSON.stringify(card),
  );
  await shot('06-mobile-leads');
  await goto('/');
  await shot('07-mobile-dashboard');
  const leadId = await evaluate(`JSON.parse(localStorage.getItem('leadflow:v3')).leads.find(l => l.name === 'Smoke Test Buyer').id`);
  await goto(`/leads/${leadId}`);
  await noOverflow('390px lead details');
  await shot('08-mobile-details');

  // signing out has to work on a phone too
  await evaluate(`localStorage.clear()`);
  await goto('/');
  check('Signed-out state shows the partner picker', (await count('.login__form')) === 1);
  await noOverflow('390px login');

  check('No console errors', errors.length === 0, errors.join(' | '));
} catch (err) {
  check('Smoke run completed', false, err.message);
} finally {
  const failed = checks.filter((c) => !c.pass).length;
  console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
  try {
    await send('Browser.close');
  } catch {
    /* already gone */
  }
  await sleep(300);
  try {
    rmSync(PROFILE, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch {
    /* Chrome still holds the profile; harmless */
  }
  process.exit(failed ? 1 : 0);
}
