#!/usr/bin/env python3
"""Generate app/topologies/jatinegara.ts from the parsed draw.io geometry.

Model (documented deviations in the file header):
  - every horizontal line runs full-width [32,1120] and is split at each
    junction x; the drawing's stub tracks (platforms 5-8) are extended to the
    boundaries so every junction keeps a through axis (common/normal);
  - each drawn diagonal is a crossover edge, reversed at BOTH endpoint
    switches (reciprocal);
  - each signal's protected block = its line in the facing direction to the
    next same-direction signal or the boundary (open end).
"""
import json
from collections import defaultdict

cells = json.load(open("/tmp/jng_cells.json"))

def f(v):
    return float(v)

segs = []
for r in cells:
    if r["edge"] and r["sp"] and r["tp"]:
        segs.append(((f(r["sp"][0]), f(r["sp"][1])), (f(r["tp"][0]), f(r["tp"][1]))))

diags = [(a, b) for (a, b) in segs if a[1] != b[1]]

junc = defaultdict(set)
for (a, b) in diags:
    junc[a[1]].add(a[0])
    junc[b[1]].add(b[0])

# line: (y, groupId, normalDirection, bidirectional, xmin, xmax)
# the drawing has 6 tracks per map boundary + 8 through the platform area;
# platforms 5-8 are stubs that end at throat junctions (Phase 8 drawn extents).
Y_LINES = [
    (496, "t1", "right", False, 32, 1120),
    (464, "t2", "left", True, 32, 1120),
    (432, "t3", "right", False, 32, 1120),
    (400, "t4", "left", False, 32, 1120),
    (368, "t5", "left", True, 336, 528),
    (336, "t6", "right", True, 32, 592),
    (304, "t7", "left", True, 32, 688),
    (272, "t8", "left", True, 224, 528),
    # east-throat fragments (short stub mains of their own)
    (368, "t5ap", "right", False, 1040, 1120),
    (336, "t6am", "right", False, 1008, 1120),
    (368, "t5ac", "right", False, 752, 976),
    (368, "t5y", "right", False, 624, 656),
    (336, "t6ab", "right", False, 688, 720),
]
BOUND = [32.0, 1120.0]

nodes = []      # {id, x, y, kind}
edges = []      # {id, from, to, geom, role, group}
switches = []   # {id, nodeId, common, normal, reversed}
groups = []     # {id, role, edgeIds, ndir?, bidir?}
signals = []    # {id, edgeId, seg, offset, facing, label, block}
sections = []   # {id, signalId, ranges, openEnd?}
stops = []

NODE = [0]
def node(x, y, kind="boundary"):
    NODE[0] += 1
    nid = f"n{NODE[0]}"
    nodes.append({"id": nid, "x": x, "y": y, "kind": kind})
    return nid

def jnode(y, x):
    nid = f"s{y:.0f}x{x:.0f}"
    if not any(n["id"] == nid for n in nodes):
        nodes.append({"id": nid, "x": x, "y": y, "kind": "switch"})
    return nid

# ---- horizontal lines ------------------------------------------------------
line_edges = {}   # (y, xa, xb) -> eid
group_edges = {gid: [] for (y, gid, _, _, _, _) in Y_LINES}
for (y, gid, ndir, bidir, xmin, xmax) in Y_LINES:
    xs = [x for x in sorted(set(junc[y]) | set(BOUND)) if xmin <= x <= xmax]
    if xs[0] != xmin:
        xs = [xmin] + xs
    if xs[-1] != xmax:
        xs = xs + [xmax]
    # the line's end nodes: a junction node when a diagonal attaches there,
    # else a plain boundary node
    def end_node(x):
        if x in junc[y]:
            return jnode(y, x)
        return node(x, y)
    west = end_node(xmin)
    prev_n = west
    prev_x = xmin
    for x in xs[1:]:
        nxt_n = end_node(xmax) if x == xmax else jnode(y, x)
        eid = f"e-{gid}-{prev_x:.0f}-{x:.0f}"
        edges.append({"id": eid, "from": prev_n, "to": nxt_n,
                      "geom": [(prev_x, y), (x, y)], "role": "main", "group": gid})
        line_edges[(y, prev_x, x)] = eid
        group_edges[gid].append(eid)
        prev_n = nxt_n
        prev_x = x

# ---- diagonals -------------------------------------------------------------
diag_edge_at = {}   # (y, x) -> (eid, end)
for idx, ((a, b)) in enumerate(diags):
    gid = f"xov{idx + 1}"
    na = jnode(a[1], a[0])
    nb = jnode(b[1], b[0])
    eid = f"d-{gid}"
    edges.append({"id": eid, "from": na, "to": nb,
                  "geom": [(a[0], a[1]), (b[0], b[1])], "role": "crossover", "group": gid})
    diag_edge_at[(a[1], a[0])] = (eid, "from")
    diag_edge_at[(b[1], b[0])] = (eid, "to")
    groups.append({"id": gid, "role": "crossover", "edgeIds": [eid]})

