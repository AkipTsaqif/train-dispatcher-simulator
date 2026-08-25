#!/usr/bin/env node
/**
 * Scrape the full working timetable from 168railway.com's simulation feed.
 *
 * Usage:
 *   RW_USER=<username> RW_PASS=<password> node scripts/scrape-168railway-sim.js
 *
 * Unlike the public /jadwal-kereta-api/{slug} pages (which list only commercial
 * stops), GET /api/web/simulation/trains returns every timing point on each
 * route, including stations the train passes without stopping (`is_pass`).
 * The whole network arrives in a single request.
 *
 * Time handling
 * -------------
 * Upstream encodes times as milliseconds since the service day's midnight, and
 * these deliberately run past 24h for overnight workings (e.g. 86_520_000 =
 * 24:02 = 00:02 next day). We emit both forms:
 *
 *   arrival        "00:02:00"  wall-clock, wraps at midnight (== upstream usr_arriv)
 *   arrival_linear "24:02:00"  cumulative from day start, never wraps
 *   arrival_day_offset  1      calendar days after departure day
 *
 * Keeping the linear form means leg durations stay a simple subtraction and no
 * information is lost; `usr_arriv`/`usr_depart` are exactly `ms mod 24h`
 * (verified across all 57k entries).
 *
 * Output:
 *   data/timetable/trains.json          index: every train + summary counts
 *   data/timetable/trains/<code>.json   one file per train, full path list
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = 'https://www.168railway.com';
const SIM_ENDPOINT = `${BASE}/api/web/simulation/trains`;
const OUT_DIR = path.join(process.cwd(), 'data', 'timetable');
const TRAINS_DIR = path.join(OUT_DIR, 'trains');
const DAY_MS = 86_400_000;

/** Log in with a real browser and return a cookie header for plain fetches. */
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

