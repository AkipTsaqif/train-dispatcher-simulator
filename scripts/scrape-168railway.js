#!/usr/bin/env node
/**
 * Scrape all train timetables from 168railway.com into ./data
 *
 * Usage:
 *   RW_USER=<username> RW_PASS=<password> node scripts/scrape-168railway.js
 *
 * Each detail page embeds a `const trainSchedules = {...}` blob holding every
 * train number for that service plus its full stop-by-stop schedule and
 * station coordinates, so we parse that instead of scraping rendered DOM.
 *
 * Output (scoped to data/services/ plus data/services.json — nothing else in
 * data/ is read, written, or removed):
 *   data/services.json          catalogue index (266 services)
 *   data/services/<slug>.json   one file per service
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = 'https://www.168railway.com';
const OUT_DIR = path.join(process.cwd(), 'data');
const SERVICES_DIR = path.join(OUT_DIR, 'services');
const CONCURRENCY = Number(process.env.RW_CONCURRENCY || 4);
const DELAY_MS = Number(process.env.RW_DELAY_MS || 250);
const RETRIES = 3;

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Extract a balanced JS object literal following `marker` in `html`. */
function extractObjectLiteral(html, marker) {
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const start = i + marker.length;
  let depth = 0, inStr = false, quote = '', esc = false;
  for (let j = start; j < html.length; j++) {
    const ch = html[j];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (inStr) { if (ch === quote) inStr = false; continue; }
    if (ch === '"' || ch === "'") { inStr = true; quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return html.slice(start, j + 1); }
  }
  return null;
}

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/** Log in with a real browser and return the session cookie header. */
async function authenticate(username, password) {
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.setDefaultTimeout(45000);
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('#loginEmailInput').waitFor({ state: 'visible', timeout: 45000 });
    await page.locator('#loginEmailInput').fill(username);
    await page.locator('#loginPasswordInput').fill(password);
    await page.locator('#loginSubmitBtn').click();
    await page.waitForURL(/\/dashboard/, { timeout: 30000, waitUntil: 'domcontentloaded' });
    const cookies = await ctx.cookies();
    return cookies
      .filter(c => c.domain.includes('168railway.com'))
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
  } finally {
    await browser.close();
  }
}

function makeFetcher(cookie) {
  const headers = {
    cookie,
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'id-ID,id;q=0.9,en;q=0.8',
  };
  return async function get(url) {
    let lastErr;
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      try {
        const res = await fetch(url, { headers });
        if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (err) {
        lastErr = err;
        if (attempt < RETRIES) await sleep(800 * attempt * attempt);
      }
    }
    throw lastErr;
  };
}

