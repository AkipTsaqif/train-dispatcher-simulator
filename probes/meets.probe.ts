// Probe: the meets/susul hold in the engine — advanceTrain must wait past the
// scheduled departure when ctx.meetsHold returns a later release, and release
// exactly at it. Cases: partner crossed early (no hold), crossed late (hold),
// partner behind (no hold — no deadlock).
import { buildJourney, advanceTrain, initTrain } from "../app/lib/trains";
import type { MoveCtx, TrainState, TrainStop } from "../app/lib/trains";

const PLATFORM_X: Record<string, number> = { BKST: -290, TB: 638, CIT: 1682 };
// map-edge nodes with a through path so the journey's segments stay straight
const NODES = {
  edgeL: { x: -1000, y: 205, straight: { right: "edgeR", left: null } },
  edgeR: { x: 2000, y: 205, straight: { right: null, left: "edgeL" } },
};
const hms = (s: string) => {
  const [h, m, sec] = s.split(":").map(Number);
  return h * 3600 + m * 60 + sec;
};
const mkStop = (st: string, arr: string, dep: string, meets?: { type: string; with: string }[]): TrainStop => ({
  trackmark: st,
  arr: hms(arr),
  arr_actual: arr,
  dep: hms(dep),
  dep_actual: dep,
  meets,
});

const ctx = (over: Partial<MoveCtx> = {}): MoveCtx => ({
  nodes: NODES,
  signals: [],
  switches: {},
  aspectOf: () => "red",
  trainHalfLen: 58,
  ...over,
});

let failures = 0;
const check = (name: string, cond: boolean, detail: string) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

// Held train A: eastbound BKST 12:37 → TB 12:39→12:40 → CIT 12:40.
// Partner 24 crosses TB at 12:35 → release = 12:35 + offset.
const heldStops = [
  mkStop("BKST", "12:30:00", "12:30:30"),
  mkStop("TB", "12:39:00", "12:40:00", [{ type: "susul", with: "24" }]),
  mkStop("CIT", "12:45:00", "12:46:00"),
];
const heldJourney = buildJourney(heldStops, PLATFORM_X, 205, NODES, "right");
const fresh = (): TrainState => {
  const s = initTrain(heldJourney, NODES, heldJourney.legs[0].speed);
  s.actualArr = heldStops.map(() => null);
  return s;
};

// the partner's post-meet leg speed (TB→CIT): 1044 units / 148.5 s at 80 km/h
const partnerSpeed = (1044 * 80) / (3.3 * 3600);
// 2nd signal east of TB on the bottom line: J2 @730, B109 @1247 — 609 units
const offset = 609 / partnerSpeed; // ≈ 86.6 s
const meetsHoldFor = (release: number) => (s: TrainState, legs: ReturnType<typeof buildJourney>["legs"]) =>
  legs[Math.min(s.leg, legs.length - 1)].station === "TB" ? release : 0;
const TB_DEP = hms("12:40:00");

// CASE 1 — partner crossed early: release < schedDep → departs ON TIME.
{
  const st = fresh();
  const release = hms("12:35:00") + offset; // ≈ 12:36:27 < 12:40
  advanceTrain(st, hms("12:40:30"), ctx({ meetsHold: meetsHoldFor(release) }), heldJourney.legs);
  const leftTB = st.x > PLATFORM_X.TB + 10;
  check("case1 departs on time (release < schedDep)", leftTB, `x=${st.x.toFixed(0)}`);
  check("case1 no hold past book", st.time >= TB_DEP, `time=${st.time.toFixed(0)}`);
}

// CASE 2 — partner crosses LATE so crossed+offset > schedDep: hold past 12:40,
// depart only at the release.
{
  const st = fresh();
  const release = hms("12:39:40") + offset; // ≈ 12:41:07 > 12:40 → hold 67 s
  advanceTrain(st, hms("12:40:30"), ctx({ meetsHold: meetsHoldFor(release) }), heldJourney.legs);
  const stillAtTB = Math.abs(st.x - PLATFORM_X.TB) < 1;
  check("case2 still held at TB at 12:40:30 (past book 12:40)", stillAtTB, `x=${st.x.toFixed(0)} time=${st.time.toFixed(0)}`);
  check("case2 time tracked the hold", st.time >= hms("12:40:30") - 1, `time=${st.time.toFixed(0)}`);
  // let it run past the release → it departs
  advanceTrain(st, release + 60 - st.time, ctx({ meetsHold: meetsHoldFor(release) }), heldJourney.legs);
  const leftTB = st.x > PLATFORM_X.TB + 10;
  check("case2 departs once the partner clears", leftTB, `x=${st.x.toFixed(0)}`);
}

// CASE 3 — partner BEHIND (crossed unknown): no hold → departs on schedule
// (single track: the partner follows, no deadlock).
{
  const st = fresh();
  advanceTrain(st, hms("12:40:30"), ctx({ meetsHold: () => 0 }), heldJourney.legs);
  const leftTB = st.x > PLATFORM_X.TB + 10;
  check("case3 behind partner → on-time departure (no deadlock)", leftTB, `x=${st.x.toFixed(0)}`);
}

// CASE 4 — no meets dependency at all: unchanged behavior.
{
  const st = fresh();
  const noMeet = buildJourney(
    [mkStop("BKST", "12:30:00", "12:30:30"), mkStop("TB", "12:39:00", "12:40:00"), mkStop("CIT", "12:40:30", "12:41:00")],
    PLATFORM_X, 205, NODES, "right"
  );
  const s = initTrain(noMeet, NODES, noMeet.legs[0].speed);
  s.actualArr = heldStops.map(() => null);
  advanceTrain(s, hms("12:40:30"), ctx(), noMeet.legs);
  check("case4 no dependency → on-time", s.x > PLATFORM_X.TB + 10, `x=${s.x.toFixed(0)}`);
}

console.log(failures === 0 ? "\nALL PROBES PASSED" : `\n${failures} PROBE(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
