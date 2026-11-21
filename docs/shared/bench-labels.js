/*
 * bench-labels.js — model-name label placement for the Superscalar Bench trust-cost chart.
 *
 * One pure function shared by the interactive bench page (browser: window.BenchLabels) and the static chart renderer
 * (Node: require), so both put a model's name in the same kind of place.
 *
 * API
 *   BenchLabels.place({ points, labels, bounds, avoid, opts }) → [{ model, anchorEffort, x, y, leader }]
 *
 *   points  [{ model, effort, x, y }]   marker centres, in output coordinates. Give each model's points in effort order:
 *                                       the connecting line is taken to run through them in that order, and on an exact
 *                                       cost tie the later (higher-effort) point wins.
 *   labels  [{ model, w, h }]           one label box per model (w × h in output units).
 *   bounds  { x0, y0, x1, y1 }          every label box is kept inside this rectangle.
 *   avoid   [{ x0, y0, x1, y1 }]        extra rectangles no label may cover (legend, insets, ...). Optional.
 *   opts    { markerR = 7, gap = 3, rings = [0, 8, 20, 36, 56, 80], leaderFrom = 20, passes = 6, lines = true }
 *             markerR   half-size of the square kept clear around every marker (all models)
 *             gap       clearance between a marker square and its label at ring 0
 *             rings     extra distances tried around each anchor point
 *             leaderFrom  boxes placed at a ring >= this need a leader line
 *             lines     count label/line crossings as a secondary cost (lines = each model's points in the given order)
 *             dropCovering  (default false) a label whose best spot still covers a marker gets no spot (x = y = null,
 *                       dropped = true); each dropped label then gets one more try at a spot that covers neither a
 *                       marker nor a placed label, since dropping the others may have freed one
 *
 *   Result, in the order of `labels`:
 *     x, y          TOP-LEFT corner of the label box (the box is w × h from `labels`)
 *     anchorEffort  the effort of the point the name belongs to — chosen per model, not always the top effort
 *     leader        true only when no free spot exists near any of the model's points: draw a line from the
 *                   anchor point to the box
 *   A model with no points gets x = y = null and anchorEffort = null (and so does a label left out by dropCovering).
 *
 * Method: every candidate box (each point of the model × each ring × eight directions) gets a fixed cost (covering
 *   markers of any model, covering `avoid`, leaving bounds = discarded, line crossings, distance, needing a leader),
 *   then labels are placed greedily — most constrained first — adding the overlap with labels already placed, and
 *   improved by re-placing each label against all the others until nothing changes. No randomness: the processing
 *   order comes from the geometry and the model ids, never from array order, so the same input gives the same result.
 *   The fixed costs are looked up through a uniform grid over markers and line segments; that only skips tests that
 *   cannot add anything, so every cost (and therefore every placement and tie) is the one a test against everything gives.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BenchLabels = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Weights. Order of importance: label/label overlap and `avoid` > covering a marker > needing a leader >
  //   crossing lines (capped) > distance. A leader therefore appears only when every nearby spot covers something.
  var W_LABEL = 100000, W_LABEL_AREA = 100;
  var W_AVOID = 100000, W_AVOID_AREA = 100;
  var W_MARK = 20000, W_MARK_AREA = 50;
  var W_LEADER = 2000;
  var W_CROSS = 250, CROSS_CAP = 6;
  var W_DIST = 2;

  var DIRS = ['E', 'NE', 'SE', 'W', 'NW', 'SW', 'N', 'S'];

  function overlapArea(a, b) {
    var w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
    if (w <= 0) return 0;
    var h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return h <= 0 ? 0 : w * h;
  }

  // Liang–Barsky: does segment (ax,ay)-(bx,by) touch the box? The four edge tests run in the fixed order x0, x1, y0, y1;
  //   no per-call arrays (it runs for every candidate box × nearby segment).
  function segHitsBox(ax, ay, bx, by, r) {
    var dx = bx - ax, dy = by - ay, t0 = 0, t1 = 1, p, q, t;
    for (var i = 0; i < 4; i++) {
      if (i === 0) { p = -dx; q = ax - r.x0; }
      else if (i === 1) { p = dx; q = r.x1 - ax; }
      else if (i === 2) { p = -dy; q = ay - r.y0; }
      else { p = dy; q = r.y1 - ay; }
      if (p === 0) { if (q < 0) return false; continue; }
      t = q / p;
      if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return true;
  }

  function boxAt(dir, px, py, w, h, r, k) {
    var d = r + k, dd = r * 0.5 + k;
    switch (dir) {
      case 'E': return [px + d, py - h / 2];
      case 'W': return [px - d - w, py - h / 2];
      case 'N': return [px - w / 2, py - d - h];
      case 'S': return [px - w / 2, py + d];
      case 'NE': return [px + dd, py - dd - h];
      case 'NW': return [px - dd - w, py - dd - h];
      case 'SE': return [px + dd, py + dd];
      default: return [px - dd - w, py + dd]; // SW
    }
  }

  function fin(v) { return typeof v === 'number' && isFinite(v); }
  function cmpStr(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  function place(input) {
    input = input || {};
    var points = input.points || [], labels = input.labels || [], bounds = input.bounds, avoid = input.avoid || [];
    var o = input.opts || {};
    var R = o.markerR != null ? o.markerR : 7;
    var GAP = o.gap != null ? o.gap : 3;
    var RINGS = o.rings || [0, 8, 20, 36, 56, 80];
    var LEADER_FROM = o.leaderFrom != null ? o.leaderFrom : 20;
    var PASSES = o.passes != null ? o.passes : 6;
    var USE_LINES = o.lines !== false;
    if (!bounds) bounds = { x0: -Infinity, y0: -Infinity, x1: Infinity, y1: Infinity };

    // points per model, in the given (effort) order
    var byModel = {};
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (!(isFinite(p.x) && isFinite(p.y))) continue;
      (byModel[p.model] = byModel[p.model] || []).push(p);
    }
    var markers = points.filter(function (p) { return isFinite(p.x) && isFinite(p.y); })
      .map(function (p) { return { x0: p.x - R, y0: p.y - R, x1: p.x + R, y1: p.y + R }; });
    // segments with their bounding boxes; SEG_EPS = the distance beyond which a bounding-box test rules a hit out (see below)
    var segs = [], segMax = 0;
    if (USE_LINES) {
      Object.keys(byModel).forEach(function (m) {
        var ps = byModel[m];
        for (var s = 1; s < ps.length; s++) {
          var ax = ps[s - 1].x, ay = ps[s - 1].y, bx = ps[s].x, by = ps[s].y;
          segs.push([ax, ay, bx, by, Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by)]);
          segMax = Math.max(segMax, Math.abs(ax), Math.abs(ay), Math.abs(bx), Math.abs(by));
        }
      });
    }
    var SEG_EPS = 1e-6 * (1 + segMax);

    // Spatial grid (speed only: every box gets the same fixed cost as testing it against every marker and every segment).
    //   Markers and segments are filed under the GS × GS cells their bounding boxes touch (a segment's widened by SEG_EPS),
    //   and a box is tested only against what is filed under the cells it touches. The cell index is a non-decreasing
    //   function of the coordinate, so two intervals that share a point share a cell: nothing that could touch the box is
    //   left out. What is left out adds nothing: a marker without positive overlap adds 0, and a segment more than SEG_EPS
    //   away from the box cannot pass segHitsBox. Marker costs are then added in the original marker order (a floating-point
    //   sum depends on it), and the crossing count is min(hits, CROSS_CAP) in any order. A non-numeric or non-finite
    //   coordinate (in the grid's input or in a box) or an inverted box is tested against everything instead.
    var gridOK = true, gx0 = Infinity, gy0 = Infinity, gx1 = -Infinity, gy1 = -Infinity;
    function extend(x0, y0, x1, y1) {
      if (!(fin(x0) && fin(y0) && fin(x1) && fin(y1))) { gridOK = false; return; }
      if (x0 < gx0) gx0 = x0; if (y0 < gy0) gy0 = y0; if (x1 > gx1) gx1 = x1; if (y1 > gy1) gy1 = y1;
    }
    markers.forEach(function (m) { extend(m.x0, m.y0, m.x1, m.y1); });
    segs.forEach(function (s) { if (!(fin(s[0]) && fin(s[1]) && fin(s[2]) && fin(s[3]))) gridOK = false; extend(s[4] - SEG_EPS, s[5] - SEG_EPS, s[6] + SEG_EPS, s[7] + SEG_EPS); });
    var GS = 32, GW = 1, GH = 1;
    if (gridOK && gx0 !== Infinity) {
      GS = Math.max(32, (gx1 - gx0) / 128, (gy1 - gy0) / 128);
      GW = Math.floor((gx1 - gx0) / GS) + 1; GH = Math.floor((gy1 - gy0) / GS) + 1;
      if (!(fin(GS) && fin(GW) && fin(GH))) { gridOK = false; GS = 32; GW = 1; GH = 1; }   // a span too large for doubles
    }
    var cellM = [], cellS = [];                                   // dense, one slot per cell (null = empty)
    for (var ci = 0; ci < GW * GH; ci++) { cellM.push(null); cellS.push(null); }
    function gcx(x) { var c = Math.floor((x - gx0) / GS); return c < 0 ? 0 : c >= GW ? GW - 1 : c; }
    function gcy(y) { var c = Math.floor((y - gy0) / GS); return c < 0 ? 0 : c >= GH ? GH - 1 : c; }
    function file(cells, idx, x0, y0, x1, y1) {
      for (var r = gcy(y0), r1 = gcy(y1); r <= r1; r++) for (var c = gcx(x0), c1 = gcx(x1); c <= c1; c++) { var key = r * GW + c; (cells[key] || (cells[key] = [])).push(idx); }
    }
    if (gridOK) {
      markers.forEach(function (m, i) { file(cellM, i, m.x0, m.y0, m.x1, m.y1); });
      segs.forEach(function (s, i) { file(cellS, i, s[4] - SEG_EPS, s[5] - SEG_EPS, s[6] + SEG_EPS, s[7] + SEG_EPS); });
    }
    var stampM = new Int32Array(markers.length), stampS = new Int32Array(segs.length), stamp = 0;
    var hitM = new Int32Array(markers.length), hitS = new Int32Array(segs.length);
    function sortHead(arr, n) { for (var i = 1; i < n; i++) { var v = arr[i], j = i - 1; while (j >= 0 && arr[j] > v) { arr[j + 1] = arr[j]; j--; } arr[j + 1] = v; } }
    // fixed cost of one box: markers, `avoid`, line crossings — the same sums as the plain loops in the fallback branch
    function fixedCost(b) {
      var cost = 0, area, mi, si, cross = 0, sg;
      if (gridOK && fin(b.x0) && fin(b.y0) && fin(b.x1) && fin(b.y1) && b.x1 >= b.x0 && b.y1 >= b.y0) {
        var c0 = gcx(b.x0), c1 = gcx(b.x1), r0 = gcy(b.y0), r1 = gcy(b.y1), nm = 0, ns = 0, r, c, list, q;
        stamp++;
        for (r = r0; r <= r1; r++) for (c = c0; c <= c1; c++) {
          list = cellM[r * GW + c];
          if (list) for (q = 0; q < list.length; q++) { mi = list[q]; if (stampM[mi] !== stamp) { stampM[mi] = stamp; hitM[nm++] = mi; } }
          if (segs.length) { list = cellS[r * GW + c]; if (list) for (q = 0; q < list.length; q++) { si = list[q]; if (stampS[si] !== stamp) { stampS[si] = stamp; hitS[ns++] = si; } } }
        }
        sortHead(hitM, nm);
        for (q = 0; q < nm; q++) { area = overlapArea(b, markers[hitM[q]]); if (area > 0) cost += W_MARK + area * W_MARK_AREA; }
        for (var vi = 0; vi < avoid.length; vi++) { area = overlapArea(b, avoid[vi]); if (area > 0) cost += W_AVOID + area * W_AVOID_AREA; }
        if (segs.length) {
          for (q = 0; q < ns && cross < CROSS_CAP; q++) { sg = segs[hitS[q]]; if (segHitsBox(sg[0], sg[1], sg[2], sg[3], b)) cross++; }
          cost += cross * W_CROSS;
        }
        return cost;
      }
      for (mi = 0; mi < markers.length; mi++) { area = overlapArea(b, markers[mi]); if (area > 0) cost += W_MARK + area * W_MARK_AREA; }
      for (var vj = 0; vj < avoid.length; vj++) { area = overlapArea(b, avoid[vj]); if (area > 0) cost += W_AVOID + area * W_AVOID_AREA; }
      if (segs.length) {
        for (si = 0; si < segs.length && cross < CROSS_CAP; si++) { sg = segs[si]; if (segHitsBox(sg[0], sg[1], sg[2], sg[3], b)) cross++; }
        cost += cross * W_CROSS;
      }
      return cost;
    }

    // candidate boxes with their fixed cost
    var items = labels.map(function (lab, li) {
      var anchors = byModel[lab.model] || [];
      var cands = [];
      for (var ai = anchors.length - 1; ai >= 0; ai--) {           // top effort first: wins exact ties
        var a = anchors[ai];
        for (var ri = 0; ri < RINGS.length; ri++) {
          var k = GAP + RINGS[ri];
          for (var di = 0; di < DIRS.length; di++) {
            var tl = boxAt(DIRS[di], a.x, a.y, lab.w, lab.h, R, k);
            var b = { x0: tl[0], y0: tl[1], x1: tl[0] + lab.w, y1: tl[1] + lab.h };
            if (b.x0 < bounds.x0 || b.y0 < bounds.y0 || b.x1 > bounds.x1 || b.y1 > bounds.y1) continue;
            var cost = fixedCost(b);
            var leader = RINGS[ri] >= LEADER_FROM;
            if (leader) cost += W_LEADER;
            cost += RINGS[ri] * W_DIST + di * 0.25 + (anchors.length - 1 - ai) * 0.01;
            cands.push({ box: b, cost: cost, anchor: a, leader: leader });
          }
        }
      }
      // nothing fits inside bounds: fall back to the first spot of the top point, pulled inside
      if (!cands.length && anchors.length) {
        var top = anchors[anchors.length - 1];
        var t2 = boxAt('E', top.x, top.y, lab.w, lab.h, R, GAP);
        var x0 = Math.max(bounds.x0, Math.min(t2[0], bounds.x1 - lab.w)), y0 = Math.max(bounds.y0, Math.min(t2[1], bounds.y1 - lab.h));
        var fb = { x0: x0, y0: y0, x1: x0 + lab.w, y1: y0 + lab.h };
        var far = Math.hypot(Math.max(fb.x0 - top.x, 0, top.x - fb.x1), Math.max(fb.y0 - top.y, 0, top.y - fb.y1)) > R + GAP + LEADER_FROM;
        cands.push({ box: fb, cost: 0, anchor: top, leader: far });
      }
      var free = 0;
      for (var c = 0; c < cands.length; c++) if (cands[c].cost < W_LEADER) free++;
      var cx = anchors.length ? anchors[anchors.length - 1].x : 0, cy = anchors.length ? anchors[anchors.length - 1].y : 0;
      return { li: li, model: String(lab.model), cands: cands, free: free, cx: cx, cy: cy, pick: -1 };
    });

    // most constrained first; ties by position then model id — never by array order
    var order = items.filter(function (it) { return it.cands.length; }).sort(function (a, b) {
      return (a.free - b.free) || (a.cx - b.cx) || (a.cy - b.cy) || cmpStr(a.model, b.model);
    });

    function dynCost(it, box) {
      var cost = 0;
      for (var j = 0; j < order.length; j++) {
        var other = order[j];
        if (other === it || other.pick < 0) continue;
        var area = overlapArea(box, other.cands[other.pick].box);
        if (area > 0) cost += W_LABEL + area * W_LABEL_AREA;
      }
      return cost;
    }
    function best(it) {
      var bi = -1, bc = Infinity;
      for (var c = 0; c < it.cands.length; c++) {
        var cand = it.cands[c];
        if (cand.cost >= bc) continue;                         // fixed cost alone already worse
        var total = cand.cost + dynCost(it, cand.box);
        if (total < bc) { bc = total; bi = c; }
      }
      return { i: bi, cost: bc };
    }

    for (var g = 0; g < order.length; g++) order[g].pick = best(order[g]).i;
    for (var pass = 0; pass < PASSES; pass++) {
      var changed = false;
      for (var h = 0; h < order.length; h++) {
        var it = order[h];
        var cur = it.cands[it.pick].cost + dynCost(it, it.cands[it.pick].box);
        var nb = best(it);
        if (nb.i >= 0 && nb.i !== it.pick && nb.cost < cur - 1e-9) { it.pick = nb.i; changed = true; }
      }
      if (!changed) break;
    }

    // checked only here, for the picked box and the retried ones: the candidate loop above is the hot path
    function covers(box) { for (var mi = 0; mi < markers.length; mi++) if (overlapArea(box, markers[mi]) > 0) return true; return false; }
    if (o.dropCovering) {
      var dropped = order.filter(function (it) { return it.pick >= 0 && covers(it.cands[it.pick].box); });
      dropped.forEach(function (it) { it.pick = -1; it.dropped = true; });
      dropped.forEach(function (it) {                          // same most-constrained order as above
        var bi = -1, bc = Infinity;
        for (var c = 0; c < it.cands.length; c++) {
          var cand = it.cands[c];
          if (cand.cost >= bc || covers(cand.box) || dynCost(it, cand.box) > 0) continue;
          bc = cand.cost; bi = c;
        }
        if (bi >= 0) { it.pick = bi; it.dropped = false; }
      });
    }

    return items.map(function (it) {
      if (it.pick < 0) return { model: labels[it.li].model, anchorEffort: null, x: null, y: null, leader: false, dropped: !!it.dropped };
      var c = it.cands[it.pick];
      return { model: labels[it.li].model, anchorEffort: c.anchor.effort, x: c.box.x0, y: c.box.y0, leader: c.leader };
    });
  }

  return { place: place, overlapArea: overlapArea };
});
