/*
 * bench-glyphs.js — Superscalar Bench point glyphs, one per model vendor.
 *
 * Shared by the static chart renderer (Node: require) and the interactive bench page (browser: window.BenchGlyphs),
 * so both draw the same mark for the same vendor. The shapes are simple geometric figures chosen to be told apart
 * at a glance — they are not, and do not reproduce, any company's logo.
 *
 *   anthropic  six-ray star       openai  hexagon       google  four-point sparkle
 *   xai        bold X             (other) circle
 *
 * API
 *   BenchGlyphs.path(vendor, size, cx = 0, cy = 0) → SVG path data for a glyph whose outer radius is `size`, centred at (cx, cy)
 *   BenchGlyphs.style(state, color, size) → { fill, stroke, strokeWidth }
 *       state 'filled'  = reached on the first answer in every run of the cell (one-shot)
 *       state 'outline' = needed a refinement round in some run, or did not reach
 *   BenchGlyphs.VENDORS → [{ id, name, glyph }]
 *   BenchGlyphs.vendorOf(modelId) → vendor id ('anthropic' | 'openai' | 'google' | 'xai' | 'other')
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BenchGlyphs = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VENDORS = [
    { id: 'anthropic', name: 'Anthropic', glyph: 'six-ray star' },
    { id: 'openai', name: 'OpenAI', glyph: 'hexagon' },
    { id: 'google', name: 'Google', glyph: 'four-point sparkle' },
    { id: 'xai', name: 'xAI', glyph: 'bold X' },
    { id: 'other', name: 'Other', glyph: 'circle' },
  ];
  function vendorOf(model) {
    var m = String(model || '');
    return /^claude/.test(m) ? 'anthropic' : /^gpt/.test(m) ? 'openai' : /^gemini/.test(m) ? 'google' : /^grok/.test(m) ? 'xai' : 'other';
  }
  function fmt(n) { return (Math.round(n * 100) / 100).toString(); }
  // Unit shapes: arrays of [x, y] on a radius-1 circle, y down (SVG), first vertex at the top.
  function star(points, inner) {
    var v = [];
    for (var i = 0; i < points * 2; i++) {
      var r = i % 2 === 0 ? 1 : inner, a = -Math.PI / 2 + (i * Math.PI) / points;
      v.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    return v;
  }
  function polygon(sides) {
    var v = [];
    for (var i = 0; i < sides; i++) { var a = -Math.PI / 2 + (i * 2 * Math.PI) / sides; v.push([Math.cos(a), Math.sin(a)]); }
    return v;
  }
  function boldX(halfWidth) {
    // a plus sign with arms of half-width w, rotated 45 degrees
    var w = halfWidth, l = 1, plus = [[-w, -l], [w, -l], [w, -w], [l, -w], [l, w], [w, w], [w, l], [-w, l], [-w, w], [-l, w], [-l, -w], [-w, -w]];
    var c = Math.SQRT1_2;
    return plus.map(function (p) { return [(p[0] - p[1]) * c, (p[0] + p[1]) * c]; });
  }
  var SHAPES = {
    anthropic: star(6, 0.42),
    openai: polygon(6),
    google: star(4, 0.34),
    xai: boldX(0.24),
  };
  // Visual weight differs by shape; scale each so they read as the same size next to a circle of the same radius.
  var SCALE = { anthropic: 1.12, openai: 0.96, google: 1.18, xai: 0.98, other: 0.86 };
  function path(vendor, size, cx, cy) {
    cx = cx || 0; cy = cy || 0;
    var id = SHAPES[vendor] || vendor === 'other' ? vendor : 'other';
    var r = size * (SCALE[id] || 1);
    if (id === 'other' || !SHAPES[id]) {
      return 'M' + fmt(cx - r) + ',' + fmt(cy) + 'a' + fmt(r) + ',' + fmt(r) + ' 0 1,0 ' + fmt(2 * r) + ',0a' + fmt(r) + ',' + fmt(r) + ' 0 1,0 ' + fmt(-2 * r) + ',0Z';
    }
    return SHAPES[id].map(function (p, i) { return (i ? 'L' : 'M') + fmt(cx + p[0] * r) + ',' + fmt(cy + p[1] * r); }).join('') + 'Z';
  }
  function style(state, color, size) {
    var sw = Math.max(1.5, (size || 6) * 0.32);
    return state === 'filled' ? { fill: color, stroke: color, strokeWidth: sw } : { fill: '#ffffff', stroke: color, strokeWidth: sw };
  }
  return { VENDORS: VENDORS, vendorOf: vendorOf, path: path, style: style };
});