# ---- switches --------------------------------------------------------------
sw = 0
for (y, gid, _, _, xmin, xmax) in Y_LINES:
    for xj in sorted(junc[y]):
        if not (xmin <= xj <= xmax):
            continue
        sw += 1
        nid = jnode(y, xj)
        west_in = next((e for (ly, xa, xb), e in line_edges.items() if ly == y and xb == xj), None)
        east_out = next((e for (ly, xa, xb), e in line_edges.items() if ly == y and xa == xj), None)
        (d, dend) = diag_edge_at[(y, xj)]
        if west_in is None or east_out is None:
            # Phase 8 fix: a stub-end junction is a FIXED track turn — no switch
            continue
        common, normal = west_in, east_out
        cend, nend = "to", "from"
        switches.append({
            "id": sw, "nodeId": nid,
            "common": {"edgeId": common, "end": cend},
            "normal": {"edgeId": normal, "end": nend},
            "reversed": {"edgeId": d, "end": dend},
        })

# demote junction nodes with no switch to plain joins (fixed track turns)
for n in nodes:
    if n["kind"] == "switch" and not any(sw["nodeId"] == n["id"] for sw in switches):
        n["kind"] = "boundary"

# main groups (stub tracks + east-throat fragments each their own group)
for (y, gid, ndir, bidir, xmin, xmax) in Y_LINES:
    g = {"id": gid, "role": "main", "edgeIds": group_edges[gid], "normalDirection": ndir}
    if bidir:
        g["bidirectional"] = True
    groups.append(g)

# ---- signals ---------------------------------------------------------------
SIGS = [
    # id, x, y, facing ("right" = east-facing, "left" = west-facing)
    ("NW1", 78, 496, "right"), ("NW3", 110, 432, "right"),
    ("NW5", 110, 336, "right"), ("NW7", 270, 272, "right"),
    ("NE2", 1070, 464, "left"), ("NE4", 1070, 400, "left"),
    ("NE5", 1070, 368, "left"), ("NE6", 1070, 336, "left"),
    ("XW2", 398, 464, "left"), ("XW3", 398, 432, "left"),
    ("XW4", 398, 400, "left"), ("XW5", 398, 368, "left"),
    ("XW6", 366, 336, "left"), ("XW7", 366, 304, "left"), ("XW8", 366, 272, "left"),
    ("XE1", 590, 496, "right"), ("XE2", 590, 464, "right"),
    ("XE3", 590, 432, "right"), ("XE4", 590, 400, "right"),
    ("XE5", 494, 368, "right"), ("XE6", 494, 336, "right"),
    ("XE7", 494, 304, "right"), ("XE8", 494, 272, "right"),
]
# per-line, find the containing edge for a signal x
def edge_containing(y, x):
    for (ly, xa, xb), eid in line_edges.items():
        if ly == y and xa <= x <= xb:
            return eid, xa, xb
    raise ValueError(f"no edge for signal at ({x},{y})")

for (sid, x, y, facing) in SIGS:
    eid, xa, xb = edge_containing(y, x)
    signals.append({
        "id": sid, "edgeId": eid, "seg": 0, "offset": x - xa,
        "facing": "toward-to" if facing == "right" else "toward-from",
        "label": sid, "block": False, "blockSection": f"section-{sid}",
    })

# ---- block sections --------------------------------------------------------
SIG_X = {sid: x for (sid, x, y, facing) in SIGS}

SIG_GROUP = {}
for (sid, x, y, facing) in SIGS:
    eid, _, _ = edge_containing(y, x)
    SIG_GROUP[sid] = next(g["id"] for g in groups if any(eid == e for e in g["edgeIds"]))

def next_signal(sid, x, y, facing):
    gid = SIG_GROUP[sid]
    cands = [(SIG_X[s], s) for (s, sx, sy, sf) in [(i, SIG_X[i], yy, ff) for (i, xx, yy, ff) in SIGS]
             if SIG_GROUP[s] == gid and sf == facing and s != sid]
    if facing == "right":
        ahead = [(sx, s) for (sx, s) in cands if sx > x]
        return min(ahead)[1] if ahead else None
    else:
        ahead = [(sx, s) for (sx, s) in cands if sx < x]
        return max(ahead)[1] if ahead else None

