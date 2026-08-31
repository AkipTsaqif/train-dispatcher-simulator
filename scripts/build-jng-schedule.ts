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
 * Direction is derived from train-number parity: odd-numbered trains are
 * westbound (spawn from JNG-E/right), even-numbered trains are eastbound.
 * Westbound KRL use t2 (row 14); westbound non-KRL use t4 (row 10).
 * Eastbound POK trains use t6 (row 6), while other eastbound trains use t1
 * (row 16).
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
  entryLine?: string;
  spawn_time?: string;
  meets?: { type: string; with: string }[];
  /**
   * Real Klender / Buaran times for the detached KLD/BKS corridor snippet.
   *
   * These are METADATA, not routable stops. The KLD strip is physically
   * detached from the JNG throat, so making KLD/BUA real journey stops would
   * resolve `stopXFor` against the journey's own line (t2, y=464), find no
   * `stopXsByTrack.KLD.t2`, and dwell the train mid-diagram at x=584.
   * The snippet layer reads these directly instead, exactly as MTR/POK are
   * drawn from `plan.boundaryArr` rather than from schedule stops.
   *
   * Absent for the ~186 expresses that skip both stations; those run through
   * the strip without dwelling.
   */
  kld_arr?: string;
  kld_dep?: string;
  bua_arr?: string;
  bua_dep?: string;
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

/** Last numeric run in a railway train code; suffix letters do not affect parity. */
const trainNumber = (code: string): number => {
  const match = code.match(/(\d+)(?!.*\d)/);
  if (!match) throw new Error(`Train code has no numeric number: "${code}"`);
  return Number(match[1]);
};

// ─── main ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const hasWindow = args.length >= 2 && !args[0].startsWith("--");
let windowStart = 0; // 00:00:00 (full day default)
let windowEnd = 24 * 3600; // 24:00:00

