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
 *
 *   Result, in the order of `labels`:
 *     x, y          TOP-LEFT corner of the label box (the box is w × h from `labels`)
 *     anchorEffort  the effort of the point the name belongs to — chosen per model, not always the top effort
 *     leader        true only when no free spot exists near any of the model's points: draw a line from the
 *                   anchor point to the box
 *   A model with no points gets x = y = null and anchorEffort = null.
 *
 * Method: every candidate box (each point of the model × each ring × eight directions) gets a fixed cost (covering
 *   markers of any model, covering `avoid`, leaving bounds = discarded, line crossings, distance, needing a leader),
 *   then labels are placed greedily — most constrained first — adding the overlap with labels already placed, and
 *   improved by re-placing each label against all the others until nothing changes. No randomness: the processing
 *   order comes from the geometry and the model ids, never from array order, so the same input gives the same result.
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

  // Liang–Barsky: does segment (ax,ay)-(bx,by) touch the box?
  function segHitsBox(ax, ay, bx, by, r) {
    var dx = bx - ax, dy = by - ay, t0 = 0, t1 = 1;
    var p = [-dx, dx, -dy, dy], q = [ax - r.x0, r.x1 - ax, ay - r.y0, r.y1 - ay];
    for (var i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return false; continue; }
      var t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
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
    var segs = [];
    if (USE_LINES) {
      Object.keys(byModel).forEach(function (m) {
        var ps = byModel[m];
        for (var s = 1; s < ps.length; s++) segs.push([ps[s - 1].x, ps[s - 1].y, ps[s].x, ps[s].y]);
      });
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
            var cost = 0, area;
            for (var mi = 0; mi < markers.length; mi++) { area = overlapArea(b, markers[mi]); if (area > 0) cost += W_MARK + area * W_MARK_AREA; }
            for (var vi = 0; vi < avoid.length; vi++) { area = overlapArea(b, avoid[vi]); if (area > 0) cost += W_AVOID + area * W_AVOID_AREA; }
            if (segs.length) {
              var cross = 0;
              for (var si = 0; si < segs.length && cross < CROSS_CAP; si++) { var sg = segs[si]; if (segHitsBox(sg[0], sg[1], sg[2], sg[3], b)) cross++; }
              cost += cross * W_CROSS;
            }
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

    return items.map(function (it) {
      if (it.pick < 0) return { model: labels[it.li].model, anchorEffort: null, x: null, y: null, leader: false };
      var c = it.cands[it.pick];
      return { model: labels[it.li].model, anchorEffort: c.anchor.effort, x: c.box.x0, y: c.box.y0, leader: c.leader };
    });
  }

  return { place: place, overlapArea: overlapArea };
});
