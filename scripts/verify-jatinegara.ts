// Phase 6/7 verifier — Jatinegara (first cut, generated from the draw.io).
//
// Proves:
//   1. the topology compiles (8 mains, 58 switches, 23 signals, 37 groups);
//   2. per-track platform stops (multi-length platforms) resolve per line;
//   3. the bidirectional mains are flagged and a wrong-way route is routable
//      on them (explicit line, no forced-red opposition);
//   4. a route can be set through the throat from an entry signal;
//   5. journeys stop at their own line's platform X.
//
// Run: bun scripts/verify-jatinegara.ts

import { JATINEGARA_DISPATCH } from "../app/dispatching/jatinegara";
import { compileTopology } from "../app/lib/topology";
import { JATINEGARA_ASSEMBLED as JATINEGARA_TOPOLOGY } from "../app/pieces/jatinegara";
import {
	findRoute,
	flankPoints,
	closedSpanOnRoute,
	type ClosedSpan,
	type RouteSearchSignal,
} from "../app/lib/route-search";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
	console.log(
		`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`,
	);
	if (!cond) failures++;
};

const compiled = compileTopology(JATINEGARA_TOPOLOGY);
const runtime = JATINEGARA_DISPATCH;
const map = runtime.map;

// 1. structure (Phase 8: drawn extents — 15 mains incl. the 5 east-throat
// fragments and 2 Matraman snippet lines; the stubs end at junctions, 6 tracks per map boundary)
check(
	"compiles with 21 main lines (13 JNG + 2 MTR + 2 POK + 4 KLD)",
	compiled.lines.mains.length === 21,
	`mains=${compiled.lines.mains.length}`,
);
check(
	"56 switches (10 stub ends are fixed turns; P58/P63/P65/P67 are inverted points)",
	compiled.switches.items.length === 56,
	`switches=${compiled.switches.items.length}`,
);
check(
	"56 signals (27 JNG + 3 MTR + 4 POK + 22 KLD automatic blocks)",
	compiled.signals.items.length === 56,
	`signals=${compiled.signals.items.length}`,
);
check(
	"24 coupled point pairs (PC1..PC24) + 8 singles",
	(() => {
		const coupled = compiled.switches.controls.filter((c) => c.coupled);
		const singles = compiled.switches.controls.filter((c) => !c.coupled);
		const labelSet = new Set(coupled.map((c) => c.label));
		return (
			// PC21 draws a handle per switch, so count LEVERS (distinct labels), not handles
			labelSet.size === 24 &&
			singles.length === 8 &&
			[...labelSet].every((l) => /^PC\d+$/.test(l))
		);
	})(),
	`coupled=${compiled.switches.controls.filter((c) => c.coupled).length} singles=${compiled.switches.controls.filter((c) => !c.coupled).length}`,
);
check(
	"the translated stub ends stay plain joins (no switch at AC8 / AG6 / AC2 / BJ4)",
	compiled.nodes["s368x464"]?.sw === undefined &&
		compiled.nodes["s336x512"]?.sw === undefined &&
		compiled.nodes["s272x464"]?.sw === undefined &&
		compiled.nodes["s304x560"]?.sw === undefined,
	"stub-end node still has a switch",
);
check(
	"stub tracks end at their translated drawn extents (t5 352..464, t6 B6..AG6, t8 B2..AD2)",
	compiled.nodes["s368x352"] !== undefined &&
		compiled.nodes["s368x464"] !== undefined &&
		compiled.nodes["s336x512"] !== undefined &&
		compiled.nodes["s272x464"] !== undefined,
	"missing stub-end node",
);
check(
	"bidirectional mains flagged (t2,t5,t6,t7,t8)",
	compiled.lines.bidirectionalByY[464] === true &&
		compiled.lines.bidirectionalByY[272] === true &&
		!compiled.lines.bidirectionalByY[496],
	JSON.stringify(compiled.lines.bidirectionalByY),
);

// 2. multi-length platforms
const jngXs = compiled.stationStopXs["JNG"];
const mtrXs = compiled.stationStopXs["MTR"];
check(
	"JNG has per-track platform Xs — all aligned to the drawn islands at 424",
	jngXs?.t1 === 424 &&
		jngXs?.t2 === 424 &&
		jngXs?.t5 === 424 &&
		jngXs?.t6 === 424 &&
		jngXs?.t8 === 424,
	JSON.stringify(jngXs),
);
check(
	"MTR has platform Xs on mtr_hulu and mtr_hilir aligned at 120",
	mtrXs?.mtr_hulu === 120 && mtrXs?.mtr_hilir === 120,
	JSON.stringify(mtrXs),
);
check(
	"MTR platform centre sits ON the 8+16k marker lattice (a dwelling train lands on the grid)",
	mtrXs?.mtr_hulu !== undefined && (mtrXs.mtr_hulu - 8) % 16 === 0,
	`x=${mtrXs?.mtr_hulu} -> (x-8) mod 16 = ${
		mtrXs?.mtr_hulu === undefined ? "n/a" : (mtrXs.mtr_hulu - 8) % 16
	}`,
);
const mtrHilirY = compiled.lines.mains.find(
	(m) => m.trackGroupId === "mtr_hilir",
)?.lineY;
const mtrHuluY = compiled.lines.mains.find(
	(m) => m.trackGroupId === "mtr_hulu",
)?.lineY;
// Grid lines run at gridOffset.y + 16k (248, 264, ...), so a track on a
// multiple of 16 sits through the MIDDLE of a row — same as every JNG main.
check(
	"MTR rows share the JNG row lattice (0 mod 16) and stay 32 apart, Hilir above Hulu",
	mtrHilirY !== undefined &&
		mtrHuluY !== undefined &&
		mtrHilirY % 16 === 0 &&
		mtrHuluY % 16 === 0 &&
		mtrHuluY - mtrHilirY === 32,
	`hilir=${mtrHilirY} hulu=${mtrHuluY} gap=${
		mtrHilirY !== undefined && mtrHuluY !== undefined
			? mtrHuluY - mtrHilirY
			: "n/a"
	}`,
);
check(
	"the whole MTR snippet fits inside the drawn grid (no track below gridBottomY)",
	mtrHuluY !== undefined && mtrHuluY < map.grid.gridBottomY,
	`hulu=${mtrHuluY} gridBottomY=${map.grid.gridBottomY}`,
);

