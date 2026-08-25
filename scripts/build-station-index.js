#!/usr/bin/env node
/**
 * Build a per-station view of the working timetable.
 *
 * Usage:
 *   node scripts/build-station-index.js
 *
 * Pure derivation from data/timetable/trains/ — no network access. Inverts the
 * by-train data so you can ask "which trains call at station X, and when".
 *
 * Output:
 *   data/timetable/stations.json          index of all stations
 *   data/timetable/stations/<slug>.json   one file per station
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.cwd(), 'data', 'timetable');
const TRAINS_DIR = path.join(ROOT, 'trains');
const STATIONS_DIR = path.join(ROOT, 'stations');

/** "Ketapang (Banyuwangi)" -> "ketapang-banyuwangi" */
const toSlug = name => String(name)
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // strip accents
  .replace(/[^a-z0-9]+/g, '-')                        // emoji/punctuation -> dash
  .replace(/^-|-$/g, '');

/** Sort key: use the time the train is actually at the station. */
const callTime = call => call.departure_ms ?? call.arrival_ms ?? Number.MAX_SAFE_INTEGER;

(async () => {
  if (!fs.existsSync(TRAINS_DIR)) {
    console.error(`Missing ${TRAINS_DIR}. Run scripts/scrape-168railway-sim.js first.`);
    process.exit(1);
  }

  fs.mkdirSync(STATIONS_DIR, { recursive: true });

  const files = fs.readdirSync(TRAINS_DIR).filter(f => f.endsWith('.json'));
  console.log(`Reading ${files.length} train files...`);

  const stations = new Map();

  for (const file of files) {
    const train = JSON.parse(fs.readFileSync(path.join(TRAINS_DIR, file), 'utf8'));

    for (const stop of train.stops) {
      if (!stations.has(stop.station_id)) {
        stations.set(stop.station_id, {
          station_id: stop.station_id,
          station_code: stop.station_code,
          station_name: stop.station_name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          calls: [],
        });
      }

      stations.get(stop.station_id).calls.push({
        train_id: train.train_id,
        train_code: train.train_code,
        train_name: train.train_name,
        train_type: train.train_type,
        relation: train.relation,
        origin: train.origin,
        destination: train.destination,
        sequence: stop.sequence,
        is_pass_through: stop.is_pass_through,
        arrival: stop.arrival,
        departure: stop.departure,
        arrival_linear: stop.arrival_linear,
        departure_linear: stop.departure_linear,
        arrival_ms: stop.arrival_ms,
        departure_ms: stop.departure_ms,
        dwell_minutes: stop.dwell_minutes,
        remarks: stop.remarks,
        train_file: `trains/${train.slug}.json`,
      });
    }
  }

  console.log(`Found ${stations.size} unique stations. Writing files...`);

  const index = [];
  const usedSlugs = new Map();

  for (const station of stations.values()) {
    // Chronological within the service day; untimed calls sort last.
    station.calls.sort((a, b) => callTime(a) - callTime(b) || a.train_code.localeCompare(b.train_code, 'en', { numeric: true }));

    // Station names can collide after slugification; disambiguate with the id.
    let slug = toSlug(station.station_name) || `station-${station.station_id}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${station.station_id}`;
    usedSlugs.set(slug, true);

    const stopCount = station.calls.filter(c => !c.is_pass_through).length;
    const passCount = station.calls.filter(c => c.is_pass_through).length;

    const record = {
      slug,
      station_id: station.station_id,
      station_code: station.station_code,
      station_name: station.station_name,
      latitude: station.latitude,
      longitude: station.longitude,
      train_count: station.calls.length,
      stop_count: stopCount,
      pass_count: passCount,
      source: 'derived from data/timetable/trains/',
      generated_at: new Date().toISOString(),
      calls: station.calls,
    };

    fs.writeFileSync(path.join(STATIONS_DIR, `${slug}.json`), JSON.stringify(record, null, 2) + '\n');

    index.push({
      slug,
      station_id: station.station_id,
      station_code: station.station_code,
      station_name: station.station_name,
      latitude: station.latitude,
      longitude: station.longitude,
      train_count: station.calls.length,
      stop_count: stopCount,
      pass_count: passCount,
      file: `stations/${slug}.json`,
    });
  }

  index.sort((a, b) => a.station_name.localeCompare(b.station_name, 'id'));

  const totals = index.reduce((acc, s) => {
    acc.calls += s.train_count;
    acc.stops += s.stop_count;
    acc.passes += s.pass_count;
    return acc;
  }, { calls: 0, stops: 0, passes: 0 });

  fs.writeFileSync(path.join(ROOT, 'stations.json'), JSON.stringify({
    source: 'derived from data/timetable/trains/',
    generated_at: new Date().toISOString(),
    station_count: index.length,
    call_count: totals.calls,
    stop_count: totals.stops,
    pass_count: totals.passes,
    stations: index,
  }, null, 2) + '\n');

  console.log(`\nDone. ${index.length} stations -> ${STATIONS_DIR}`);
  console.log(`Calls: ${totals.calls}  (stops: ${totals.stops}, pass-through: ${totals.passes})`);

  const busiest = [...index].sort((a, b) => b.train_count - a.train_count).slice(0, 5);
  console.log('\nBusiest stations:');
  busiest.forEach(s => console.log(`  ${s.station_name.padEnd(24)} ${String(s.train_count).padStart(4)} trains (${s.stop_count} stop, ${s.pass_count} pass)`));
})().catch(err => { console.error('FATAL:', err.stack); process.exit(1); });