for (sid, x, y, facing) in SIGS:
    to_east = facing == "right"
    sig_gid = SIG_GROUP[sid]
    sig_edge, sig_xa, sig_xb = edge_containing(y, x)
    nxt = next_signal(sid, x, y, facing)
    if nxt:
        nxa, nxb = edge_containing(y, SIG_X[nxt])[1:]
    # ordered edges of the signal's OWN track group (a stub track's section
    # stays within the stub — it cannot span the throat gaps)
    edges_dir = []
    for eid in group_edges[sig_gid]:
        for (ly, exa, exb), le in line_edges.items():
            if le != eid:
                continue
            if to_east:
                if exa >= sig_xa and (nxt is None or exb <= nxb):
                    edges_dir.append((exa, exb, eid))
            else:
                if (nxt is None or exa >= nxa) and exb <= sig_xb:
                    edges_dir.append((exa, exb, eid))
    edges_dir.sort(key=lambda t: t[0], reverse=not to_east)
    ranges = []
    for k, (exa, exb, eid) in enumerate(edges_dir):
        if to_east:
            fr = {"kind": "signal", "signalId": sid} if k == 0 else {"kind": "edge-end", "end": "from"}
            to = {"kind": "signal", "signalId": nxt} if (nxt is not None and k == len(edges_dir) - 1) else {"kind": "edge-end", "end": "to"}
        else:
            fr = {"kind": "signal", "signalId": sid} if k == 0 else {"kind": "edge-end", "end": "to"}
            to = {"kind": "signal", "signalId": nxt} if (nxt is not None and k == len(edges_dir) - 1) else {"kind": "edge-end", "end": "from"}
        ranges.append({"edgeId": eid, "from": fr, "to": to})
    if nxt is None:
        ranges[0]["from"] = {"kind": "signal", "signalId": sid}
        sections.append({"id": f"section-{sid}", "signalId": sid, "ranges": ranges,
                         "openEnd": "east" if to_east else "west"})
    else:
        sections.append({"id": f"section-{sid}", "signalId": sid, "ranges": ranges})

# ---- Phase 8 fix: coupled point pairs (PC1..PC20) + terminating switches to
# remove (they are fixed track turns, not controllable points) -----------------
COUPLED_PAIRS = [
    (1, 6), (7, 15), (16, 26), (25, 17), (46, 41),
    (40, 47), (42, 27), (48, 52), (28, 38), (2, 9),
    (8, 3), (10, 18), (20, 11), (30, 19), (32, 21),
    (22, 13), (12, 4), (14, 5), (23, 33), (24, 35),
]
REMOVED_SWITCHES = {37, 39, 53, 45, 51, 56, 57, 58, 55, 54}
COUPLED_BY_SW = {}
for pc, (a, b) in enumerate(COUPLED_PAIRS, 1):
    COUPLED_BY_SW[a] = f"PC{pc}"
    COUPLED_BY_SW[b] = f"PC{pc}"

# ---- stations --------------------------------------------------------------
STOPS = [
    ("JNG", "t1", 850), ("JNG", "t2", 464), ("JNG", "t3", 464), ("JNG", "t4", 464),
    ("JNG", "t5", 416), ("JNG", "t6", 430), ("JNG", "t7", 400), ("JNG", "t8", 400),
]
for (code, gid, x) in STOPS:
    y = next(yy for (yy, gg, _, _, _, _) in Y_LINES if gg == gid)
    eid, xa, xb = edge_containing(y, x)
    stops.append({"code": code, "edgeId": eid, "seg": 0, "offset": x - xa})
# boundary pseudo-stations at each line's REACHABLE extent (the stub tracks
# end at their drawn extents — per-line X under one station code)
for (yy, gid, _, _, xmin, xmax) in Y_LINES:
    wx = xmin + 8
    ex = xmax - 8
    eid, xa, xb = edge_containing(yy, wx)
    stops.append({"code": "JNG-W", "edgeId": eid, "seg": 0, "offset": wx - xa})
    eid, xa, xb = edge_containing(yy, ex)
    stops.append({"code": "JNG-E", "edgeId": eid, "seg": 0, "offset": ex - xa})