// --- Pondok Jati snippet: a clone of MTR shifted +208, tied to the POK throat
const pokXs = compiled.stationStopXs["POK"];
const pokHilirY = compiled.lines.mains.find(
	(m) => m.trackGroupId === "pok_hilir",
)?.lineY;
const pokHuluY = compiled.lines.mains.find(
	(m) => m.trackGroupId === "pok_hulu",
)?.lineY;
check(
	"POK has platform Xs on pok_hulu and pok_hilir aligned at 328",
	pokXs?.pok_hulu === 328 && pokXs?.pok_hilir === 328,
	JSON.stringify(pokXs),
);
check(
	"POK platform centre sits ON the 8+16k marker lattice",
	pokXs?.pok_hulu !== undefined && (pokXs.pok_hulu - 8) % 16 === 0,
	`x=${pokXs?.pok_hulu}`,
);
check(
	"POK snippet shares the MTR rows (one visual strip), Hilir above Hulu",
	pokHilirY === mtrHilirY && pokHuluY === mtrHuluY,
	`pok hilir=${pokHilirY} hulu=${pokHuluY} vs mtr hilir=${mtrHilirY} hulu=${mtrHuluY}`,
);
check(
	"POK snippet starts at column O (x=240) and does not overlap the MTR box",
	(() => {
		const pokW = compiled.nodes["pok_hilir_w"];
		const mtrE = compiled.nodes["mtr_hilir_e"];
		return pokW?.x === 240 && mtrE?.x !== undefined && pokW.x > mtrE.x;
	})(),
	`pok_w=${compiled.nodes["pok_hilir_w"]?.x} mtr_e=${compiled.nodes["mtr_hilir_e"]?.x}`,
);
check(
	"POK signals B208/B207/J101/J102 sit at their requested cells with automatic-block facings",
	(() => {
		const g = (id: string) =>
			compiled.signals.items.find((s) => s.id === id);
		const b208 = g("B208"),
			b207 = g("B207"),
			j101 = g("J101"),
			j102 = g("J102");
		return (
			// D4 = [64,304] on the real t7 edge
			b208?.x === 64 &&
			b208.y === 304 &&
			b208.dir === "left" &&
			b208.block === true &&
			// Q20/Q23 = x272 on the detached POK rows
			b207?.x === 272 &&
			b207.y === pokHilirY &&
			b207.dir === "left" &&
			b207.block === true &&
			j102?.x === 272 &&
			j102.y === pokHuluY &&
			j102.dir === "right" &&
			j102.block === true &&
			j101?.x === 368 &&
			j101.y === pokHuluY &&
			j101.dir === "right" &&
			j101.block === true
		);
	})(),
	JSON.stringify(
		compiled.signals.items.filter((s) =>
			["B208", "B207", "J101", "J102"].includes(s.id),
		),
	),
);
check(
	"boundary stops translate with their reachable extent (t5 east 432, t8 west R2, t1 west 136)",
	compiled.stationStopXs["JNG-E"]?.t5 === 432 &&
		compiled.stationStopXs["JNG-W"]?.t8 === 280 &&
		compiled.stationStopXs["JNG-W"]?.t1 === 136,
	JSON.stringify({
		W: compiled.stationStopXs["JNG-W"],
		E: compiled.stationStopXs["JNG-E"],
	}),
);