/** Walk the paginated catalogue and collect service slugs + card metadata. */
async function collectCatalogue(get) {
  const services = new Map();
  for (let page = 1; page <= 50; page++) {
    const html = await get(`${BASE}/jadwal-kereta-api?page=${page}`);
    const cardRe = /<a href="https:\/\/www\.168railway\.com\/jadwal-kereta-api\/([a-z0-9-]+)"[\s\S]{0,4000?}?<\/a>/g;
    const slugs = [...new Set([...html.matchAll(/\/jadwal-kereta-api\/([a-z0-9-]+)"/g)].map(m => m[1]))];
    if (!slugs.length) break;
    const before = services.size;
    for (const slug of slugs) if (!services.has(slug)) services.set(slug, { slug });
    process.stdout.write(`  catalogue page ${page}: +${services.size - before} (total ${services.size})\n`);
    if (services.size === before) break;
    await sleep(DELAY_MS);
  }
  return [...services.values()];
}

/** Fetch one service detail page and normalise it. */
async function scrapeService(get, slug) {
  const url = `${BASE}/jadwal-kereta-api/${slug}`;
  const html = await get(url);

  // Services with no published schedule render `const trainSchedules = [];`.
  const marker = 'const trainSchedules = ';
  const markerAt = html.indexOf(marker);
  if (markerAt < 0) throw new Error('trainSchedules blob not found');
  const isEmpty = html.slice(markerAt + marker.length).trimStart().startsWith('[]');

  let blob = {};
  if (!isEmpty) {
    const raw = extractObjectLiteral(html, marker);
    if (!raw) throw new Error('trainSchedules blob could not be parsed');
    blob = JSON.parse(raw);
  }

  // Service-level metadata from the TrainTrip JSON-LD block.
  let meta = {};
  const ldMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const m of ldMatches) {
    try {
      const parsed = JSON.parse(decodeEntities(m[1]));
      if (parsed['@type'] === 'TrainTrip') meta = parsed;
    } catch { /* ignore malformed blocks */ }
  }

  const trains = Object.entries(blob).map(([trainId, entry]) => {
    const t = entry.train || {};
    const stops = (entry.schedules || [])
      .slice()
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
      .map(s => ({
        sequence: s.stop_sequence,
        station_id: s.station_id,
        station_name: s.station?.station_name ?? null,
        latitude: s.station?.latitude ?? null,
        longitude: s.station?.longitude ?? null,
        arrival_time: s.arrival_time,
        departure_time: s.departure_time,
        is_pass_through: Boolean(s.is_pass_through),
        remarks: s.remarks ?? null,
      }));

    return {
      train_id: Number(trainId),
      train_number: t.train_number ?? null,
      train_name: t.train_name ?? null,
      relation: t.relation ?? null,
      train_type: t.train_type ?? null,
      gapeka_year: t.gapeka_year ?? null,
      is_active: t.is_active ?? null,
      max_speed: t.max_speed ?? null,
      origin: stops[0]?.station_name ?? null,
      destination: stops[stops.length - 1]?.station_name ?? null,
      departure_time: stops[0]?.departure_time ?? null,
      arrival_time: stops[stops.length - 1]?.arrival_time ?? null,
      stop_count: stops.length,
      stops,
    };
  }).sort((a, b) => String(a.train_number).localeCompare(String(b.train_number), 'en', { numeric: true }));

  return {
    slug,
    url,
    service_name: meta.name ?? trains[0]?.train_name ?? slug,
    description: meta.description ?? null,
    provider: meta.provider?.name ?? null,
    train_count: trains.length,
    total_stops: trains.reduce((n, t) => n + t.stop_count, 0),
    has_schedule: trains.length > 0,
    scraped_at: new Date().toISOString(),
    trains,
  };
}

/** Run `worker` over `items` with bounded concurrency. */
async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

(async () => {
  const username = process.env.RW_USER;
  const password = process.env.RW_PASS;
  if (!username || !password) {
    console.error('Missing credentials. Usage: RW_USER=<user> RW_PASS=<pass> node scripts/scrape-168railway.js');
    process.exit(1);
  }

  fs.mkdirSync(SERVICES_DIR, { recursive: true });

  // This script owns only data/services/ and data/services.json. Warn about any
  // other file in data/ so a shared directory is never silently clobbered.
  const foreign = fs.readdirSync(OUT_DIR)
    .filter(name => name !== 'services' && name !== 'services.json' && name !== 'README.md');
  if (foreign.length) {
    console.log(`Note: leaving ${foreign.length} pre-existing item(s) in data/ untouched: ${foreign.join(', ')}\n`);
  }

  console.log('Authenticating...');
  const cookie = await authenticate(username, password);
  const get = makeFetcher(cookie);
  console.log('Authenticated.\n');

  console.log('Collecting catalogue...');
  const catalogue = await collectCatalogue(get);
  console.log(`Found ${catalogue.length} services.\n`);

  console.log(`Scraping timetables (concurrency ${CONCURRENCY})...`);
  let done = 0;
  const failures = [];
  const summaries = await pool(catalogue, CONCURRENCY, async ({ slug }) => {
    try {
      const service = await scrapeService(get, slug);
      fs.writeFileSync(
        path.join(SERVICES_DIR, `${slug}.json`),
        JSON.stringify(service, null, 2) + '\n'
      );
      done++;
      const note = service.has_schedule
        ? `${service.train_count} trains, ${service.total_stops} stops`
        : 'no published schedule';
      process.stdout.write(`  [${done}/${catalogue.length}] ${slug} — ${note}\n`);
      await sleep(DELAY_MS);
      return {
        slug,
        service_name: service.service_name,
        train_count: service.train_count,
        total_stops: service.total_stops,
        has_schedule: service.has_schedule,
        file: `services/${slug}.json`,
      };
    } catch (err) {
      done++;
      failures.push({ slug, error: err.message });
      process.stdout.write(`  [${done}/${catalogue.length}] ${slug} — FAILED: ${err.message}\n`);
      return null;
    }
  });

  const ok = summaries.filter(Boolean).sort((a, b) => a.slug.localeCompare(b.slug));
  const index = {
    source: `${BASE}/jadwal-kereta-api`,
    scraped_at: new Date().toISOString(),
    service_count: ok.length,
    with_schedule: ok.filter(s => s.has_schedule).length,
    without_schedule: ok.filter(s => !s.has_schedule).length,
    train_count: ok.reduce((n, s) => n + s.train_count, 0),
    stop_count: ok.reduce((n, s) => n + s.total_stops, 0),
    failures,
    services: ok,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'services.json'), JSON.stringify(index, null, 2) + '\n');

  console.log(`\nDone. ${ok.length}/${catalogue.length} services -> ${SERVICES_DIR}`);
  console.log(`With schedule: ${index.with_schedule}  Empty: ${index.without_schedule}`);
  console.log(`Trains: ${index.train_count}  Stops: ${index.stop_count}`);
  if (failures.length) console.log(`Failures: ${failures.length} (see data/services.json)`);
})().catch(err => { console.error('FATAL:', err.stack); process.exit(1); });
