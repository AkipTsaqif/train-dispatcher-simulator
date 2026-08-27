#!/usr/bin/env bun
/**
 * build-jng-schedule.ts — Convert the real 168Railway working timetable into a
 * JNG dispatch demo schedule (ScheduleEntry[]).
 *
 * Reads `data/timetable/stations/jatinegara.json` (the per-station index) and
 * the per-train files it references, then emits a 3-stop schedule per train:
 *
 *   JNG-W/JNG-E  (boundary)  — arr/dep = the neighbour's departure time
 *   JNG          (platform)  — the real JNG arrival/departure
 *
 * The boundary stop's arr == dep (pass-through), so originArr = that time and
 * the approach leg runs live at the scheduled travel speed. With the scenario's
 * relativeAnchors, all dwell anchors are rebased onto the train's own clock.
 *
 * Direction is derived from the corridor: west neighbour (MTR/POK) → eastbound
 * (right, line t1); east neighbour (KLD/BKS) → westbound (left, line t2). The
 * line assignment is left for selectMainLine's fallback (scenario routing:
 * right→t1, left→t2) unless the timetable explicitly overrides.
 *
 * Usage:
 *   bun scripts/build-jng-schedule.ts              # 06:00–08:00 window
 *   bun scripts/build-jng-schedule.ts 05:00 10:00   # custom window
 *   bun scripts/build-jng-schedule.ts --all         # full day
 *
 * Output: app/dispatching/jatinegara-schedule.ts (imported by jatinegara.ts)
 */

import * as fs from "fs";
import * as path from "path";

// ─── corridor mapping ────────────────────────────────────────────────────
// JNG's four throat neighbours. West = approach from the Jakarta side
// (eastbound, right, line t1); East = approach from Bekasi/Cikarang
// (westbound, left, line t2).

const WEST_NEIGHBORS = new Set(["MTR", "POK"]); // Matraman, Pondok Jati
const EAST_NEIGHBORS = new Set(["KLD", "BKS"]); // Klender, Bekasi

// ─── helpers ──────────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname ?? __dirname, "..");
const STATION_FILE = path.join(ROOT, "data/timetable/stations/jatinegara.json");
const TRAIN_DIR = path.join(ROOT, "data/timetable/trains");

type StationCall = {
  train_file: string;
  train_code: string;
  train_name: string;
  train_type: string | null;
  arrival: string | null;
  departure: string | null;
  is_pass_through: boolean;
  remarks?: string | null;
};

type TrainStop = {
  station_code: string;
  station_name: string;
  arrival: string | null;
  departure: string | null;
  remarks?: string | null;
};

type TrainFile = {
  train_code: string;
  train_name: string;
  train_type: string | null;
  origin?: string;
  destination?: string;
  stops: TrainStop[];
};

type ScheduleStop = {
  station: string;
  arr_actual: string;
  dep_actual: string;
  line?: string;
  meets?: { type: string; with: string }[];
};

type ScheduleEntry = {
  train_no: string;
  train_name: string;
  origin?: string;
  destination?: string;
  neighborBefore?: string | null;
  neighborAfter?: string | null;
  trainType?: string | null;
  stops: ScheduleStop[];
};

/**
 * Parse Indonesian working-timetable remarks for susul (overtake) directives.
 * The text is free-form Indonesian rail-ops shorthand, e.g.:
 *   "// KA 5057 PPKA JNG TAHAN KA 5057 DI STA NYA TGGU DISUSUL PLB 7001A DI STA JATINEGARA"
 *   → this train (5057) is held to be overtaken by PLB 7001A.
 *
 * We extract the overtaking partner's number from the DISUSUL clause.
 * Only the explicit DISUSUL pattern is parsed; other remarks (holds,
 * cancellations, equality notes) are ignored — they don't map to the
 * ScheduleStop.meets field.
 */
const parseSusul = (remarks: string | null | undefined): { type: string; with: string }[] => {
  if (!remarks) return [];
  const meets: { type: string; with: string }[] = [];
  // "DISUSUL (KA \d+\w*|PLB \d+\w*)" — this train is overtaken BY the named train
  const re = /DISUSUL\s+((?:KA\s+|PLB\s+)?[A-Z0-9/]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(remarks)) !== null) {
    const partner = m[1].replace(/^KA\s+/, "").trim();
    meets.push({ type: "susul", with: partner });
  }
  return meets;
};