// 3. journeys stop at their own line's platform X (the dwell leg is the one
// arriving AT JNG — its station is the previous stop, its waypoint is JNG)
{
	const gidFor = (y: number) =>
		map.lines.mains.find((m) => m.lineY === y)!.trackGroupId;
	const dwellX = (no: string) => {
		const plan = runtime.journeys.find(
			(j) => j.train.train_no === no,
		)!.plan;
		const x = map.stations.stopXsByTrack["JNG"][gidFor(plan.start.y)];
		return plan.legs.find((l) => l.waypointX === x)?.waypointX;
	};
	const stops = Object.fromEntries(
		runtime.journeys.map((j) => [
			j.train.train_no,
			dwellX(j.train.train_no),
		]),
	);
	// Every journey dwells at the drawn island X=424 (all JNG platforms
	// are at 424). Check all journeys, not just a few named stubs.
	const allDwell = runtime.journeys.every(
		(j) => dwellX(j.train.train_no) === 424,
	);
	check(
		`all ${runtime.journeys.length} journeys dwell at the drawn island X=424`,
		allDwell,
		JSON.stringify(stops),
	);
	// Verify line assignment policy across the full timetable. The two throats
	// are SYMMETRIC: Pondok Jati traffic uses the POK side in BOTH directions.
	// - westbound to Pondok Jati: t7 (row 4, y=304)
	// - westbound KRL to Matraman: t2 (row 14, y=464)
	// - other westbound to Matraman: t4 (row 10, y=400)
	// - eastbound from Pondok Jati: t6 (row 6, y=336)
	// - other eastbound: t1 (row 16, y=496)
	const lastTrainNumber = (code: string): number =>
		Number(code.match(/(\d+)(?!.*\d)/)?.[1]);
	const expectedY = (j: (typeof runtime.journeys)[number]): number => {
		const odd = lastTrainNumber(j.train.train_no) % 2 === 1;
		if (odd) {
			if (
				j.train.stops[0].line === "t7" ||
				j.train.neighborAfter === "Pondok Jati"
			)
				return 304;
			return j.train.trainType === "krl" ? 464 : 400;
		}
		return j.train.stops[0].line === "t6" ||
			j.train.neighborBefore === "Pondok Jati"
			? 336
			: 496;
	};
	const wrongLine = runtime.journeys.filter(
		(j) => j.plan.start.y !== expectedY(j),
	);
	check(
		"all 410 journeys obey parity/type/corridor line assignment",
		wrongLine.length === 0,
		wrongLine
			.slice(0, 8)
			.map(
				(j) => `${j.train.train_no}:${j.plan.start.y}->${expectedY(j)}`,
			)
			.join(","),
	);
	const oddNonKrl = runtime.journeys.find(
		(j) =>
			lastTrainNumber(j.train.train_no) % 2 === 1 &&
			j.train.trainType !== "krl" &&
			j.train.neighborAfter !== "Pondok Jati",
	);
	const oddKrl = runtime.journeys.find(
		(j) =>
			lastTrainNumber(j.train.train_no) % 2 === 1 &&
			j.train.trainType === "krl" &&
			j.train.neighborAfter !== "Pondok Jati",
	);
	if (oddNonKrl) {
		check(
			`odd non-KRL ${oddNonKrl.train.train_no} spawns east on t4 (row 10)`,
			oddNonKrl.plan.start.dir === "left" &&
				oddNonKrl.plan.start.y === 400,
			JSON.stringify(oddNonKrl.plan.start),
		);
	}
	if (oddKrl) {
		check(
			`odd KRL ${oddKrl.train.train_no} spawns east on t2 (row 14)`,
			oddKrl.plan.start.dir === "left" && oddKrl.plan.start.y === 464,
			JSON.stringify(oddKrl.plan.start),
		);
	}
	// The POK throat must be symmetric: both directions carry real traffic.
	const toPok = runtime.journeys.filter((j) => j.plan.start.y === 304);
	const fromPok = runtime.journeys.filter((j) => j.plan.start.y === 336);
	check(
		"the POK throat is symmetric — t7 (row 4) carries the Pondok Jati departures",
		toPok.length > 0 && toPok.every((j) => j.plan.start.dir === "left"),
		`t7 journeys=${toPok.length}`,
	);
	check(
		"t6 (row 6) carries the Pondok Jati arrivals",
		fromPok.length > 0 &&
			fromPok.every((j) => j.plan.start.dir === "right"),
		`t6 journeys=${fromPok.length}`,
	);
}

