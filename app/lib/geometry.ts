// ---------------------------------------------------------------------------
// Shared polyline geometry for the movement engine and the dispatching UI.
//
// Two segments/route-polylines conflict iff they share a POSITIVE-LENGTH
// portion (collinear overlap or a proper crossing). Meeting at a single point
// (a block boundary, a switch point) is NOT a conflict. This is the exact
// convention the reservation clash checks have always used; Phase 5 reuses it
// for occupancy and train-body conflict so every check agrees.
// ---------------------------------------------------------------------------

export const segsOverlap = (a: [number, number][], b: [number, number][]): boolean => {
  const [p1, p2] = a;
  const [q1, q2] = b;
  const cross = (o: [number, number], p: [number, number], q: [number, number]) =>
    (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const c1 = cross(p1, p2, q1);
  const c2 = cross(p1, p2, q2);
  if (Math.abs(c1) > 0.5 || Math.abs(c2) > 0.5) {
    // not collinear — proper crossing?
    const c3 = cross(q1, q2, p1);
    const c4 = cross(q1, q2, p2);
    return c1 * c2 < 0 && c3 * c4 < 0;
  }
  // collinear — overlap along the dominant axis
  const ax = Math.abs(p2[0] - p1[0]);
  const proj = (pt: [number, number]) => (ax >= Math.abs(p2[1] - p1[1]) ? pt[0] : pt[1]);
  const lo = Math.max(Math.min(proj(p1), proj(p2)), Math.min(proj(q1), proj(q2)));
  const hi = Math.min(Math.max(proj(p1), proj(p2)), Math.max(proj(q1), proj(q2)));
  return hi - lo > 0.5;
};

/** Whether two route/body polylines share any positive-length track portion. */
export const routesOverlap = (a: [number, number][], b: [number, number][]): boolean => {
  for (let i = 0; i + 1 < a.length; i++) {
    for (let j = 0; j + 1 < b.length; j++) {
      if (segsOverlap([a[i], a[i + 1]], [b[j], b[j + 1]])) return true;
    }
  }
  return false;
};

/** Whether ANY piece of one footprint overlaps ANY piece of the other. */
export const footprintsOverlap = (
  a: [number, number][][],
  b: [number, number][][]
): boolean => {
  for (const piece of a) {
    for (const other of b) {
      if (routesOverlap(piece, other)) return true;
    }
  }
  return false;
};

/** Whether ANY piece of a multi-piece footprint overlaps the polyline. */
export const polylinesOverlap = (
  footprint: [number, number][][],
  polyline: [number, number][]
): boolean => {
  for (const piece of footprint) {
    if (routesOverlap(piece, polyline)) return true;
  }
  return false;
};