const hmsToSec = (hms: string): number => {
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

const secToHms = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

// ─── main ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const useAll = args.includes("--all");
let windowStart = 6 * 3600; // 06:00:00
let windowEnd = 8 * 3600; // 08:00:00

if (!useAll && args.length >= 2 && !args[0].startsWith("--")) {
  const [sh, sm] = args[0].split(":").map(Number);
  const [eh, em] = args[1].split(":").map(Number);
  windowStart = (sh || 0) * 3600 + (sm || 0) * 60;
  windowEnd = (eh || 0) * 3600 + (em || 0) * 60;
}

const stationData = JSON.parse(
  fs.readFileSync(STATION_FILE, "utf8"),
) as { calls: StationCall[] };

const entries: ScheduleEntry[] = [];
let skipped = 0;

for (const call of stationData.calls) {
  // Only trains that STOP at JNG (have an arrival time)
  if (!call.arrival) continue;
  if (call.is_pass_through) continue;

  const arrSec = hmsToSec(call.arrival);
  if (!useAll && (arrSec < windowStart || arrSec >= windowEnd)) continue;

  const trainPath = path.join(ROOT, "data/timetable", call.train_file);
  if (!fs.existsSync(trainPath)) {
    skipped++;
    continue;
  }

  const train = JSON.parse(fs.readFileSync(trainPath, "utf8")) as TrainFile;
  const jngIdx = train.stops.findIndex((s) => s.station_code === "JNG");
  if (jngIdx < 0) {
    skipped++;
    continue;
  }

  const prev = train.stops[jngIdx - 1];
  const next = train.stops[jngIdx + 1];
  const prevCode = prev?.station_code ?? null;
  const nextCode = next?.station_code ?? null;

  // Determine direction from corridor
  const fromWest = prevCode && WEST_NEIGHBORS.has(prevCode);
  const fromEast = prevCode && EAST_NEIGHBORS.has(prevCode);
  const toWest = nextCode && WEST_NEIGHBORS.has(nextCode);
  const toEast = nextCode && EAST_NEIGHBORS.has(nextCode);

  if (!fromWest && !fromEast) {
    // Can't determine corridor — skip
    skipped++;
    continue;
  }

  // Eastbound (from west, going east) or westbound (from east, going west)
  const eastbound = fromWest;
  const boundary = eastbound ? "JNG-W" : "JNG-E";

  // Boundary stop time = the neighbour's departure + 1 minute buffer.
  // The +60s push makes the train spawn a bit later so it slides in closer
  // to its scheduled platform arrival, instead of arriving far too early
  // and sitting at the platform. The origin/exit times stay real.
  const rawBoundary: string =
    prev?.departure ?? prev?.arrival ?? call.arrival!;
  const boundarySec = hmsToSec(rawBoundary) + 60; // +1 minute
  const boundaryTime: string = secToHms(boundarySec);

  // Exit boundary: the next neighbour's arrival (or JNG dep + approach)
  const exitNeighborArr = next?.arrival ?? next?.departure ?? call.departure;
  const exitTime: string = exitNeighborArr ?? call.departure ?? call.arrival!;

  // Parse susul (overtake) from remarks — try the train file's JNG stop
  // first, then the station call's remarks (same text, duplicated).
  const jngStop = train.stops[jngIdx];
  const meets = parseSusul(jngStop?.remarks ?? call.remarks);

  // Clean train number: strip "KA " prefix from train_code
  const trainNo = train.train_code.replace(/^KA\s+/, "");

  // Neighbour station names for display: the real station before/after JNG.
  const neighborBefore = prev?.station_name ?? null;
  const neighborAfter = next?.station_name ?? null;

  const stops: ScheduleStop[] = [
    {
      station: boundary,
      arr_actual: boundaryTime,
      dep_actual: boundaryTime, // pass-through — originArr = boundaryTime
    },
    {
      station: "JNG",
      arr_actual: call.arrival,
      dep_actual: call.departure ?? call.arrival,
      ...(meets.length > 0 ? { meets } : {}),
    },
    {
      station: eastbound ? "JNG-E" : "JNG-W",
      arr_actual: exitTime,
      dep_actual: exitTime, // pass-through exit
    },
  ];

  entries.push({
    train_no: trainNo,
    train_name: train.train_name,
    origin: train.origin,
    destination: train.destination,
    trainType: train.train_type,
    neighborBefore,
    neighborAfter,
    stops,
  });
}

// Sort by JNG arrival time so the file reads in timetable order
entries.sort((a, b) => {
  const aArr = hmsToSec(a.stops[1].arr_actual);
  const bArr = hmsToSec(b.stops[1].arr_actual);
  return aArr - bArr;
});

// ─── emit ──────────────────────────────────────────────────────────────────

const ts = (new Date().toISOString().slice(0, 10));
const windowLabel = useAll ? "full day" : `${secToHms(windowStart)}–${secToHms(windowEnd)}`;

const output = `// Jatinegara dispatch schedule — generated from the real 168Railway
// working timetable (${stationData.calls.length} JNG calls, ${entries.length} stops in
// the ${windowLabel} window, ${skipped} skipped — no corridor match).
// Source: data/timetable/stations/jatinegara.json + per-train files.
// Generated: ${ts} by scripts/build-jng-schedule.ts — DO NOT EDIT BY HAND.

import type { ScheduleEntry } from "../lib/train-engine";

export const JATINEGARA_SCHEDULE: ScheduleEntry[] = ${JSON.stringify(entries, null, "\t")};
`;

const outPath = path.join(ROOT, "app/dispatching/jatinegara-schedule.ts");
fs.writeFileSync(outPath, output);

console.log(`✓ Wrote ${entries.length} trains to ${path.relative(ROOT, outPath)}`);
console.log(`  Window: ${windowLabel}`);
console.log(`  Skipped (no corridor match): ${skipped}`);
console.log(`  Eastbound (from west): ${entries.filter((e) => e.stops[0].station === "JNG-W").length}`);
console.log(`  Westbound (from east): ${entries.filter((e) => e.stops[0].station === "JNG-E").length}`);