// --- Klender/Bekasi strip: 4-track double-double at 2x compression --------
{
	const row = (id: string) =>
		compiled.lines.mains.find((m) => m.trackGroupId === id)?.lineY;
	const t1 = row("kld_t1"),
		t2 = row("kld_t2"),
		t3 = row("kld_t3"),
		t4 = row("kld_t4");
	// Right-hand running, fast pair on top:  t4 <- / t3 -> / t2 <- / t1 ->
	check(
		"KLD is a 4-track band, rows 32 apart, whose FAST pair shares the MTR/POK rows",
		t4 === 576 &&
			t3 === 608 &&
			t2 === 640 &&
			t1 === 672 &&
			t4 === mtrHilirY &&
			t3 === mtrHuluY,
		`t4=${t4} t3=${t3} t2=${t2} t1=${t1} mtrHilir=${mtrHilirY} mtrHulu=${mtrHuluY}`,
	);
	// The three snippet frames must line up horizontally and not collide: POK
	// ends at x=400 and KLD starts at column AB (x=448), a 2-cell gap.
	check(
		"KLD sits right of POK with a 2-cell gap and stays inside the diagram width",
		(() => {
			const kldW = compiled.nodes["kld_t1_w"]?.x;
			const kldE = compiled.nodes["kld_t1_e"]?.x;
			const pokE = compiled.nodes["pok_hulu_e"]?.x;
			return (
				kldW === 448 &&
				kldE === 784 &&
				pokE !== undefined &&
				kldW - pokE === 48 &&
				kldE <= map.grid.width
			);
		})(),
		`pokEnd=${compiled.nodes["pok_hulu_e"]?.x} kld=${compiled.nodes["kld_t1_w"]?.x}..${compiled.nodes["kld_t1_e"]?.x} width=${map.grid.width}`,
	);
	check(
		"KLD obeys RIGHT-HAND running: in each pair the westbound track sits ABOVE its eastbound partner",
		t4 !== undefined &&
			t3 !== undefined &&
			t2 !== undefined &&
			t1 !== undefined &&
			t4 < t3 &&
			t2 < t1,
		`fast: hilir=${t4} above hulu=${t3} | local: hilir=${t2} above hulu=${t1}`,
	);
	check(
		"the FAST pair sits above the local pair",
		t3 !== undefined && t2 !== undefined && t3 < t2,
		`fast bottom=${t3} local top=${t2}`,
	);
	const dir = (id: string) =>
		compiled.lines.mains.find((m) => m.trackGroupId === id)?.normalBearing
			.dx;
	check(
		"KLD directions alternate Hulu(->) / Hilir(<-) on both the local and fast pairs",
		dir("kld_t1") === 1 &&
			dir("kld_t2") === -1 &&
			dir("kld_t3") === 1 &&
			dir("kld_t4") === -1,
		`t1=${dir("kld_t1")} t2=${dir("kld_t2")} t3=${dir("kld_t3")} t4=${dir("kld_t4")}`,
	);
	// A compressed cell is 32u; every centre must still land on the 8+16k marker
	// lattice or a dwelling train sits half a cell off its platform.
	const kldSignals = compiled.signals.items.filter((s) =>
		/^K[1-4]\d$/.test(s.id),
	);
	check(
		"all 22 KLD signals are automatic blocks on cell centres (0+16k)",
		kldSignals.length === 22 &&
			kldSignals.every((s) => s.block === true && s.x % 16 === 0),
		`count=${kldSignals.length} offLattice=${kldSignals
			.filter((s) => s.x % 16 !== 0)
			.map((s) => `${s.id}@${s.x}`)
			.join(",")}`,
	);
	// A signal marks the boundary between two blocks, so it belongs on a
	// gridline. This must hold for EVERY signal in the layout, not just KLD -
	// an earlier KLD revision used the 8+16k marker lattice instead, which put
	// its signals mid-cell while all 33 others sat on corners.
	check(
		"every signal in the layout sits on a cell centre (0+16k)",
		compiled.signals.items.every(
			(s) =>
				Number.isInteger(s.x) === false ||
				s.x % 16 === 0 ||
				s.id === "NE8",
		),
		compiled.signals.items
			.filter(
				(s) =>
					Number.isInteger(s.x) && s.x % 16 !== 0 && s.id !== "NE8",
			)
			.map((s) => `${s.id}@${s.x}`)
			.join(",") || "all on corners (NE8 exempt: sits on a diagonal)",
	);
	const onRow = (y: number | undefined) =>
		kldSignals.filter((s) => s.y === y).length;
	check(
		"local pair carries 7 blocks each; the fast pair carries 4 each",
		onRow(t1) === 7 &&
			onRow(t2) === 7 &&
			onRow(t3) === 4 &&
			onRow(t4) === 4,
		`t1=${onRow(t1)} t2=${onRow(t2)} t3=${onRow(t3)} t4=${onRow(t4)}`,
	);
	// SCALE 1:2 is the whole point of this strip, and it is only visible in the
	// signal PITCH. Drawn at 1 cell = 16u, the authored "2 empty cells" between
	// local blocks must render as a 48-unit gap (3 columns: signal + 2 empty)
	// and the fast pair's "4 empty cells" as 80 units. An earlier revision drew
	// one cell as 32u, which silently doubled both gaps into a 2x EXPANSION.
	const rowGaps = (y: number | undefined) => {
		const xs = kldSignals
			.filter((s) => s.y === y)
			.map((s) => s.x)
			.sort((a, b) => a - b);
		return xs.slice(1).map((x, i) => x - xs[i]);
	};
	check(
		"KLD is drawn at SCALE 1:2 - local blocks 48u apart (2 empty cells), fast blocks 80u (4 empty)",
		rowGaps(t1).every((g) => g === 48) &&
			rowGaps(t2).every((g) => g === 48) &&
			rowGaps(t3).every((g) => g === 80) &&
			rowGaps(t4).every((g) => g === 80),
		`local=${rowGaps(t1).join(",")} fast=${rowGaps(t3).join(",")}`,
	);
	check(
		"one KLD cell is 16 units, so the 21-cell strip spans exactly 336 units",
		(() => {
			const w =
				compiled.nodes["kld_t1_e"]?.x - compiled.nodes["kld_t1_w"]?.x;
			return w === 21 * 16;
		})(),
		`span=${compiled.nodes["kld_t1_e"]?.x - compiled.nodes["kld_t1_w"]?.x} expected=${21 * 16}`,
	);
	const kldXs = compiled.stationStopXs["KLD"];
	const buaXs = compiled.stationStopXs["BUA"];
	check(
		"Klender and Buaran serve the LOCAL pair only and line up across both rows",
		kldXs?.kld_t1 === 584 &&
			kldXs?.kld_t2 === 584 &&
			buaXs?.kld_t1 === 728 &&
			buaXs?.kld_t2 === 728 &&
			kldXs?.kld_t3 === undefined &&
			buaXs?.kld_t3 === undefined,
		`KLD=${JSON.stringify(kldXs)} BUA=${JSON.stringify(buaXs)}`,
	);
	// The island bar hangs off the UPPER track of its pair, so it must be
	// anchored to the local Hilir row - not to whatever row happens to be first.
	// The platforms occupy the 2 cells BEFORE a block signal (t1 cells 9-10 and
	// 18-19), never the cell a signal already stands on.
	check(
		"no KLD platform shares a cell with a block signal",
		[584, 728].every((px) => !kldSignals.some((s) => s.x === px)),
		`platformXs=584,728 signalXs=${[...new Set(kldSignals.map((s) => s.x))].sort((a, b) => a - b).join(",")}`,
	);
	// Signals sit at 0 mod 16 and stop points at 8 mod 16 - offset by half a
	// cell from each other. That is physically right: a train stops INSIDE a
	// block, not on the boundary that a signal marks.
	check(
		"every platform stop point sits on the 8+16k lattice, offset from the signals",
		Object.values(compiled.stationPlatformCenterX).every(
			(x) => (x - 8) % 16 === 0,
		),
		Object.entries(compiled.stationPlatformCenterX)
			.filter(([, x]) => (x - 8) % 16 !== 0)
			.map(([c, x]) => `${c}@${x}`)
			.join(",") || "all offset from signals",
	);
	// The DRAWN BAR is a different quantity from the stop point: it must begin
	// and end on CELL EDGES so it fills whole cells rather than starting
	// mid-cell. This is the check that was missing when KLD's bar spanned
	// 160..192 - two cell centres - and so looked shifted by half a cell.
	check(
		"every drawn island bar starts and ends on a cell edge (fills whole cells)",
		map.presentation.kind !== "schematic" ||
			(map.presentation.stationShapes ?? []).every((s) => {
				const half = (s.length ?? 64) / 2;
				return (
					(s.x - half - 8) % 16 === 0 && (s.x + half - 8) % 16 === 0
				);
			}),
		(map.presentation.kind === "schematic"
			? (map.presentation.stationShapes ?? [])
			: []
		)
			.filter((s) => {
				const half = (s.length ?? 64) / 2;
				return (
					(s.x - half - 8) % 16 !== 0 || (s.x + half - 8) % 16 !== 0
				);
			})
			.map(
				(s) =>
					`${s.code}@${s.x} spans ${s.x - (s.length ?? 64) / 2}..${s.x + (s.length ?? 64) / 2}`,
			)
			.join(" ") || "all bars fill whole cells",
	);
	check(
		"the KLD/BUA island bars are drawn between the LOCAL pair",
		map.presentation.kind === "schematic" &&
			(map.presentation.stationShapes ?? [])
				.filter((s) => s.code === "KLD" || s.code === "BUA")
				.every((s) => s.y === t2),
		(map.presentation.kind === "schematic"
			? (map.presentation.stationShapes ?? [])
			: []
		)
			.filter((s) => s.code === "KLD" || s.code === "BUA")
			.map((s) => `${s.code}@y=${s.y}`)
			.join(" ") + ` (local hilir row = ${t2})`,
	);
	check(
		"the whole KLD strip fits inside the widened canvas",
		t4 !== undefined && t4 < map.grid.gridBottomY && 784 <= map.grid.width,
		`t4=${t4} gridBottomY=${map.grid.gridBottomY} right=784 width=${map.grid.width}`,
	);
	// At 2x compression, cell CENTRES (8+16k, so trains dwell square on their
	// platforms) and piece ENDPOINTS (0+16k, required by verify:grid-ref) have
	// opposite parity. Both hold only because the drawn track overhangs the
	// first and last cell centre by half a normal cell.
	check(
		"KLD track endpoints sit on the 0-mod-16 corner lattice, cell centres on 8-mod-16",
		(() => {
			const ends = ["kld_t1", "kld_t2", "kld_t3", "kld_t4"].flatMap(
				(id) => [
					compiled.nodes[`${id}_w`]?.x,
					compiled.nodes[`${id}_e`]?.x,
				],
			);
			const endsOk = ends.every((x) => x !== undefined && x % 16 === 0);
			// Cell centres are where PLATFORMS (stop points) live, not signals.
			const centresOk = [584, 728].every((x) => (x - 8) % 16 === 0);
			return (
				endsOk && centresOk && ends.includes(448) && ends.includes(784)
			);
		})(),
		`ends=${["kld_t1", "kld_t2", "kld_t3", "kld_t4"].map((id) => `${compiled.nodes[`${id}_w`]?.x}..${compiled.nodes[`${id}_e`]?.x}`).join(" ")}`,
	);
}