/** ms since service-day midnight -> "HH:MM:SS", wrapping at 24h. */
function toClock(ms) {
  if (ms == null) return null;
  const s = Math.floor((((ms % DAY_MS) + DAY_MS) % DAY_MS) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** ms since service-day midnight -> "HH:MM:SS" that keeps counting past 24h. */
function toLinearClock(ms) {
  if (ms == null) return null;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const dayOffset = ms => (ms == null ? null : Math.floor(ms / DAY_MS));

/** "PLB 7044A" -> "plb-7044a", safe as a filename. */
const toSlug = code => String(code).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function normaliseTrain(raw) {
  const stops = raw.paths.map(p => ({
    sequence: p.seq,
    station_id: p.st_id,
    station_code: p.st_cd,
    station_name: p.st_name,
    latitude: p.lat,
    longitude: p.lng,
    is_pass_through: Boolean(p.is_pass),

    arrival: toClock(p.arriv_ms),
    departure: toClock(p.depart_ms),
    arrival_linear: toLinearClock(p.arriv_ms),
    departure_linear: toLinearClock(p.depart_ms),
    arrival_day_offset: dayOffset(p.arriv_ms),
    departure_day_offset: dayOffset(p.depart_ms),
    arrival_ms: p.arriv_ms,
    departure_ms: p.depart_ms,

    // Dwell in whole minutes; null when either side has no time.
    dwell_minutes: p.arriv_ms != null && p.depart_ms != null
      ? Math.round((p.depart_ms - p.arriv_ms) / 60000)
      : null,

    route_id: p.route_id ?? null,
    // Crossing / overtake notes, e.g. "X KA 69" (bersilang), "= KA 92" (susul).
    remarks: p.remarks ?? null,
  }));

  const timed = stops.filter(s => s.arrival_ms != null || s.departure_ms != null);
  const firstMs = timed.length ? (timed[0].departure_ms ?? timed[0].arrival_ms) : null;
  const lastMs = timed.length
    ? (timed[timed.length - 1].arrival_ms ?? timed[timed.length - 1].departure_ms)
    : null;

  return {
    train_id: raw.tr_id,
    train_code: raw.tr_cd,
    train_name: raw.tr_name,
    train_type: raw.tr_type ?? null,
    relation: raw.relation,
    origin_code: raw.start_st_cd,
    destination_code: raw.end_st_cd,
    origin: stops[0]?.station_name ?? null,
    destination: stops[stops.length - 1]?.station_name ?? null,

    departure: toClock(raw.depart_ms),
    arrival: toClock(raw.arriv_ms),
    departure_linear: toLinearClock(raw.depart_ms),
    arrival_linear: toLinearClock(raw.arriv_ms),
    is_overnight: Boolean(raw.is_overnight),
    duration_minutes: raw.depart_ms != null && raw.arriv_ms != null
      ? Math.round((raw.arriv_ms - raw.depart_ms) / 60000)
      : null,

    path_count: stops.length,
    stop_count: stops.filter(s => !s.is_pass_through).length,
    pass_count: stops.filter(s => s.is_pass_through).length,
    remarks_count: stops.filter(s => s.remarks).length,
    stops,
  };
}

(async () => {
  const username = process.env.RW_USER;
  const password = process.env.RW_PASS;
  if (!username || !password) {
    console.error('Missing credentials. Usage: RW_USER=<user> RW_PASS=<pass> node scripts/scrape-168railway-sim.js');
    process.exit(1);
  }

  fs.mkdirSync(TRAINS_DIR, { recursive: true });

  console.log('Authenticating...');
  const cookie = await authenticate(username, password);
  console.log('Authenticated.\n');

  console.log(`Fetching ${SIM_ENDPOINT} ...`);
  const res = await fetch(SIM_ENDPOINT, {
    headers: {
      cookie,
      accept: 'application/json',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const payload = await res.json();
  if (!payload.success || !Array.isArray(payload.data)) throw new Error('Unexpected payload shape');
  console.log(`Received ${payload.data.length} trains (generated_at ${payload.generated_at}).\n`);

  if (payload.mod_day_ms !== DAY_MS) {
    console.log(`WARNING: upstream mod_day_ms is ${payload.mod_day_ms}, expected ${DAY_MS}. Times may be misinterpreted.\n`);
  }

  console.log('Writing per-train files...');
  const index = [];
  const seen = new Map();
  let written = 0;

  for (const raw of payload.data) {
    const train = normaliseTrain(raw);

    // Train codes are not guaranteed unique; disambiguate with the train id.
    let slug = toSlug(train.train_code);
    if (seen.has(slug)) slug = `${slug}-${train.train_id}`;
    seen.set(slug, true);

    fs.writeFileSync(
      path.join(TRAINS_DIR, `${slug}.json`),
      JSON.stringify({ ...train, slug, source: SIM_ENDPOINT, scraped_at: new Date().toISOString() }, null, 2) + '\n'
    );

    index.push({
      slug,
      train_id: train.train_id,
      train_code: train.train_code,
      train_name: train.train_name,
      train_type: train.train_type,
      relation: train.relation,
      departure: train.departure,
      arrival: train.arrival,
      is_overnight: train.is_overnight,
      duration_minutes: train.duration_minutes,
      path_count: train.path_count,
      stop_count: train.stop_count,
      pass_count: train.pass_count,
      file: `trains/${slug}.json`,
    });

    if (++written % 500 === 0) console.log(`  ${written}/${payload.data.length}`);
  }

  index.sort((a, b) => a.train_code.localeCompare(b.train_code, 'en', { numeric: true }));

  const totals = index.reduce((acc, t) => {
    acc.paths += t.path_count;
    acc.stops += t.stop_count;
    acc.passes += t.pass_count;
    return acc;
  }, { paths: 0, stops: 0, passes: 0 });

  fs.writeFileSync(path.join(OUT_DIR, 'trains.json'), JSON.stringify({
    source: SIM_ENDPOINT,
    upstream_generated_at: payload.generated_at,
    scraped_at: new Date().toISOString(),
    train_count: index.length,
    path_count: totals.paths,
    stop_count: totals.stops,
    pass_count: totals.passes,
    time_fields: {
      arrival: 'wall-clock HH:MM:SS, wraps at midnight (matches upstream usr_arriv)',
      arrival_linear: 'HH:MM:SS counted from service-day start, exceeds 24h for overnight trains',
      arrival_day_offset: 'calendar days after the departure day (0 = same day)',
      arrival_ms: 'raw upstream milliseconds since service-day midnight',
    },
    trains: index,
  }, null, 2) + '\n');

  console.log(`\nDone. ${index.length} trains -> ${TRAINS_DIR}`);
  console.log(`Path entries: ${totals.paths}  (stops: ${totals.stops}, pass-through: ${totals.passes})`);
})().catch(err => { console.error('FATAL:', err.stack); process.exit(1); });