if (hasWindow) {
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
  if (hasWindow && (arrSec < windowStart || arrSec >= windowEnd)) continue;

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

  const prevStops = train.stops.slice(0, jngIdx).filter((s) => s.departure || s.arrival);
  const prev = prevStops[prevStops.length - 1] ?? train.stops[jngIdx - 1];

  const nextStops = train.stops.slice(jngIdx + 1).filter((s) => s.arrival || s.departure);
  const next = nextStops[0] ?? train.stops[jngIdx + 1];

  const immPrev = train.stops[jngIdx - 1];
  const immNext = train.stops[jngIdx + 1];
  const prevCode = immPrev?.station_code ?? null;
  const nextCode = immNext?.station_code ?? null;

  // Validate the timetable corridor, but derive direction from railway train
  // number parity: odd = westbound; even = eastbound. This also handles cases
  // where the neighbour field is ambiguous while preserving the operational
  // numbering convention.
  const fromWest = prevCode && WEST_NEIGHBORS.has(prevCode);
  const fromEast = prevCode && EAST_NEIGHBORS.has(prevCode);
  const toWest = nextCode && WEST_NEIGHBORS.has(nextCode);
  const toEast = nextCode && EAST_NEIGHBORS.has(nextCode);

  if (!fromWest && !fromEast) {
    // Can't determine corridor — skip
    skipped++;
    continue;
  }

  const trainNo = train.train_code.replace(/^KA\s+/, "");
  const eastbound = trainNumber(trainNo) % 2 === 0;
  const boundary = eastbound ? "JNG-W" : "JNG-E";

  const depSec = hmsToSec(call.departure ?? call.arrival!);

  // Real scheduled times from the train's timetable JSON
  const prevArr = prev?.arrival ?? prev?.departure ?? secToHms(arrSec - 90);
  const prevDep = prev?.departure ?? prev?.arrival ?? prevArr;

  const nextArr = next?.arrival ?? next?.departure ?? secToHms(depSec + 60);
  const nextDep = next?.departure ?? next?.arrival ?? nextArr;

  // Real Klender/Buaran calls from the source timetable, carried through as
  // snippet metadata (see ScheduleStop above). 320 of the 506 JNG-calling
  // trains stop at both; the rest are expresses that skip them.
  const kldStop = train.stops.find((s) => s.station_code === "KLD");
  const buaStop = train.stops.find((s) => s.station_code === "BUA");
  const corridorTimes: Partial<ScheduleStop> = {
    ...(kldStop?.arrival ? { kld_arr: kldStop.arrival } : {}),
    ...(kldStop?.departure ?? kldStop?.arrival
      ? { kld_dep: (kldStop!.departure ?? kldStop!.arrival)! }
      : {}),
    ...(buaStop?.arrival ? { bua_arr: buaStop.arrival } : {}),
    ...(buaStop?.departure ?? buaStop?.arrival
      ? { bua_dep: (buaStop!.departure ?? buaStop!.arrival)! }
      : {}),
  };

  // Boundary spawn time:
  // For westbound trains stopping at Klender (KLD), the train departs Klender
  // at kld_dep and travels along the approach corridor toward Jatinegara at
  // the real interstation pace (~1.37 u/s, taking ~99s to cross the 136 units
  // from Klender platform to the JNG boundary edge). The boundary spawn time
  // matches that exact arrival, so the train rolls into JNG with its real-life
  // buffer/leeway before the scheduled JNG platform arrival/departure.
  // For other trains (eastbound, or expresses without KLD stop), materializes
  // ~75s before JNG platform arrival.
  let boundarySec = Math.max(0, arrSec - 75);
  if (!eastbound && kldStop?.departure) {
    const kldDepSec = hmsToSec(kldStop.departure);
    const kldArrSec = hmsToSec(kldStop.arrival ?? kldStop.departure);
    const buaDepSec = buaStop?.departure ? hmsToSec(buaStop.departure) : kldArrSec - 105;
    const interstationSec = Math.max(60, (kldArrSec - buaDepSec + 86400) % 86400);
    const pace = 144 / interstationSec; // distance between BUA (728) and KLD (584) is 144u
    const runKldToEdgeSec = Math.round(136 / pace); // distance from KLD (584) to handover edge (448) is 136u
    boundarySec = (kldDepSec + runKldToEdgeSec) % 86400;
  }
  const boundaryTime: string = secToHms(boundarySec);

  // Parse susul (overtake) from remarks — try the train file's JNG stop
  // first, then the station call's remarks (same text, duplicated).
  const jngStop = train.stops[jngIdx];
  const meets = parseSusul(jngStop?.remarks ?? call.remarks);

  // Neighbour station names for display in the infobox
  const neighborBefore = prev?.station_name ?? immPrev?.station_name ?? null;
  const neighborAfter = next?.station_name ?? immNext?.station_name ?? null;

  // Line assignment. The two throats are SYMMETRIC: a train bound for Pondok
  // Jati leaves on the POK side (t7/row 4) just as a train arriving from Pondok
  // Jati enters on the POK side (t6/row 6). Destination decides the westbound
  // line first; only Matraman-bound traffic falls through to the t2/t4 split.
  // - westbound to Pondok Jati (POK throat): t7 (row 4)
  // - westbound KRL to Matraman:            t2 (row 14)
  // - other westbound to Matraman:          t4 (row 10)
  // - eastbound from Pondok Jati:           t6 (row 6)
  // - all other eastbound (Matraman throat): t1 (row 16)
  const fromPondokJati = eastbound && immPrev?.station_code === "POK";
  const toPondokJati = !eastbound && immNext?.station_code === "POK";
  const line = !eastbound
    ? toPondokJati
      ? "t7"
      : train.train_type === "krl"
        ? "t2"
        : "t4"
    : fromPondokJati
      ? "t6"
      : "t1";

  const stops: ScheduleStop[] = [
    {
      station: boundary,
      arr_actual: prevArr,
      dep_actual: prevDep,
      spawn_time: boundaryTime,
      line,
      entryLine: line,
      ...corridorTimes,
    },
    {
      station: "JNG",
      arr_actual: call.arrival,
      dep_actual: call.departure ?? call.arrival,
      line,
      ...(meets.length > 0 ? { meets } : {}),
    },
    {
      station: eastbound ? "JNG-E" : "JNG-W",
      arr_actual: nextArr,
      dep_actual: nextDep,
      line,
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
const windowLabel = hasWindow ? `${secToHms(windowStart)}–${secToHms(windowEnd)}` : "full day";

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