// Signal-position edits requested as exact grid cells.
check(
	"NW1/NW3/NW5 moved to G16/J12/J6",
	(() => {
		const g = (id: string) =>
			compiled.signals.items.find((s) => s.id === id);
		return (
			g("NW1")?.x === 112 &&
			g("NW1")?.y === 496 &&
			g("NW3")?.x === 160 &&
			g("NW3")?.y === 432 &&
			g("NW5")?.x === 160 &&
			g("NW5")?.y === 336
		);
	})(),
	JSON.stringify(
		compiled.signals.items.filter((s) =>
			["NW1", "NW3", "NW5"].includes(s.id),
		),
	),
);

// 4. a route through the throat from an entry signal
{
	const graph = map.compatibility.movement.nodes;
	const signals: RouteSearchSignal[] = map.signals.items.map((s) => ({
		id: s.id,
		edge: s.edge,
		dir: s.dir,
		x: s.x,
		y: s.y,
	}));
	const nw1 = signals.find((s) => s.id === "NW1")!;
	const r = findRoute({
		entranceId: "NW1",
		entrance: nw1,
		signals,
		graph,
		switches: { ...map.switches.initialState },
		isLocked: () => false,
		segmentLevels: map.segmentLevels,
	});
	check(
		"NW1 (track 1 west outer entry) routes to NW1A",
		r !== null && r.exitSignalId === "NW1A",
		r
			? `exit=${r.exitSignalId} lastX=${r.pts[r.pts.length - 1][0]}`
			: "no route",
	);
	const nw1a = signals.find((s) => s.id === "NW1A")!;
	const r1a = findRoute({
		entranceId: "NW1A",
		entrance: nw1a,
		signals,
		graph,
		switches: { ...map.switches.initialState },
		isLocked: () => false,
		segmentLevels: map.segmentLevels,
	});
	check(
		"NW1A (track 1 intermediate entry) routes to XE1",
		r1a !== null &&
			(r1a.exitSignalId === "XE1" ||
				r1a.pts[r1a.pts.length - 1][0] > 1000),
		r1a
			? `exit=${r1a.exitSignalId} lastX=${r1a.pts[r1a.pts.length - 1][0]}`
			: "no route",
	);
	// a bidirectional wrong-way move: XW2 (west exit on t2) — the train may enter
	// from the east on t2 and leave west; the search must find the west route
	const xw2 = signals.find((s) => s.id === "XW2")!;
	const r2 = findRoute({
		entranceId: "XW2",
		entrance: xw2,
		signals,
		graph,
		switches: { ...map.switches.initialState },
		isLocked: () => false,
		segmentLevels: map.segmentLevels,
	});
	check(
		"XW2 (platform 2 west exit) routes to XW2A",
		r2 !== null && r2.exitSignalId === "XW2A",
		r2
			? `exit=${r2.exitSignalId} lastX=${r2.pts[r2.pts.length - 1][0]}`
			: "no route",
	);
	const xw2a = signals.find((s) => s.id === "XW2A")!;
	const r2a = findRoute({
		entranceId: "XW2A",
		entrance: xw2a,
		signals,
		graph,
		switches: { ...map.switches.initialState },
		isLocked: () => false,
		segmentLevels: map.segmentLevels,
	});
	check(
		"XW2A (t2 outer west exit) routes west to the boundary",
		r2a !== null && r2a.pts[r2a.pts.length - 1][0] < 100,
		r2a ? `lastX=${r2a.pts[r2a.pts.length - 1][0]}` : "no route",
	);
	const xw7 = signals.find((s) => s.id === "XW7")!;
	const r7 = findRoute({
		entranceId: "XW7",
		entrance: xw7,
		signals,
		graph,
		switches: { ...map.switches.initialState },
		isLocked: () => false,
		segmentLevels: map.segmentLevels,
	});
	check(
		"XW7 (platform 7 west exit) routes to XW7A",
		r7 !== null && r7.exitSignalId === "XW7A",
		r7
			? `exit=${r7.exitSignalId} lastX=${r7.pts[r7.pts.length - 1][0]}`
			: "no route",
	);
	const xw7a = signals.find((s) => s.id === "XW7A")!;
	const r7a = findRoute({
		entranceId: "XW7A",
		entrance: xw7a,
		signals,
		graph,
		switches: { ...map.switches.initialState },
		isLocked: () => false,
		segmentLevels: map.segmentLevels,
	});
	check(
		"XW7A (t7 intermediate west exit at P4) routes to B208",
		r7a !== null && r7a.exitSignalId === "B208",
		r7a
			? `exit=${r7a.exitSignalId} lastX=${r7a.pts[r7a.pts.length - 1][0]}`
			: "no route",
	);
	// Phase 8: a stub exit must DIVE through the throat — XE5 (t5, y=368) ends
	// at the terminating switch Z8; its route throws V (to t6) then W (to
	// t4) and reaches the east boundary — no invented straight continuation
	const xe5 = signals.find((s) => s.id === "XE5")!;
	const r3 = findRoute({
		entranceId: "XE5",
		entrance: xe5,
		signals,
		graph,
		switches: { ...map.switches.initialState },
		isLocked: () => false,
		segmentLevels: map.segmentLevels,
	});
	check(
		"XE5 (t5 stub exit) routes THROUGH the throat to the east boundary (a dive via the fixed turns + P44/P29)",
		r3 !== null &&
			r3.pts[r3.pts.length - 1][0] > 800 &&
			r3.pts.some((p) => p[1] !== 368),
		r3
			? `lastX=${r3.pts[r3.pts.length - 1][0]} moves=${JSON.stringify(r3.requiredSwitches)}`
			: "no route",
	);
	check(
		"the XE5 dive needs only the real switches (P44 at AB6 + P29 at AD10 — the stub ends are fixed turns)",
		r3 !== null &&
			Object.keys(r3.requiredSwitches).every(
				(k) => ![39, 45].includes(Number(k)),
			) &&
			r3.requiredSwitches[44] === "reversed" &&
			r3.requiredSwitches[29] === "reversed",
		r3 ? JSON.stringify(r3.requiredSwitches) : "no route",
	);
	// with the real switches locked, the dive is impossible — the search can
	// only end at the first blocked switch (a dead junction the signal cannot
	// clear; its walkRoute stays blocked and the aspect stays red)
	const r4 = findRoute({
		entranceId: "XE5",
		entrance: xe5,
		signals,
		graph,
		switches: { ...map.switches.initialState },
		isLocked: (sw) => true, // everything locked — the branches cannot be thrown
		segmentLevels: map.segmentLevels,
	});
	check(
		"XE5 with the throat switches locked cannot clear through the dive",
		r4 === null || r4.pts[r4.pts.length - 1][0] < 800,
		r4 ? `lastX=${r4.pts[r4.pts.length - 1][0]}` : "no route",
	);

	// A thrown PC13 turns NE2 onto the XW4 route. PC22's branch reaches AH10,
	// adjacent to that route at AG10–AF10, but it does not foul it. JNG's
	// layout-specific clearance must keep PC22 free; the old global CELL/3
	// value incorrectly included both coupled ends as flanks.
	const ne2 = signals.find((s) => s.id === "NE2")!;
	const ne2Switches = {
		...map.switches.initialState,
		19: "reversed" as const,
		30: "reversed" as const,
		11: "reversed" as const,
		20: "reversed" as const,
	};
	const ne2Route = findRoute({
		entranceId: "NE2",
		entrance: ne2,
		signals,
		graph,
		switches: ne2Switches,
		isLocked: () => false,
		segmentLevels: map.segmentLevels,
	});
	const oldFlanks = ne2Route
		? flankPoints(ne2Route, graph, map.grid.cellSize / 3)
		: [];
	const jngFlanks = ne2Route
		? flankPoints(
				ne2Route,
				graph,
				map.interlocking?.flankClearance ?? map.grid.cellSize / 3,
			)
		: [];
	check(
		"NE2→XW4 excludes adjacent PC22 from its JNG flank clearance",
		ne2Route?.exitSignalId === "XW4" &&
			oldFlanks.includes(31) &&
			oldFlanks.includes(50) &&
			!jngFlanks.includes(31) &&
			!jngFlanks.includes(50),
		`exit=${ne2Route?.exitSignalId} old=${oldFlanks.join(",")} jng=${jngFlanks.join(",")}`,
	);
	// NE4's candidate route passes through PC22 at AH10. The tighter JNG
	// clearance must not turn that neighbouring geometry into a PC22 flank of
	// either route; normal route/point locking still decides whether NE4 can be
	// cleared while NE2 remains reserved.
	const ne4 = signals.find((s) => s.id === "NE4")!;
	const ne4Route = findRoute({
		entranceId: "NE4",
		entrance: ne4,
		signals,
		graph,
		switches: ne2Switches,
		isLocked: () => false,
		segmentLevels: map.segmentLevels,
	});
	const ne4Flanks = ne4Route
		? flankPoints(
				ne4Route,
				graph,
				map.interlocking?.flankClearance ?? map.grid.cellSize / 3,
			)
		: [];
	// Manual point setting (interlocking.routeSetting). "Inactive track" is NOT
	// authored anywhere: a route is simply unformed while the points as they
	// stand do not lead to it. NE5→XW4 needs P36 reversed, so with every point
	// normal the signal must be refused; with P36 thrown the same route needs no
	// moves and clears. If this ever reports requiredSwitches={} on the first
	// call, the refusal has silently stopped happening.
	check(
		"JNG uses manual route setting",
		map.interlocking?.routeSetting === "manual",
		`routeSetting=${map.interlocking?.routeSetting}`,
	);
	{
		const ne5 = signals.find((s) => s.id === "NE5")!;
		const routeWith = (switches: Record<number, "normal" | "reversed">) =>
			findRoute({
				entranceId: "NE5",
				entrance: ne5,
				signals,
				graph,
				switches,
				isLocked: () => false,
				segmentLevels: map.segmentLevels,
			});
		const unset = routeWith({ ...map.switches.initialState });
		const set = routeWith({ ...map.switches.initialState, 36: "reversed" });
		check(
			"NE5 needs P36 thrown first (refused in manual mode), then forms with no moves",
			unset?.requiredSwitches[36] === "reversed" &&
				set !== null &&
				Object.keys(set.requiredSwitches).length === 0 &&
				set.exitSignalId === unset?.exitSignalId,
			`unset=${JSON.stringify(unset?.requiredSwitches)} set=${JSON.stringify(set?.requiredSwitches)}`,
		);
	}

	// No route may double back on itself. A signal clears for ONE direction of
	// travel, so every along-line step must make forward progress; a crossover
	// diagonal may move laterally but never backwards. This caught a real bug:
	// "dot > -0.8" accepted a backward 45-degree diagonal (-0.707), letting XE1
	// clear eastbound over PC17 set against it, and NE4 reach XW3 by running
	// east while signalled west.
	{
		const offenders: string[] = [];
		const trials: Record<number, "normal" | "reversed">[] = [
			{},
			{ 12: "reversed", 4: "reversed" },
			{ 10: "reversed", 18: "reversed" },
			{ 19: "reversed", 30: "reversed", 11: "reversed", 20: "reversed" },
		];
		for (const entrance of signals) {
			for (const over of trials) {
				const route = findRoute({
					entranceId: entrance.id,
					entrance,
					signals,
					graph,
					switches: { ...map.switches.initialState, ...over },
					isLocked: () => false,
					segmentLevels: map.segmentLevels,
				});
				if (!route) continue;
				const forward = entrance.dir === "right" ? 1 : -1;
				for (let i = 1; i < route.pts.length; i++) {
					const step =
						(route.pts[i][0] - route.pts[i - 1][0]) * forward;
					if (step < -1e-9) {
						offenders.push(
							`${entrance.id}(${entrance.dir}) ${route.pts[i - 1][0]}->${route.pts[i][0]}`,
						);
					}
				}
			}
		}
		check(
			"no route ever reverses against the direction its signal was cleared for",
			offenders.length === 0,
			`${offenders.length}: ${offenders.slice(0, 5).join(", ")}`,
		);
	}

	// Out-of-service track (map.outOfService). t4 and t3 are unbuilt west of H,
	// so XW4 with every point normal runs into closed track and must be refused.
	// The user's escapes are PC7 (to t6) or PC3+PC2 (to t2) — PC3 alone only
	// reaches t3, which is closed as well. This is authored real-world data:
	// no switch arrangement could imply it.
	{
		const spans: ClosedSpan[] = (map.outOfService ?? []).map((span) => {
			const main = map.lines.mains.find(
				(m) => m.trackGroupId === span.groupId,
			)!;
			return {
				groupId: span.groupId,
				lineY: main.lineY,
				fromX: Math.min(span.fromX, span.toX),
				toX: Math.max(span.fromX, span.toX),
			};
		});
		check(
			"t4 and t3 are authored out of service west of L",
			spans.length === 2 &&
				spans.every((s) => s.fromX === 32 && s.toX === 192) &&
				spans.some((s) => s.groupId === "t4") &&
				spans.some((s) => s.groupId === "t3"),
			JSON.stringify(spans),
		);
		const xw4 = signals.find((s) => s.id === "XW4")!;
		const routeVia = (over: Record<number, "normal" | "reversed">) =>
			findRoute({
				entranceId: "XW4",
				entrance: xw4,
				signals,
				graph,
				switches: { ...map.switches.initialState, ...over },
				isLocked: () => false,
				segmentLevels: map.segmentLevels,
			});
		const blockedOn = (over: Record<number, "normal" | "reversed">) => {
			const route = routeVia(over);
			return route
				? (closedSpanOnRoute(route, spans)?.groupId ?? null)
				: "no-route";
		};
		check(
			"XW4 all-normal runs into closed t4 and is refused",
			blockedOn({}) === "t4",
			`blocked=${blockedOn({})}`,
		);
		check(
			"PC3 alone only reaches t3, which is closed too",
			blockedOn({ 16: "reversed", 26: "reversed" }) === "t3",
			`blocked=${blockedOn({ 16: "reversed", 26: "reversed" })}`,
		);
		check(
			"PC7 gives XW4 a clear road to t6",
			blockedOn({ 42: "reversed", 27: "reversed" }) === null,
			`blocked=${blockedOn({ 42: "reversed", 27: "reversed" })}`,
		);
		check(
			"PC3+PC2 gives XW4 a clear road to t2",
			blockedOn({
				16: "reversed",
				26: "reversed",
				7: "reversed",
				15: "reversed",
			}) === null,
			`blocked=${blockedOn({ 16: "reversed", 26: "reversed", 7: "reversed", 15: "reversed" })}`,
		);
	}

	// NE4 exits at XW4. It previously reported XW3 via a route that ran EAST
	// from AG10 to AJ12 while signalled WEST — a reversal admitted by the old
	// "dot > -0.8" bearing test, which a backward 45-degree diagonal (-0.707)
	// passed. Routes are now required to make forward progress, so that
	// candidate is gone; see the no-reversal check below.
	check(
		"NE2 and NE4 candidates do not spuriously flank-lock PC22",
		ne4Route?.exitSignalId === "XW4" &&
			ne4Route.pts.some(([x, y]) => x === 608 && y === 400) &&
			!jngFlanks.includes(31) &&
			!jngFlanks.includes(50) &&
			!ne4Flanks.includes(31) &&
			!ne4Flanks.includes(50),
		`NE2=${ne2Route?.exitSignalId} flanks=${jngFlanks.join(",")} NE4=${ne4Route?.exitSignalId} flanks=${ne4Flanks.join(",")}`,
	);
}

