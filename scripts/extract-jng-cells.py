"""Rebuild the generator's input (jng_cells.json) from the committed drawing.

`gen-jatinegara.py` reads a JSON dump of the draw.io cells. That dump used to
live in /tmp and is not reproducible after a reboot, which made the generator
un-runnable. The draw.io source is embedded in the SVG export's `content`
attribute, so the dump can be rebuilt from the file we actually commit.

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
