"""Dump the drawn geometry (jng_cells.json) from the committed drawing.

RETAINED after Phase 9 Step 7 deleted `gen-jatinegara.py`. Jatinegara is now
authored as pieces in `app/pieces/jatinegara.ts`, so nothing generates code
from this dump any more. It is kept because it is the only way to recover what
the draw.io source ACTUALLY says: the drawing is the provenance for the
layout's coordinates, and this is how you check the pieces against it.

That check is not hypothetical - it is what established that the committed
extents match the drawing exactly, including the fragmented tracks 5 and 6,
and so that Step 6's premise (stub tracks wrongly extended to the map
boundary) had already been fixed in Phase 8.

The draw.io source is embedded in the SVG export's `content` attribute, so the
dump can be rebuilt from the file we actually commit.

Usage:
    py -3 scripts/extract-jng-cells.py            # -> /tmp/jng_cells.json
    py -3 scripts/extract-jng-cells.py out.json
"""
import html
import json
import re
import sys
import xml.etree.ElementTree as ET

SVG = "app/schematic/jng_grid.svg"


def main(out_path):
    raw = open(SVG, encoding="utf-8").read()
    match = re.search(r'content="([^"]*)"', raw)
    if not match:
        raise SystemExit(f"no embedded draw.io content in {SVG}")

    # the attribute is HTML-escaped (possibly twice) draw.io XML
    xml = html.unescape(match.group(1))
    if "&lt;" in xml:
        xml = html.unescape(xml)

    root = ET.fromstring(xml)
    rows = []
    for cell in root.iter("mxCell"):
        geometry = cell.find("mxGeometry")
        source_point = target_point = None
        if geometry is not None:
            for point in geometry.findall("mxPoint"):
                as_attr = point.get("as")
                coords = [point.get("x", "0"), point.get("y", "0")]
                if as_attr == "sourcePoint":
                    source_point = coords
                elif as_attr == "targetPoint":
                    target_point = coords
        rows.append({
            "id": cell.get("id"),
            "edge": cell.get("edge") == "1",
            "sp": source_point,
            "tp": target_point,
        })

    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(rows, handle)
    edges = sum(1 for r in rows if r["edge"] and r["sp"] and r["tp"])
    print(f"wrote {out_path}: {len(rows)} cells, {edges} usable edges")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/jng_cells.json")