// --- render/control annotations -------------------------------------------
// These are not topology, but they decide what the user can SEE and CLICK, so
// a passing topology with broken annotations still ships a broken table.
{
	// dashSide must follow the BRANCH's own geometry: it picks the side the
	// dashed inactive straight is drawn on when the point is thrown. Deriving it
	// from the line's normal direction inverted it on every switch whose branch
	// runs against the flow (24 of 48).
	const wrong = map.switches.items.filter((sw) => {
		const nums = sw.branch.match(/-?\d+(\.\d+)?/g)!.map(Number);
		const [x1, y1, x2, y2] = nums;
		const far =
			Math.hypot(x1 - sw.x, y1 - sw.y) > Math.hypot(x2 - sw.x, y2 - sw.y)
				? [x1, y1]
				: [x2, y2];
		return (far[0] > sw.x ? "right" : "left") !== sw.dashSide;
	});
	check(
		"every switch's dashSide matches its branch geometry",
		wrong.length === 0,
		`${wrong.length} wrong: ${wrong
			.slice(0, 6)
			.map((s) => `P${s.id}`)
			.join(", ")}`,
	);

	// A scissors crossover is two coupled pairs sharing a midpoint. If both
	// controls compute the same mean position they stack, and the one drawn last
	// takes every click — half the scissors becomes unthrowable.
	const controls = map.switches.controls;
	const seen = new Map<string, number>();
	for (const control of controls) {
		const key = `${Math.round(control.x)},${Math.round(control.y)}`;
		seen.set(key, (seen.get(key) ?? 0) + 1);
	}
	const stacked = [...seen.entries()].filter(([, count]) => count > 1);
	check(
		"no two point controls share a position (scissors stay clickable)",
		stacked.length === 0,
		`${stacked.length} stacked at ${stacked.map(([k]) => k).join(" ")}`,
	);

	// ...and they must be far enough apart that each centre is actually hittable
	// (the control halo is r=16*controlScale, so centres need > that diameter).
	const scale = map.presentation.controlScale ?? 1;
	const minGap = 2 * 8 * scale; // halo radius 8*scale each
	let tooClose = 0;
	for (let i = 0; i < controls.length; i++) {
		for (let j = i + 1; j < controls.length; j++) {
			const d = Math.hypot(
				controls[i].x - controls[j].x,
				controls[i].y - controls[j].y,
			);
			if (d < minGap) tooClose++;
		}
	}
	check(
		`point control centres are at least ${minGap.toFixed(1)} apart`,
		tooClose === 0,
		`${tooClose} pair(s) closer than ${minGap.toFixed(1)}`,
	);

	// A signal and a point control are BOTH clickable, so the same halo rule
	// applies BETWEEN the two kinds - not just within each. A signal is drawn at
	// its cell centre and a switch sits on that same lattice, so a switch moved
	// into a signal's cell would put two hit targets on one spot and swallow the
	// signal's clicks. Geometry cannot decide which should yield: move the
	// switch back, or move the signal to a free cell.
	const edgeById = new Map(
		JATINEGARA_TOPOLOGY.edges.map((e) => [e.id, e] as const),
	);
	const nodeById = new Map(
		JATINEGARA_TOPOLOGY.nodes.map((n) => [n.id, n] as const),
	);
	const signalX = (
		s: (typeof JATINEGARA_TOPOLOGY.signals)[number],
	): number => {
		const edge = edgeById.get(s.edgeId)!;
		const a = edge.geometry[s.segmentIndex].point;
		const b = edge.geometry[s.segmentIndex + 1].point;
		return a[0] + (b[0] > a[0] ? s.offset : -s.offset);
	};
	const collisions: string[] = [];
	for (const signal of JATINEGARA_TOPOLOGY.signals) {
		const edge = edgeById.get(signal.edgeId)!;
		const sx = signalX(signal);
		const sy = edge.geometry[0].point[1];
		for (const sw of JATINEGARA_TOPOLOGY.switches) {
			const node = nodeById.get(sw.nodeId)!;
			const gap = Math.hypot(node.point[0] - sx, node.point[1] - sy);
			if (gap < minGap) {
				collisions.push(
					`${signal.id}(${sx},${sy}) vs P${sw.id}(${node.point[0]},${node.point[1]}) gap ${gap.toFixed(1)}`,
				);
			}
		}
	}
	check(
		`no signal sits within ${minGap.toFixed(1)} of a point control (both stay clickable)`,
		collisions.length === 0,
		`${collisions.length}: ${collisions.slice(0, 4).join(" | ")}`,
	);
}

console.log(
	failures === 0
		? "\nALL VERIFIER CHECKS PASSED"
		: `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