# ---- emit ------------------------------------------------------------------
def ts_repr(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        return f'"{v}"'
    if isinstance(v, list):
        return "[" + ", ".join(ts_repr(x) for x in v) + "]"
    if isinstance(v, dict):
        return "{ " + ", ".join(f"{k}: {ts_repr(v2)}" for k, v2 in v.items()) + " }"
    raise TypeError(type(v))

out = []
out.append("// Auto-generated from app/schematic/jng_grid.svg (draw.io export).")
out.append("// Jatinegara station — 8 platform tracks + 29 crossovers (the throat).")
out.append("// Deviations from the drawing (first cut): the stub platform tracks 5-8 are")
out.append("// extended to the map boundaries so every junction keeps a through axis;")
out.append("// each signal's block opens at its line end (exact throat block boundaries")
out.append("// need confirmation); timetable is a stub.")
out.append("import type { TopologyDefinition } from \"../lib/topology\";")
out.append("")
out.append("const section = (signalId: string) => `section-${signalId}`;")
out.append("")
out.append("export const JATINEGARA_TOPOLOGY: TopologyDefinition = {")
out.append("  nodes: [")
for n in nodes:
    out.append(f"    {{ id: {ts_repr(n['id'])}, point: [{ts_repr(n['x'])}, {ts_repr(n['y'])}], kind: {ts_repr(n['kind'])} }},")
out.append("  ],")
out.append("  edges: [")
slot = [-1]
for e in edges:
    geom = ", ".join(f"{{ point: [{ts_repr(a)}, {ts_repr(b)}] }}" for (a, b) in e["geom"])
    slot[0] += 1
    out.append(f"    {{ id: {ts_repr(e['id'])}, from: {ts_repr(e['from'])}, to: {ts_repr(e['to'])}, geometry: [{geom}], role: {ts_repr(e['role'])}, trackGroupId: {ts_repr(e['group'])}, renderSlots: [{slot[0]}] }},")
out.append("  ],")
out.append("  switches: [")
for sw in switches:
    cgid = COUPLED_BY_SW.get(sw['id'], f"g{sw['id']}")
    lbl = COUPLED_BY_SW.get(sw['id'], f"sw {sw['id']}")
    out.append(f"    {{ id: {sw['id']}, nodeId: {ts_repr(sw['nodeId'])}, common: {ts_repr(sw['common'])}, normal: {ts_repr(sw['normal'])}, reversed: {ts_repr(sw['reversed'])}, initialState: \"normal\", controlGroupId: {ts_repr(cgid)}, dashSide: \"left\", label: {ts_repr(lbl)} }},")
out.append("  ],")
out.append("  controlGroups: [")
for pc, (a, b) in enumerate(COUPLED_PAIRS, 1):
    out.append(f"    {{ id: {ts_repr(f'PC{pc}')}, switchIds: [{a}, {b}], coupled: true }},")
for sw in switches:
    if sw['id'] in COUPLED_BY_SW:
        continue
    out.append(f"    {{ id: {ts_repr(f'g{sw['id']}')}, switchIds: [{sw['id']}], coupled: false }},")
out.append("  ],")
out.append("  signals: [")
for sg in signals:
    out.append(f"    {{ id: {ts_repr(sg['id'])}, edgeId: {ts_repr(sg['edgeId'])}, segmentIndex: 0, offset: {ts_repr(sg['offset'])}, facing: {ts_repr(sg['facing'])}, mount: \"up\", label: {ts_repr(sg['label'])}, protectedBlockSectionId: section({ts_repr(sg['id'])}) }},")
out.append("  ],")
out.append("  trackGroups: [")
for g in groups:
    extra = ""
    if g["role"] == "main":
        extra += f", normalDirection: {ts_repr(g['normalDirection'])}"
    if g.get("bidirectional"):
        extra += ", bidirectional: true"
    out.append(f"    {{ id: {ts_repr(g['id'])}, role: {ts_repr(g['role'])}, edgeIds: {ts_repr(g['edgeIds'])}{extra} }},")
out.append("  ],")
out.append("  blockSections: [")
for sec in sections:
    rngs = ", ".join(ts_repr(r) for r in sec["ranges"])
    extra = f', legacyOpenEnd: {ts_repr(sec["openEnd"])}' if sec.get("openEnd") else ""
    out.append(f"    {{ id: section({ts_repr(sec['signalId'])}), signalId: {ts_repr(sec['signalId'])}, coverage: \"signal-to-boundary\", edgeRanges: [{rngs}]{extra} }},")
out.append("  ],")
out.append("  stationStopPoints: [")
for sp in stops:
    out.append(f"    {{ stationCode: {ts_repr(sp['code'])}, edgeId: {ts_repr(sp['edgeId'])}, segmentIndex: 0, offset: {ts_repr(sp['offset'])} }},")
out.append("  ],")
out.append("  legacyNodeOrder: [")
for n in nodes:
    out.append(f"    {ts_repr(n['id'])}, ")
out.append("  ],")
out.append("};")

open("app/topologies/jatinegara.ts", "w", encoding="utf-8").write("\n".join(out))
print("wrote", len(nodes), "nodes,", len(edges), "edges,", len(switches), "switches,", len(signals), "signals,", len(sections), "sections,", len(groups), "groups")
