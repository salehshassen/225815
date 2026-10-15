/* Award configurator core: one parameter set -> geometry, artwork, and every export.
   Pure functions (no DOM). Units: millimetres. Model space: x right, y up, origin = plaque bottom centre (= base top). */
(function (root) {
'use strict';
const Core = {};
const deps = { opentype: root.opentype, earcut: root.earcut };
Core.setDeps = d => Object.assign(deps, d);
Core.VERSION = '0.3.0';

/* ---------------- Manufacturing rules (prototype defaults, all pending confirmation) ---------------- */
Core.DEFAULT_RULES = {
  thicknesses: [8, 10, 12, 15, 20],
  plaqueWMin: 60, plaqueWMax: 400, plaqueHMin: 80, plaqueHMax: 450,
  artMargin: 8, minText: 3,
  slotDepth: 12, clrT: 0.4, clrL: 0.6, pocketGap: 0.5, toolR: 1.5, shoulder: 6, minTab: 25,
  minFloor: 6, minWall: 8, baseHMin: 15, baseHMax: 80, tipFactor: 0.18, freeMinT: 15,
  tolPlaque: 0.3, tolBase: 0.5, curveTol: 0.05
};
Core.RULE_GROUPS = [
  ['material', ['thicknesses']],
  ['size', ['plaqueWMin', 'plaqueWMax', 'plaqueHMin', 'plaqueHMax']],
  ['artwork', ['artMargin', 'minText']],
  ['base', ['slotDepth', 'clrT', 'clrL', 'pocketGap', 'toolR', 'shoulder', 'minTab', 'minFloor', 'minWall', 'baseHMin', 'baseHMax', 'tipFactor', 'freeMinT']],
  ['tolerance', ['tolPlaque', 'tolBase', 'curveTol']]
];
// Canonical, validated rule set (same key order everywhere, so reference IDs match between browser and server).
Core.normalizeRules = function (r) {
  const D = Core.DEFAULT_RULES, out = {};
  for (const k of Object.keys(D)) {
    const v = r && r[k];
    if (k === 'thicknesses') out[k] = Array.isArray(v) && v.length && v.every(x => typeof x === 'number' && x > 0 && x <= 100) ? [...new Set(v)].sort((a, b) => a - b) : D[k].slice();
    else out[k] = (typeof v === 'number' && isFinite(v) && v >= 0 && v <= 2000) ? v : D[k];
  }
  const bad = out.plaqueWMin >= out.plaqueWMax || out.plaqueHMin >= out.plaqueHMax || out.baseHMin >= out.baseHMax || out.curveTol <= 0 || out.curveTol > 1 || out.tipFactor > 1;
  return bad ? JSON.parse(JSON.stringify(D)) : out;
};
Core.SHAPES = ['rectangle', 'arch', 'shield', 'flame'];
// Customer size presets: plaque width x plaque height ABOVE the base (mm). Clamped to the active rules.
Core.SIZE_PRESETS = { small: { W: 120, H: 160 }, medium: { W: 150, H: 200 }, large: { W: 200, H: 260 } };
Core.presetSize = function (name, R) {
  R = R || Core.DEFAULT_RULES; const p = Core.SIZE_PRESETS[name]; if (!p) return null;
  return { W: Math.min(Math.max(p.W, R.plaqueWMin), R.plaqueWMax), H: Math.min(Math.max(p.H, R.plaqueHMin), R.plaqueHMax) };
};
// Size reference only (preview). Source: Apple iPhone 13 Tech Specs, support.apple.com/111872
Core.PHONE = { name: 'iPhone 13', h: 146.7, w: 71.5, d: 7.65 };
Core.BASE_MATERIALS = ['black', 'clear', 'frosted', 'wood'];

Core.defaultParams = () => ({
  shape: 'arch', sizePreset: 'medium', W: 150, H: 200, t: 12,
  base: { type: 'slot', auto: true, W: 180, D: 55, H: 30, material: 'black' },
  text: { heading: 'شهادة شكر وتقدير', name: 'م. سارة العتيبي', body: 'تقديرا لجهودكم المتميزة\nوعطائكم المخلص خلال عام 2026', footer: 'الرياض — أكتوبر 2026' },
  textScale: 1, logoScale: 1, logo: null,
  finish: { method: 'laser', side: 'front', color: '#1d2433' },
  meta: { customer: '', org: '', qty: 1, notes: '' }
});
Core.EXAMPLES = {
  ar: { heading: 'شهادة شكر وتقدير', name: 'م. سارة العتيبي', body: 'تقديرا لجهودكم المتميزة\nوعطائكم المخلص خلال عام 2026', footer: 'الرياض — أكتوبر 2026' },
  en: { heading: 'Certificate of Appreciation', name: 'Eng. Sara Al-Otaibi', body: 'In recognition of your outstanding\ncontribution throughout 2026', footer: 'Riyadh, October 2026' }
};

/* ---------------- small utils ---------------- */
const fmt = v => String(parseFloat((+v).toFixed(2)));
Core.fmt = fmt;
const ceilTo = (v, s) => Math.ceil(v / s - 1e-9) * s;
function hash(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(-7); }
Core.hash = hash;

/* ---------------- curve flattening ---------------- */
function dedupe(pts) {
  const out = [];
  for (const p of pts) { const q = out[out.length - 1]; if (!q || Math.abs(q[0] - p[0]) > 1e-7 || Math.abs(q[1] - p[1]) > 1e-7) out.push(p); }
  while (out.length > 1) { const a = out[0], z = out[out.length - 1]; if (Math.abs(a[0] - z[0]) < 1e-7 && Math.abs(a[1] - z[1]) < 1e-7) out.pop(); else break; }
  return out;
}
function flattenCmds(cmds, tol) {
  const subs = []; let cur = null, px = 0, py = 0;
  for (const c of cmds) {
    if (c.t === 'M') { cur = [[c.x, c.y]]; subs.push(cur); px = c.x; py = c.y; }
    else if (c.t === 'L') { cur.push([c.x, c.y]); px = c.x; py = c.y; }
    else if (c.t === 'Q') {
      const M = 2 * Math.hypot(px - 2 * c.x1 + c.x, py - 2 * c.y1 + c.y);
      const n = Math.max(1, Math.min(64, Math.ceil(Math.sqrt(M / (8 * tol)))));
      for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; cur.push([u * u * px + 2 * u * t * c.x1 + t * t * c.x, u * u * py + 2 * u * t * c.y1 + t * t * c.y]); }
      px = c.x; py = c.y;
    } else if (c.t === 'C') {
      const M = 6 * Math.max(Math.hypot(px - 2 * c.x1 + c.x2, py - 2 * c.y1 + c.y2), Math.hypot(c.x1 - 2 * c.x2 + c.x, c.y1 - 2 * c.y2 + c.y));
      const n = Math.max(1, Math.min(256, Math.ceil(Math.sqrt(M / (8 * tol)))));
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
        cur.push([a * px + b * c.x1 + d * c.x2 + e * c.x, a * py + b * c.y1 + d * c.y2 + e * c.y]);
      }
      px = c.x; py = c.y;
    } else if (c.t === 'A') {
      const sw = c.a1 - c.a0, step = 2 * Math.acos(Math.max(-1, 1 - tol / c.r));
      const n = Math.max(2, Math.ceil(Math.abs(sw) / step));
      for (let i = 1; i <= n; i++) { const a = c.a0 + sw * i / n; cur.push([c.cx + c.r * Math.cos(a), c.cy + c.r * Math.sin(a)]); }
      px = c.cx + c.r * Math.cos(c.a1); py = c.cy + c.r * Math.sin(c.a1);
    }
  }
  return subs.map(dedupe).filter(s => s.length >= 3);
}
Core.flattenCmds = flattenCmds;
function area(p) { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] * p[i][1] - p[i][0] * p[j][1]); return a / 2; }
function bbox(pts) { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return { x0, y0, x1, y1 }; }
Core.area = area; Core.bbox = bbox;

/* ---------------- polygon distance field (for usable-area checks) ---------------- */
function makeDist(poly) {
  const n = poly.length, ax = new Float64Array(n), ay = new Float64Array(n), bx = new Float64Array(n), by = new Float64Array(n);
  for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; ax[i] = a[0]; ay[i] = a[1]; bx[i] = b[0]; by[i] = b[1]; }
  return function (x, y) { // signed distance, positive inside
    let best = Infinity, inside = false;
    for (let i = 0; i < n; i++) {
      const x1 = ax[i], y1 = ay[i], x2 = bx[i], y2 = by[i];
      if (((y1 > y) !== (y2 > y)) && (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1)) inside = !inside;
      const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
      let t = L ? ((x - x1) * dx + (y - y1) * dy) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = x1 + t * dx - x, ey = y1 + t * dy - y, d = ex * ex + ey * ey;
      if (d < best) best = d;
    }
    best = Math.sqrt(best); return inside ? best : -best;
  };
}
function rectClearance(dist, x0, y0, x1, y1, step) {
  let m = Infinity;
  const nx = Math.max(1, Math.ceil((x1 - x0) / step)), ny = Math.max(1, Math.ceil((y1 - y0) / step));
  for (let i = 0; i <= nx; i++) { const x = x0 + (x1 - x0) * i / nx; m = Math.min(m, dist(x, y0), dist(x, y1)); }
  for (let j = 1; j < ny; j++) { const y = y0 + (y1 - y0) * j / ny; m = Math.min(m, dist(x0, y), dist(x1, y)); }
  return m;
}
// Row profile of the margin-inset region around the centre line x = 0
const profileCache = new Map();
function insetProfile(poly, key, margin, H) {
  const ck = key + '|' + margin;
  if (profileCache.has(ck)) return profileCache.get(ck);
  const dist = makeDist(poly), bb = bbox(poly), dy = 0.5, rows = [];
  for (let y = 0; y <= H + 1e-9; y += dy) {
    let L = 0, R = 0;
    if (dist(0, y) >= margin) {
      let lo = 0, hi = bb.x1; for (let k = 0; k < 16; k++) { const mid = (lo + hi) / 2; if (dist(mid, y) >= margin) lo = mid; else hi = mid; } R = lo;
      lo = 0; hi = -bb.x0; for (let k = 0; k < 16; k++) { const mid = (lo + hi) / 2; if (dist(-mid, y) >= margin) lo = mid; else hi = mid; } L = lo;
    }
    rows.push({ y, L, R });
  }
  const prof = { rows, dy, dist };
  if (profileCache.size > 40) profileCache.clear();
  profileCache.set(ck, prof); return prof;
}
function availHalf(prof, y0, y1) {
  let a = Infinity; const { rows, dy } = prof;
  const i0 = Math.max(0, Math.floor(y0 / dy)), i1 = Math.min(rows.length - 1, Math.ceil(y1 / dy));
  if (y0 < 0 || i1 < i0) return 0;
  for (let i = i0; i <= i1; i++) a = Math.min(a, rows[i].L, rows[i].R);
  return a === Infinity ? 0 : a;
}

/* ---------------- the four parametric shapes ---------------- */
function bottomHalf(shape, W, R) {
  if (shape === 'rectangle' || shape === 'arch') return W / 2;
  const need = (R.minTab + 2 * R.shoulder) / 2;
  const frac = shape === 'shield' ? 0.13 : 0.2;
  return Math.min(Math.max(frac * W, need), 0.42 * W);
}
function shapeCmds(shape, W, H, b) {
  const w = W / 2, L = (x, y) => ({ t: 'L', x, y }), C = (x1, y1, x2, y2, x, y) => ({ t: 'C', x1, y1, x2, y2, x, y });
  if (shape === 'rectangle') return [{ t: 'M', x: w, y: 0 }, L(w, H), L(-w, H), L(-w, 0)];
  if (shape === 'arch') {
    const h = Math.min(w, 0.5 * H), R = (h * h + w * w) / (2 * h), cy = H - R, a0 = Math.atan2(H - h - cy, w);
    return [{ t: 'M', x: w, y: 0 }, L(w, H - h), { t: 'A', cx: 0, cy, r: R, a0, a1: Math.PI - a0 }, L(-w, 0)];
  }
  if (shape === 'shield') {
    const rn = Math.min(0.12 * W, 0.1 * H), ys = 0.56 * H;
    return [{ t: 'M', x: b, y: 0 }, C(b + 0.16 * W, 0.03 * H, w, 0.25 * H, w, ys), L(w, H - rn),
      { t: 'A', cx: w, cy: H, r: rn, a0: -Math.PI / 2, a1: -Math.PI }, L(-w + rn, H),
      { t: 'A', cx: -w, cy: H, r: rn, a0: 0, a1: -Math.PI / 2 }, L(-w, ys), C(-w, 0.25 * H, -b - 0.16 * W, 0.03 * H, -b, 0)];
  }
  // flame
  return [{ t: 'M', x: b, y: 0 }, C(b + 0.18 * W, 0, w, 0.12 * H, w, 0.30 * H), C(w, 0.48 * H, 0.30 * W, 0.58 * H, 0.24 * W, 0.72 * H),
    C(0.18 * W, 0.85 * H, 0.16 * W, 0.93 * H, 0.10 * W, H), C(0.02 * W, 0.88 * H, -0.22 * W, 0.80 * H, -0.36 * W, 0.64 * H),
    C(-0.48 * W, 0.50 * H, -0.50 * W, 0.42 * H, -w, 0.30 * H), C(-w, 0.12 * H, -b - 0.18 * W, 0, -b, 0)];
}
Core.shapeOutline = function (shape, W, H, rules) {
  const R = rules || Core.DEFAULT_RULES, b = bottomHalf(shape, W, R);
  return flattenCmds(shapeCmds(shape, W, H, b), 0.2)[0];
};
const ZONES = { rectangle: [0, 1], arch: [0, 1], shield: [0.14, 1], flame: [0.05, 0.7] };

/* ---------------- Arabic / Latin text: bidi + shaping to outlines ---------------- */
let FONTS = null;
Core.initFonts = function (regBuf, boldBuf) {
  FONTS = { regular: deps.opentype.parse(regBuf), bold: deps.opentype.parse(boldBuf) };
  shapeCache.clear();
};
const isMark = cp => (cp >= 0x610 && cp <= 0x61A) || (cp >= 0x64B && cp <= 0x65F) || cp === 0x670 || (cp >= 0x6D6 && cp <= 0x6DC) || (cp >= 0x6DF && cp <= 0x6E4) || cp === 0x6E7 || cp === 0x6E8 || (cp >= 0x6EA && cp <= 0x6ED);
function btype(cp) {
  if (cp >= 0x30 && cp <= 0x39) return 'EN';
  if ((cp >= 0x660 && cp <= 0x669) || (cp >= 0x6F0 && cp <= 0x6F9)) return 'AN';
  if (isMark(cp)) return 'NSM';
  if (cp === 0x60C) return 'CS';
  if ((cp >= 0x600 && cp <= 0x6FF) || (cp >= 0x750 && cp <= 0x77F) || (cp >= 0x8A0 && cp <= 0x8FF) || (cp >= 0xFB50 && cp <= 0xFDFF) || (cp >= 0xFE70 && cp <= 0xFEFF)) return 'AL';
  if (cp === 0x20 || cp === 0x09 || cp === 0xA0) return 'WS';
  if (cp === 0x2C || cp === 0x2E || cp === 0x3A || cp === 0x2F) return 'CS';
  if (/[\p{L}\p{M}]/u.test(String.fromCodePoint(cp))) return 'L';
  return 'ON';
}
function bidi(cps) {
  const n = cps.length, orig = cps.map(btype), T = orig.slice();
  let base = 0; for (const t of T) { if (t === 'L') { base = 0; break; } if (t === 'AL') { base = 1; break; } }
  const sos = base ? 'R' : 'L';
  for (let i = 0; i < n; i++) if (T[i] === 'NSM') T[i] = i ? T[i - 1] : sos;
  let last = sos;
  for (let i = 0; i < n; i++) { const t = T[i]; if (t === 'L' || t === 'R' || t === 'AL') last = t; else if (t === 'EN' && last === 'AL') T[i] = 'AN'; }
  for (let i = 0; i < n; i++) if (T[i] === 'AL') T[i] = 'R';
  for (let i = 1; i < n - 1; i++) if (T[i] === 'CS' && (T[i - 1] === 'EN' || T[i - 1] === 'AN') && T[i - 1] === T[i + 1]) T[i] = T[i - 1];
  for (let i = 0; i < n; i++) if (T[i] === 'CS') T[i] = 'ON';
  last = sos;
  for (let i = 0; i < n; i++) { const t = T[i]; if (t === 'L' || t === 'R') last = t; else if (t === 'EN' && last === 'L') T[i] = 'L'; }
  const dirOf = t => t === 'L' ? 'L' : (t === 'R' || t === 'EN' || t === 'AN') ? 'R' : null;
  for (let i = 0; i < n;) {
    if (dirOf(T[i])) { i++; continue; }
    let j = i; while (j < n && !dirOf(T[j])) j++;
    const b4 = i > 0 ? dirOf(T[i - 1]) : sos, af = j < n ? dirOf(T[j]) : sos, d = b4 === af ? b4 : sos;
    for (let k = i; k < j; k++) T[k] = d; i = j;
  }
  const levels = T.map(t => base === 0 ? (t === 'R' ? 1 : (t === 'AN' || t === 'EN') ? 2 : 0) : ((t === 'L' || t === 'EN' || t === 'AN') ? 2 : 1));
  return { levels, base, orig };
}
const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '«': '»', '»': '«' };
const shapeCache = new Map();
// Shape one line at 1 mm font size. Returns path commands (y up, baseline at y=0, starting x=0), advance width, info.
function shapeLine(text, bold) {
  const key = (bold ? 'B|' : 'R|') + text;
  if (shapeCache.has(key)) return shapeCache.get(key);
  const font = bold ? FONTS.bold : FONTS.regular, upm = font.unitsPerEm;
  const cps = Array.from(text).map(c => c.codePointAt(0));
  const { levels, base, orig } = bidi(cps);
  const units = []; let cur = null;
  for (let i = 0; i < cps.length; i++) {
    const arabic = (orig[i] === 'AL' || orig[i] === 'NSM') && levels[i] % 2 === 1 && !(orig[i] === 'NSM' && i > 0 && orig[i - 1] !== 'AL' && orig[i - 1] !== 'NSM');
    if (arabic) { if (!cur) { cur = { s: '', level: levels[i], ar: true }; units.push(cur); } cur.s += String.fromCodePoint(cps[i]); }
    else { cur = null; units.push({ s: String.fromCodePoint(cps[i]), level: levels[i], ar: false }); }
  }
  // L2 reordering on units
  let arr = units.slice();
  if (arr.length) {
    const maxL = Math.max(...arr.map(u => u.level)); let minOdd = Math.min(...arr.map(u => u.level)); if (minOdd % 2 === 0) minOdd++;
    for (let L = maxL; L >= minOdd; L--) {
      let i = 0; while (i < arr.length) { if (arr[i].level >= L) { let j = i; while (j < arr.length && arr[j].level >= L) j++; arr = arr.slice(0, i).concat(arr.slice(i, j).reverse(), arr.slice(j)); i = j; } else i++; }
    }
  }
  const cmds = []; let x = 0, prev = null; const missing = new Set(); let hasMarks = false;
  for (const u of arr) {
    let glyphs;
    if (u.ar) { glyphs = font.stringToGlyphs(u.s); if ([...u.s].some(c => isMark(c.codePointAt(0)))) hasMarks = true; }
    else { const ch = (u.level % 2 === 1 && MIRROR[u.s]) ? MIRROR[u.s] : u.s; glyphs = [font.charToGlyph(ch)]; }
    for (const g of glyphs) {
      if (!g) continue;
      if (g.index === 0 && !/\s/.test(u.s)) missing.add(u.s);
      if (prev && !u.ar && !prev.ar) x += font.getKerningValue(prev.g, g) / upm;
      const p = g.getPath(x, 0, 1);
      for (const c of p.commands) {
        const o = { t: c.type };
        if (c.x !== undefined) { o.x = c.x; o.y = -c.y; }
        if (c.x1 !== undefined) { o.x1 = c.x1; o.y1 = -c.y1; }
        if (c.x2 !== undefined) { o.x2 = c.x2; o.y2 = -c.y2; }
        cmds.push(o);
      }
      x += (g.advanceWidth || 0) / upm;
      prev = { g, ar: u.ar };
    }
  }
  let ink = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const pts = []; for (const c of cmds) { if (c.x !== undefined) pts.push([c.x, c.y]); if (c.x1 !== undefined) pts.push([c.x1, c.y1]); if (c.x2 !== undefined) pts.push([c.x2, c.y2]); }
  if (pts.length) ink = bbox(pts);
  const res = { cmds, adv: x, ink, rtl: base === 1, missing: [...missing], hasMarks };
  if (shapeCache.size > 300) shapeCache.clear();
  shapeCache.set(key, res); return res;
}
Core.shapeLine = shapeLine;
// Place shaped line: scale s, horizontally centred at cx, baseline at by
function placeCmds(cmds, s, ox, oy) {
  return cmds.map(c => { const o = { t: c.t }; if (c.x !== undefined) { o.x = ox + c.x * s; o.y = oy + c.y * s; } if (c.x1 !== undefined) { o.x1 = ox + c.x1 * s; o.y1 = oy + c.y1 * s; } if (c.x2 !== undefined) { o.x2 = ox + c.x2 * s; o.y2 = oy + c.y2 * s; } return o; });
}
Core.placeCmds = placeCmds;
// Text as outlined primitives at a given size (used for drawing fields that may contain Arabic)
Core.textOutline = function (text, size, bold, x, y, anchor) {
  if (!FONTS || !text) return null;
  const sh = shapeLine(text, !!bold);
  const w = sh.adv * size, ox = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return { cmds: placeCmds(sh.cmds, size, ox, y), width: w };
};

/* ---------------- Build: parameters -> validated model ---------------- */
Core.build = function (P, R) {
  R = R || Core.DEFAULT_RULES;
  const msgs = [];
  const err = (code, vals, field) => msgs.push({ lv: 'error', code, vals: vals || {}, field });
  const warn = (code, vals, field) => msgs.push({ lv: 'warn', code, vals: vals || {}, field });
  const num = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;
  const shape = Core.SHAPES.includes(P.shape) ? P.shape : 'rectangle';
  let W = num(P.W, 150), H = num(P.H, 200);
  if (W < R.plaqueWMin || W > R.plaqueWMax) { err('E_W', { min: R.plaqueWMin, max: R.plaqueWMax }, 'W'); W = Math.min(Math.max(W, R.plaqueWMin), R.plaqueWMax); }
  if (H < R.plaqueHMin || H > R.plaqueHMax) { err('E_H', { min: R.plaqueHMin, max: R.plaqueHMax }, 'H'); H = Math.min(Math.max(H, R.plaqueHMin), R.plaqueHMax); }
  if (H / W > 4 || W / H > 3) warn('W_RATIO', {}, 'H');
  let t = num(P.t, 12);
  if (!R.thicknesses.includes(t)) { err('E_T', { list: R.thicknesses.join(', ') }, 't'); t = R.thicknesses.reduce((a, b) => Math.abs(b - t) < Math.abs(a - t) ? b : a, R.thicknesses[0]); }
  const b = bottomHalf(shape, W, R);
  const cmds = shapeCmds(shape, W, H, b);
  const vis = flattenCmds(cmds, R.curveTol)[0];
  const vbb = bbox(vis);
  const type = ['slot', 'bonded', 'none'].includes(P.base && P.base.type) ? P.base.type : 'slot';

  // connection + cut outline
  let tab = null, pocket = null;
  const cut = vis.slice();
  if (type === 'slot') {
    const s = R.slotDepth, tabW = 2 * b - 2 * R.shoulder;
    if (tabW < R.minTab - 1e-6) err('E_TAB', { w: fmt(tabW), min: R.minTab }, 'W');
    const tw = Math.max(tabW, 1);
    tab = { w: tw, d: s, shoulder: (2 * b - tw) / 2 };
    const Wp = t + R.clrT, rr = Math.min(R.toolR, Wp / 2), Lp = tw + R.clrL + 2 * rr, dp = s + R.pocketGap;
    pocket = { L: Lp, W: Wp, D: dp, r: rr };
    if (Lp > 2 * b + 1e-6) warn('W_POCKET_VISIBLE', {}, null);
    const tail = [];
    if (tw / 2 < b - 1e-6) tail.push([-tw / 2, 0]);
    tail.push([-tw / 2, -s], [tw / 2, -s]);
    if (tw / 2 < b - 1e-6) tail.push([tw / 2, 0]);
    cut.push(...tail);
  }
  // base
  let base = null;
  if (type !== 'none') {
    const minW = Math.max(type === 'slot' ? pocket.L + 2 * R.minWall : 2 * b, 2 * b);
    const minD = (type === 'slot' ? pocket.W : t) + 2 * R.minWall;
    const minH = Math.max(R.baseHMin, type === 'slot' ? pocket.D + R.minFloor : 0);
    let bw, bd, bh;
    if (P.base.auto) {
      bh = Math.max(30, ceilTo(minH, 5));
      bw = Math.max(ceilTo(W + 30, 5), ceilTo(minW, 5));
      bd = Math.max(50, ceilTo(minD, 5), ceilTo(R.tipFactor * (H + bh), 5));
    } else {
      bw = num(P.base.W, 180); bd = num(P.base.D, 55); bh = num(P.base.H, 30);
      if (bw < minW - 1e-6 || bw > 600) { err('E_BW', { min: fmt(Math.ceil(minW)), max: 600 }, 'baseW'); bw = Math.min(Math.max(bw, minW), 600); }
      if (bd < minD - 1e-6 || bd > 300) { err('E_BD', { min: fmt(Math.ceil(minD)), max: 300 }, 'baseD'); bd = Math.min(Math.max(bd, minD), 300); }
      if (bh < minH - 1e-6 || bh > R.baseHMax) { err('E_BH', { min: fmt(Math.ceil(minH)), max: R.baseHMax }, 'baseH'); bh = Math.min(Math.max(bh, minH), R.baseHMax); }
    }
    base = { W: bw, D: bd, H: bh, material: Core.BASE_MATERIALS.includes(P.base.material) ? P.base.material : 'black', minW, minD, minH };
  }
  const Ht = H + (base ? base.H : 0);
  if (base && base.D < R.tipFactor * Ht - 1e-6) warn('W_TIP', { d: fmt(ceilTo(R.tipFactor * Ht, 1)) }, 'baseD');
  if (type === 'none') {
    if (t < R.freeMinT) err('E_FREE_T', { min: R.freeMinT }, 't');
    else if (t < 0.07 * H) warn('W_TIP_FREE', {}, 't');
  }

  const model = {
    shape, W, H, t, b, Ht, type, base, tab, pocket, cmds, vis, cut, vbb,
    finish: Object.assign({ method: 'laser', side: 'front', color: '#1d2433' }, P.finish || {}),
    msgs, rules: R
  };
  model.art = layoutArtwork(model, P, R, warn, err);
  model.errors = msgs.filter(m => m.lv === 'error');
  model.warnings = msgs.filter(m => m.lv === 'warn');
  return model;
};

const ROLES = { heading: { f: 0.068, bold: true }, name: { f: 0.088, bold: true }, body: { f: 0.047, bold: false }, footer: { f: 0.04, bold: false } };
function layoutArtwork(M, P, R, warn, err) {
  const items = [];
  const tx = P.text || {};
  const add = (role, s, idx) => { s = (s || '').replace(/\s+/g, ' ').trim(); if (s) items.push({ kind: 'text', role, text: s, idx }); };
  add('heading', tx.heading); add('name', tx.name);
  String(tx.body || '').split(/\r?\n/).forEach((l, i) => add('body', l, i));
  add('footer', tx.footer);
  const logo = P.logo && P.logo.pxW ? P.logo : null;
  if (!items.length && !logo) { warn('W_EMPTY', {}, 'text'); return { items: [], logo: null, prof: null }; }
  if (!FONTS) return { items: [], logo: null, prof: null };
  const m = R.artMargin, zf = ZONES[M.shape];
  const prof = insetProfile(M.vis, `${M.shape}|${M.W}|${M.H}|${R.curveTol}`, m, M.H);
  const z0 = zf[0] * M.H + m, z1 = zf[1] * M.H - m, zoneH = Math.max(1, z1 - z0);
  const ref = Math.min(M.W, 0.85 * M.H), ts = Math.min(1.5, Math.max(0.5, +P.textScale || 1));
  const missing = new Set(); let marks = false;
  for (const it of items) {
    const r = ROLES[it.role]; it.bold = r.bold; it.base = r.f * ref * ts;
    it.sh = shapeLine(it.text, r.bold); it.f = 1;
    it.sh.missing.forEach(c => missing.add(c)); if (it.sh.hasMarks) marks = true;
    it.asc = Math.max(0.8, it.sh.ink.y1); it.desc = Math.max(0.42, -it.sh.ink.y0);
  }
  if (missing.size) warn('W_GLYPH', { chars: [...missing].join(' ') }, 'text');
  if (marks) warn('W_MARKS', {}, 'text');
  const gapBefore = (it, prev) => {
    if (!prev) return 0;
    if (prev.kind === 'logo') return 0.55 * it.base;
    if (it.role === prev.role) return 0.28 * it.base;
    if (it.role === 'footer') return 0.9 * it.base;
    return 0.6 * it.base;
  };
  let lg = null;
  if (logo) {
    const asp = logo.pxW / logo.pxH, ls = Math.min(1.6, Math.max(0.4, +P.logoScale || 1));
    let h = Math.min(0.24 * zoneH, 0.45 * M.W / asp) * ls;
    if (!items.length) h = Math.min(0.5 * zoneH, 0.6 * M.W / asp) * ls;
    lg = { kind: 'logo', asp, base: h, f: 1 };
  }
  const seq = lg ? [lg, ...items] : items.slice();
  let g = 1;
  for (let iter = 0; iter < 14; iter++) {
    let T = 0, prev = null;
    for (const it of seq) {
      if (it.kind === 'logo') it.h = Math.max(6, it.base * g * it.f), it.boxH = it.h;
      else { it.size = Math.max(R.minText, it.base * g * it.f); it.boxH = (it.asc + it.desc) * it.size; }
      it.gap = prev ? gapBefore(it, prev) * g : 0; T += it.gap + it.boxH; prev = it;
    }
    if (T > zoneH * 1.001 && g > 0.05) { g *= Math.max(0.5, zoneH / T * 0.995); continue; }
    let y = (z0 + z1) / 2 + T / 2, changed = false;
    for (const it of seq) {
      y -= it.gap; const top = y, bot = y - it.boxH; y = bot;
      it.top = top; it.bot = bot;
      const av = availHalf(prof, bot, top);
      const w = it.kind === 'logo' ? it.h * it.asp : it.sh.adv * it.size;
      if (w / 2 > av + 1e-6) {
        const nf = it.f * Math.max(0.05, (2 * av) / w) * 0.995;
        const atMin = it.kind === 'text' && it.size <= R.minText + 1e-9;
        if (!atMin && nf < it.f - 1e-4) { it.f = nf; changed = true; }
      }
    }
    if (!changed) break;
  }
  // final placement + verification against the real outline
  const dist = prof.dist, step = Math.min(2, m / 2);
  const outItems = []; let logoOut = null;
  for (const it of seq) {
    if (it.kind === 'logo') {
      const w = it.h * it.asp, box = { x0: -w / 2, y0: it.bot, x1: w / 2, y1: it.top };
      logoOut = { x: box.x0, y: box.y0, w, h: it.h, box };
      const c = rectClearance(dist, box.x0, box.y0, box.x1, box.y1, step);
      logoOut.state = c < -0.01 ? 'out' : c < m - 0.05 ? 'margin' : 'ok';
      if (logoOut.state === 'out') err('E_LOGO_OUT', {}, 'logo'); else if (logoOut.state === 'margin') warn('W_LOGO_MARGIN', { m }, 'logo');
      const mm = w / 25.4, dpi = logo.svg ? Infinity : logo.pxW / mm;
      if (dpi < 250) warn('W_LOGO_DPI', { dpi: Math.round(dpi) }, 'logo');
      continue;
    }
    const s = it.size, w = it.sh.adv * s, base = it.top - it.asc * s;
    const ox = -w / 2;
    const cmds = placeCmds(it.sh.cmds, s, ox, base);
    const ink = { x0: ox + it.sh.ink.x0 * s, y0: base + it.sh.ink.y0 * s, x1: ox + it.sh.ink.x1 * s, y1: base + it.sh.ink.y1 * s };
    const c = rectClearance(dist, ink.x0, ink.y0, ink.x1, ink.y1, step);
    const state = c < -0.01 ? 'out' : c < m - 0.05 ? 'margin' : 'ok';
    const label = it.text.length > 28 ? it.text.slice(0, 26) + '…' : it.text;
    if (state === 'out') err('E_TEXT_OUT', { line: label }, 'text');
    else if (state === 'margin') warn('W_TEXT_MARGIN', { line: label, m }, 'text');
    outItems.push({ role: it.role, text: it.text, size: s, bold: it.bold, cmds, ink, state, rtl: it.sh.rtl, atMin: s <= R.minText + 1e-9 });
  }
  const tooMuch = seq.reduce((a, it) => a + it.gap + it.boxH, 0) > zoneH + 0.5;
  if (tooMuch) warn('W_TOO_MUCH', {}, 'text');
  if (outItems.some(i => i.atMin && i.state === 'ok')) warn('W_TEXT_MIN', { min: R.minText }, 'text');
  if (logo && /jpe?g/i.test(logo.mime || '')) warn('W_LOGO_BG', {}, 'logo');
  return { items: outItems, logo: logoOut, prof, zone: [z0, z1] };
}

/* ---------------- Usable area outline (for preview) ---------------- */
Core.safeOutline = function (M) {
  const p = M.art && M.art.prof; if (!p) return null;
  const rows = p.rows.filter(r => r.L > 0.5 && r.R > 0.5);
  if (rows.length < 2) return null;
  return rows.map(r => [r.R, r.y]).concat(rows.slice().reverse().map(r => [-r.L, r.y]));
};

/* ---------------- 3D mesh (STL coordinates: X right, Y depth, Z up) ---------------- */
function pushTri(out, a, b, c, n) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * n[0] + ny * n[1] + nz * n[2] < 0) { const t = b; b = c; c = t; }
  out.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
}
function capFace(out, outer, holes, map, n) {
  const flat = [], hi = [];
  for (const p of outer) flat.push(p[0], p[1]);
  for (const h of holes) { hi.push(flat.length / 2); for (const p of h) flat.push(p[0], p[1]); }
  const all = outer.concat(...holes);
  const idx = deps.earcut(flat, hi.length ? hi : null, 2);
  for (let i = 0; i < idx.length; i += 3) pushTri(out, map(all[idx[i]]), map(all[idx[i + 1]]), map(all[idx[i + 2]]), n);
}
function wall(out, loop, map, h0, h1, outward, nmap) { // loop CCW; outward=true: normal to the right of travel
  for (let i = 0; i < loop.length; i++) {
    const p = loop[i], q = loop[(i + 1) % loop.length];
    let nx = q[1] - p[1], ny = -(q[0] - p[0]); if (!outward) { nx = -nx; ny = -ny; }
    const n = nmap(nx, ny), a = map(p, h0), b = map(q, h0), c = map(q, h1), d = map(p, h1);
    pushTri(out, a, b, c, n); pushTri(out, a, c, d, n);
  }
}
Core.meshes = function (M) {
  const ccw = pts => area(pts) < 0 ? pts.slice().reverse() : pts;
  const plaque = [], t2 = M.t / 2;
  const loop = ccw(M.cut);
  // plaque outline lives in XZ; extrusion along Y
  capFace(plaque, loop, [], p => [p[0], -t2, p[1]], [0, -1, 0]);
  capFace(plaque, loop, [], p => [p[0], t2, p[1]], [0, 1, 0]);
  wall(plaque, loop, (p, h) => [p[0], h, p[1]], -t2, t2, true, (nx, ny) => [nx, 0, ny]);
  let base = null;
  if (M.base) {
    base = [];
    const { W, D, H } = M.base, rect = [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]];
    capFace(base, rect, [], p => [p[0], p[1], -H], [0, 0, -1]);
    wall(base, rect, (p, h) => [p[0], p[1], h], -H, 0, true, (nx, ny) => [nx, ny, 0]);
    if (M.pocket) {
      const pk = Core.pocketOutline(M);
      capFace(base, rect, [pk.slice().reverse()], p => [p[0], p[1], 0], [0, 0, 1]);
      wall(base, pk, (p, h) => [p[0], p[1], h], -M.pocket.D, 0, false, (nx, ny) => [nx, ny, 0]);
      capFace(base, pk, [], p => [p[0], p[1], -M.pocket.D], [0, 0, 1]);
    } else capFace(base, rect, [], p => [p[0], p[1], 0], [0, 0, 1]);
  }
  return { plaque: new Float32Array(plaque), base: base ? new Float32Array(base) : null };
};
Core.pocketOutline = function (M) { // CCW rounded rectangle in base XY plane
  const { L, W, r } = M.pocket, hx = L / 2 - r, hy = W / 2 - r, tol = M.rules.curveTol, pts = [];
  const corner = (cx, cy, a0) => { const step = 2 * Math.acos(Math.max(-1, 1 - tol / r)), n = Math.max(2, Math.ceil((Math.PI / 2) / step)); for (let i = 0; i <= n; i++) { const a = a0 + (Math.PI / 2) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  corner(hx, -hy, -Math.PI / 2); corner(hx, hy, 0); corner(-hx, hy, Math.PI / 2); corner(-hx, -hy, Math.PI);
  return dedupe(pts);
};

/* ---------------- SVG path helpers ---------------- */
function svgPathD(cmds, X, Y) {
  let d = ''; const n = v => (Math.round(v * 1000) / 1000);
  for (const c of cmds) {
    if (c.t === 'M') d += `M${n(X(c.x))} ${n(Y(c.y))}`;
    else if (c.t === 'L') d += `L${n(X(c.x))} ${n(Y(c.y))}`;
    else if (c.t === 'Q') d += `Q${n(X(c.x1))} ${n(Y(c.y1))} ${n(X(c.x))} ${n(Y(c.y))}`;
    else if (c.t === 'C') d += `C${n(X(c.x1))} ${n(Y(c.y1))} ${n(X(c.x2))} ${n(Y(c.y2))} ${n(X(c.x))} ${n(Y(c.y))}`;
    else if (c.t === 'Z') d += 'Z';
  }
  return d;
}
function polyD(pts, X, Y, close = true) { const n = v => Math.round(v * 1000) / 1000; return pts.map((p, i) => (i ? 'L' : 'M') + n(X(p[0])) + ' ' + n(Y(p[1]))).join('') + (close ? 'Z' : ''); }
Core.svgPathD = svgPathD; Core.polyD = polyD;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
Core.esc = esc;

/* ---------------- Engineering drawing as primitives (A3 landscape, mm, y down) ---------------- */
Core.SCALES = [[1, '1:1'], [0.5, '1:2'], [0.4, '1:2.5'], [0.25, '1:4'], [0.2, '1:5'], [0.1, '1:10']];
Core.drawing = function (M, P, info) {
  info = info || {};
  const S = { w: 420, h: 297, prims: [] }, pr = S.prims;
  const R = M.rules;
  const line = (x1, y1, x2, y2, w = 0.25, dash = null, c = '#000') => pr.push({ k: 'line', x1, y1, x2, y2, w, dash, c });
  const poly = (pts, w = 0.5, dash = null, fill = null, closed = true, c = '#000') => pr.push({ k: 'poly', pts, w, dash, fill, closed, c });
  const text = (x, y, s, txt, a = 'start', o = {}) => pr.push(Object.assign({ k: 'text', x, y, s, txt: String(txt), a, rot: 0, bold: false, c: '#000' }, o));
  const tw = (txt, s) => String(txt).length * 0.55 * s;
  const arrow = (x, y, ang, len = 2.6, wid = 0.9) => { const c = Math.cos(ang), s = Math.sin(ang); pr.push({ k: 'path', subs: [[[x, y], [x - len * c + wid * s, y - len * s - wid * c], [x - len * c - wid * s, y - len * s + wid * c]]], fill: '#000' }); };
  const TS = 2.6; // dimension text height (mm)
  // horizontal dimension between model-space points mapped to sheet: x1,x2 at sheet y (yRef1,yRef2 = feature y on sheet), dim line at yd
  const dimH = (xa, ya, xb, yb, yd, label) => {
    const up = yd < Math.min(ya, yb);
    line(xa, ya + (up ? -1 : 1), xa, yd + (up ? -1.5 : 1.5), 0.18); line(xb, yb + (up ? -1 : 1), xb, yd + (up ? -1.5 : 1.5), 0.18);
    const L = Math.abs(xb - xa), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), wT = tw(label, TS);
    if (L > 8) { line(x0, yd, x1, yd, 0.18); arrow(x0, yd, Math.PI); arrow(x1, yd, 0); }
    else { line(x0 - 6, yd, x1 + 6, yd, 0.18); arrow(x0, yd, 0); arrow(x1, yd, Math.PI); }
    if (L > wT + 6) text((x0 + x1) / 2, yd - 1, TS, label, 'middle');
    else text(x1 + 7, yd + TS / 2 - 0.3, TS, label, 'start');
  };
  const dimV = (xa, ya, xb, yb, xd, label) => {
    const right = xd > Math.max(xa, xb);
    line(xa + (right ? 1 : -1), ya, xd + (right ? 1.5 : -1.5), ya, 0.18); line(xb + (right ? 1 : -1), yb, xd + (right ? 1.5 : -1.5), yb, 0.18);
    const L = Math.abs(yb - ya), y0 = Math.min(ya, yb), y1 = Math.max(ya, yb), wT = tw(label, TS);
    if (L > 8) { line(xd, y0, xd, y1, 0.18); arrow(xd, y0, -Math.PI / 2); arrow(xd, y1, Math.PI / 2); }
    else { line(xd, y0 - 6, xd, y1 + 6, 0.18); arrow(xd, y0, Math.PI / 2); arrow(xd, y1, -Math.PI / 2); }
    if (L > wT + 6) text(xd - 1, (y0 + y1) / 2, TS, label, 'middle', { rot: -90 });
    else text(xd + 1.2, y0 - 7, TS, label, 'start');
  };
  // frame
  poly([[10, 10], [410, 10], [410, 287], [10, 287]], 0.7);
  // scale selection
  const plW = M.vbb.x1 - M.vbb.x0, bW = M.base ? M.base.W : 0, bD = M.base ? M.base.D : M.t, bH = M.base ? M.base.H : 0;
  const totalW = Math.max(plW, bW), totalH = M.H + bH;
  const fits = k => (totalW * k + 44 <= 172) && (totalH * k + 34 <= 186) && (bD * k + 34 <= 74) && (!M.base || (bD * k + 30 <= 78));
  let sc = Core.SCALES[Core.SCALES.length - 1];
  for (const c of Core.SCALES) if (fits(c[0])) { sc = c; break; }
  const k = sc[0];
  // front view placement
  const fcx = 16 + 172 / 2 - 4, ground = 18 + 12 + M.H * k + (186 - 34 - totalH * k) / 2;
  const FX = x => fcx + x * k, FY = y => ground - y * k;
  const mapPts = (pts, fx, fy) => pts.map(p => [fx(p[0]), fy(p[1])]);
  // artwork (placement only)
  for (const it of M.art.items) {
    const subs = flattenCmds(it.cmds, 0.08).map(s => mapPts(s, FX, FY));
    pr.push({ k: 'path', subs, fill: '#9aa3ad' });
  }
  if (M.art.logo && info.logoPng) { const lg = M.art.logo; pr.push({ k: 'image', x: FX(lg.x), y: FY(lg.y + lg.h), w: lg.w * k, h: lg.h * k, src: info.logoPng }); }
  poly(mapPts(M.vis, FX, FY), 0.5);
  if (M.base) poly(mapPts([[-bW / 2, 0], [bW / 2, 0], [bW / 2, -bH], [-bW / 2, -bH]], FX, FY), 0.5);
  if (M.tab) {
    const tw2 = M.tab.w / 2, s = M.tab.d, pk = M.pocket;
    poly(mapPts([[-tw2, 0], [-tw2, -s], [tw2, -s], [tw2, 0]], FX, FY), 0.25, [1.2, 0.8], null, false);
    poly(mapPts([[-pk.L / 2, 0], [-pk.L / 2, -pk.D], [pk.L / 2, -pk.D], [pk.L / 2, 0]], FX, FY), 0.25, [1.2, 0.8], null, false);
  }
  line(FX(0), FY(M.H) - 4, FX(0), FY(-bH) + 4, 0.18, [6, 1, 1, 1], '#000');
  // front dims
  const xr = Math.max(M.vbb.x1, bW / 2), xl = Math.min(M.vbb.x0, -bW / 2);
  const topPts = M.vis.filter(p => Math.abs(p[0] - M.vbb.x0) < 1e-6 || Math.abs(p[0] - M.vbb.x1) < 1e-6);
  const yAtMinX = (M.vis.find(p => Math.abs(p[0] - M.vbb.x0) < 1e-6) || [0, M.H])[1], yAtMaxX = (M.vis.find(p => Math.abs(p[0] - M.vbb.x1) < 1e-6) || [0, M.H])[1];
  void topPts;
  dimH(FX(M.vbb.x0), FY(yAtMinX), FX(M.vbb.x1), FY(yAtMaxX), FY(M.H) - 8, fmt(plW));
  const topX = (M.vis.reduce((a, p) => p[1] > a[1] ? p : a, [0, -1]))[0];
  dimV(FX(topX), FY(M.H), FX(xr), FY(0), FX(xr) + 9, fmt(M.H));
  if (M.base) {
    dimV(FX(topX), FY(M.H), FX(bW / 2), FY(-bH), FX(xr) + 19, fmt(totalH));
    dimV(FX(-bW / 2), FY(0), FX(-bW / 2), FY(-bH), FX(xl) - 8, fmt(bH));
    dimH(FX(-bW / 2), FY(-bH), FX(bW / 2), FY(-bH), FY(-bH) + 9, fmt(bW));
  }
  text(fcx, FY(-bH) + 19, 3.2, 'FRONT VIEW', 'middle', { bold: true });
  // side view (depth horizontal), shares ground line
  const scx = 197 + 74 / 2, SX = d => scx + d * k;
  const t2 = M.t / 2;
  poly([[SX(-t2), FY(0)], [SX(-t2), FY(M.H)], [SX(t2), FY(M.H)], [SX(t2), FY(0)]], 0.5, null, null, false);
  if (M.base) poly([[SX(-bD / 2), FY(0)], [SX(bD / 2), FY(0)], [SX(bD / 2), FY(-bH)], [SX(-bD / 2), FY(-bH)]], 0.5);
  if (M.tab) {
    poly([[SX(-t2), FY(0)], [SX(-t2), FY(-M.tab.d)], [SX(t2), FY(-M.tab.d)], [SX(t2), FY(0)]], 0.25, [1.2, 0.8], null, false);
    const w2 = M.pocket.W / 2; poly([[SX(-w2), FY(0)], [SX(-w2), FY(-M.pocket.D)], [SX(w2), FY(-M.pocket.D)], [SX(w2), FY(0)]], 0.25, [1.2, 0.8], null, false);
  } else poly([[SX(-t2), FY(0)], [SX(t2), FY(0)]], 0.5, null, null, false);
  line(SX(0), FY(M.H) - 4, SX(0), FY(-bH) + 4, 0.18, [6, 1, 1, 1]);
  dimH(SX(-t2), FY(M.H), SX(t2), FY(M.H), FY(M.H) - 8, fmt(M.t));
  if (M.base) dimH(SX(-bD / 2), FY(-bH), SX(bD / 2), FY(-bH), FY(-bH) + 9, fmt(bD));
  text(scx, FY(-bH) + 19, 3.2, 'SIDE VIEW', 'middle', { bold: true });
  // base top view (below front view)
  if (M.base) {
    const tcy = 205 + 78 / 2 - 4, TX = x => fcx + x * k, TY = y => tcy - y * k;
    poly(mapPts([[-bW / 2, -bD / 2], [bW / 2, -bD / 2], [bW / 2, bD / 2], [-bW / 2, bD / 2]], TX, TY), 0.5);
    if (M.pocket) {
      poly(mapPts(Core.pocketOutline(M), TX, TY), 0.4);
      dimH(TX(-M.pocket.L / 2), TY(M.pocket.W / 2), TX(M.pocket.L / 2), TY(M.pocket.W / 2), TY(bD / 2) - 6, fmt(M.pocket.L));
      const lx = TX(bW / 2) + 4, ly = TY(0);
      line(TX(M.pocket.L / 2) - 2, ly, lx + 2, ly - 6, 0.18); arrow(TX(M.pocket.L / 2) - 2, ly, Math.atan2(6, -(lx + 2 - TX(M.pocket.L / 2) + 2)));
      text(lx + 3, ly - 6.5, 2.4, `POCKET ${fmt(M.pocket.L)} x ${fmt(M.pocket.W)}, DEPTH ${fmt(M.pocket.D)}`, 'start');
      text(lx + 3, ly - 3.3, 2.4, `CORNER R${fmt(M.pocket.r)} (ROUTER RELIEF)`, 'start');
    }
    line(TX(-bW / 2) - 4, TY(0), TX(bW / 2) + 4, TY(0), 0.18, [6, 1, 1, 1]);
    line(TX(0), TY(bD / 2) + 4, TX(0), TY(-bD / 2) - 4, 0.18, [6, 1, 1, 1]);
    dimV(TX(-bW / 2), TY(bD / 2), TX(-bW / 2), TY(-bD / 2), TX(-bW / 2) - 8, fmt(bD));
    text(fcx, TY(-bD / 2) + 9, 3.2, 'BASE - TOP VIEW (PLAQUE REMOVED)', 'middle', { bold: true });
  }
  // right column: key dimensions table
  const cx0 = 280, cx1 = 405; let y = 18;
  text(cx0, y, 3.4, 'KEY DIMENSIONS (mm)', 'start', { bold: true }); y += 3;
  const rows = [
    ['Shape', info.shapeName || M.shape],
    ['Plaque width (max)', fmt(plW)],
    ['Plaque height above base', fmt(M.H)],
    ['Total height incl. base', fmt(totalH)],
    ['Plaque thickness', fmt(M.t)],
    ['Plaque cut height incl. tab', fmt(M.H + (M.tab ? M.tab.d : 0))],
    ['Bottom contact width', fmt(2 * M.b)]
  ];
  if (M.tab) rows.push(['Tab width x depth', `${fmt(M.tab.w)} x ${fmt(M.tab.d)}`], ['Shoulder each side', fmt(M.tab.shoulder)]);
  if (M.base) rows.push(['Base W x D x H', `${fmt(bW)} x ${fmt(bD)} x ${fmt(bH)}`]);
  if (M.pocket) rows.push(['Pocket L x W x depth', `${fmt(M.pocket.L)} x ${fmt(M.pocket.W)} x ${fmt(M.pocket.D)}`], ['Pocket corner radius', fmt(M.pocket.r)]);
  rows.push(['Connection', { slot: 'Slot-in base (tab + pocket)', bonded: 'Bonded on top of base', none: 'Freestanding, no base' }[M.type]]);
  for (const r of rows) { line(cx0, y, cx1, y, 0.12); y += 4.6; text(cx0 + 1, y - 1.3, 2.5, r[0]); text(cx1 - 1, y - 1.3, 2.5, r[1], 'end', { bold: true }); }
  line(cx0, y, cx1, y, 0.12);
  y += 8; text(cx0, y, 3.4, 'NOTES', 'start', { bold: true }); y += 5;
  const baseMat = { black: 'Black acrylic', clear: 'Clear acrylic', frosted: 'Frosted acrylic', wood: 'Wood' };
  const notes = [
    'All dimensions in mm. Do not scale this drawing; cut from the 1:1 DXF.',
    `Plaque: clear cast acrylic (PMMA), ${fmt(M.t)} mm, edges polished.`,
    M.base ? `Base: ${baseMat[M.base.material]} block. Material to be confirmed.` : 'No base: plaque stands on its bottom edge.',
    M.type === 'slot' ? 'Assembly: insert tab into pocket until shoulders seat on base top; bond (method to be confirmed).' : M.type === 'bonded' ? 'Assembly: bond plaque bottom edge centred on base top (method to be confirmed).' : 'Assembly: none.',
    M.type === 'slot' ? 'PROTOTYPE ASSUMPTION: pocket CNC-routed into a solid base block (method to be confirmed).' : null,
    M.type === 'slot' ? `Pocket clearance: +${fmt(R.clrT)} thickness, +${fmt(R.clrL)} length, ${fmt(R.pocketGap)} bottom gap.` : null,
    `Artwork: ${M.finish.method === 'laser' ? 'laser engraving' : 'UV print'}, ${M.finish.side === 'back' ? 'BACK surface (mirrored files)' : 'front surface'}. Shown grey for placement only; use the separate artwork files.`,
    'Artwork does not change the 3D geometry (STL).',
    `General tolerance: plaque +/-${fmt(R.tolPlaque)}, base +/-${fmt(R.tolBase)}. Kerf compensation by CAM.`
  ].filter(Boolean);
  const wrap = (s, n) => { const w = s.split(' '), out = []; let cur = ''; for (const x of w) { if ((cur + ' ' + x).trim().length > n) { out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); } if (cur) out.push(cur); return out; };
  notes.forEach((n, i) => { const ls = wrap(n, 62); ls.forEach((l, j) => { text(cx0 + (j ? 4 : 0), y, 2.35, (j ? '' : (i + 1) + '. ') + l); y += 3.4; }); y += 0.6; });
  const pending = info.pendingRules || [];
  if (pending.length) {
    y += 2; text(cx0, y, 2.6, 'PENDING MANUFACTURER CONFIRMATION', 'start', { bold: true, c: '#a3360f' }); y += 3.6;
    const ls = wrap(pending.join(', '), 64); ls.slice(0, 5).forEach(l => { text(cx0, y, 2.3, l, 'start', { c: '#a3360f' }); y += 3.2; });
  }
  // title block
  const tb = { x0: 270, y0: 236, x1: 410, y1: 287 };
  poly([[tb.x0, tb.y0], [tb.x1, tb.y0], [tb.x1, tb.y1], [tb.x0, tb.y1]], 0.5);
  line(tb.x0, 247, tb.x1, 247, 0.25); line(tb.x0, 258, tb.x1, 258, 0.25); line(tb.x0, 269, tb.x1, 269, 0.25); line(tb.x0, 278, tb.x1, 278, 0.25);
  line(340, 247, 340, 278, 0.25); line(375, 269, 375, 287, 0.25);
  text(tb.x0 + 2, 243.5, 4, 'ACRYLIC RECOGNITION AWARD', 'start', { bold: true });
  text(tb.x1 - 2, 243.5, 3, info.shapeName || '', 'end');
  const fieldTxt = (x, yLab, lab, val, yVal) => {
    text(x, yLab, 1.9, lab, 'start', { c: '#555' });
    if (!val) return;
    const sh = FONTS && shapeLine(val, false); if (!sh) { text(x, yVal, 2.9, val); return; }
    let size = 2.9; const maxW = 64; if (sh.adv * size > maxW) size = maxW / sh.adv;
    const ox = sh.rtl ? x + maxW - sh.adv * size : x;
    const cm = placeCmds(sh.cmds, size, ox, 0).map(c => { const o = Object.assign({}, c); if (o.y !== undefined) o.y = yVal - o.y; if (o.y1 !== undefined) o.y1 = yVal - o.y1; if (o.y2 !== undefined) o.y2 = yVal - o.y2; return o; });
    pr.push({ k: 'path', subs: flattenCmds(cm, 0.03), fill: '#000' });
  };
  fieldTxt(tb.x0 + 2, 250.5, 'CUSTOMER', (P.meta && P.meta.customer) || '-', 255.6);
  fieldTxt(342, 250.5, 'ORGANIZATION', (P.meta && P.meta.org) || '-', 255.6);
  text(tb.x0 + 2, 261.5, 1.9, 'REFERENCE', 'start', { c: '#555' }); text(tb.x0 + 2, 266.5, 3, info.ref || 'DRAFT', 'start', { bold: true });
  text(342, 261.5, 1.9, 'STATUS', 'start', { c: '#555' }); text(342, 266.5, 2.8, info.approvedAt ? `APPROVED ${info.approvedAt}` : 'DRAFT - NOT APPROVED', 'start', { bold: true, c: info.approvedAt ? '#0b6b3a' : '#a3360f' });
  text(tb.x0 + 2, 272, 1.9, 'QTY', 'start', { c: '#555' }); text(tb.x0 + 2, 276.4, 2.8, String((P.meta && P.meta.qty) || 1));
  text(300, 272, 1.9, 'SCALE (A3)', 'start', { c: '#555' }); text(300, 276.4, 2.8, sc[1]);
  text(342, 272, 1.9, 'UNITS', 'start', { c: '#555' }); text(342, 276.4, 2.8, 'mm');
  text(tb.x0 + 2, 284, 2.2, `Generated ${info.date || ''} by award configurator v${Core.VERSION}`, 'start', { c: '#555' });
  // first-angle projection symbol
  const px = 392, py = 278;
  poly([[px - 13, py + 2], [px - 13, py + 6], [px - 5, py + 7.5], [px - 5, py + 0.5]], 0.25);
  pr.push({ k: 'circle', x: px + 3, y: py + 4, r: 3.5, w: 0.25 }); pr.push({ k: 'circle', x: px + 3, y: py + 4, r: 1.7, w: 0.25 });
  text(377, 272, 1.9, 'FIRST ANGLE', 'start', { c: '#555' });
  if (!info.approvedAt) text(150, 140, 20, 'DRAFT - NOT APPROVED', 'middle', { bold: true, c: '#efdcd5', rot: -18, under: true });
  S.scale = sc[1];
  return S;
};
Core.drawingToSVG = function (S, fontFamily) {
  const n = v => Math.round(v * 100) / 100;
  const dash = d => d ? ` stroke-dasharray="${d.join(' ')}"` : '';
  const under = [], over = [];
  for (const p of S.prims) {
    let s = '';
    if (p.k === 'line') s = `<line x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" stroke="${p.c}" stroke-width="${p.w}"${dash(p.dash)}/>`;
    else if (p.k === 'poly') s = `<path d="${p.pts.map((q, i) => (i ? 'L' : 'M') + n(q[0]) + ' ' + n(q[1])).join('')}${p.closed ? 'Z' : ''}" fill="${p.fill || 'none'}" stroke="${p.c}" stroke-width="${p.w}" stroke-linejoin="round"${dash(p.dash)}/>`;
    else if (p.k === 'path') s = `<path d="${p.subs.map(sub => sub.map((q, i) => (i ? 'L' : 'M') + n(q[0]) + ' ' + n(q[1])).join('') + 'Z').join('')}" fill="${p.fill}" fill-rule="nonzero"/>`;
    else if (p.k === 'circle') s = `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${p.r}" fill="none" stroke="#000" stroke-width="${p.w}"/>`;
    else if (p.k === 'image') s = `<image x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" href="${p.src}" preserveAspectRatio="none" opacity="0.55"/>`;
    else if (p.k === 'text') {
      const anc = p.a === 'middle' ? 'middle' : p.a === 'end' ? 'end' : 'start';
      s = `<text x="${n(p.x)}" y="${n(p.y)}" font-size="${p.s}" font-family="${fontFamily || 'Helvetica, Arial, sans-serif'}" font-weight="${p.bold ? 700 : 400}" text-anchor="${anc}" fill="${p.c}"${p.rot ? ` transform="rotate(${p.rot} ${n(p.x)} ${n(p.y)})"` : ''}>${esc(p.txt)}</text>`;
    }
    (p.under ? under : over).push(s);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S.w} ${S.h}" width="${S.w}mm" height="${S.h}mm"><rect width="${S.w}" height="${S.h}" fill="#fff"/>${under.join('')}${over.join('')}</svg>`;
};
/* ---------------- Customer preview (front view, SVG string) ---------------- */
Core.previewSVG = function (M, P, opt) {
  opt = opt || {};
  const bW = M.base ? M.base.W : 0, bH = M.base ? M.base.H : 0;
  const x0 = Math.min(M.vbb.x0, -bW / 2), x1 = Math.max(M.vbb.x1, bW / 2);
  const ph = opt.phone ? Core.PHONE : null;
  const span0 = Math.max(x1 - x0, M.H + bH);
  const gapP = ph ? Math.max(20, 0.1 * span0) : 0, px1 = x0 - gapP, px0 = px1 - (ph ? ph.w : 0), phoneTop = ph ? -bH + ph.h : -Infinity;
  const xl = ph ? px0 : x0;
  const span = Math.max(x1 - xl, Math.max(M.H, phoneTop) + bH);
  const pad = span * 0.08, dimRoom = span * 0.30;
  const vx0 = xl - pad, vx1 = x1 + dimRoom, vyTop = Math.max(M.H + span * 0.12, phoneTop + span * 0.11) + pad, vyBot = -bH - pad;
  const X = x => x - vx0, Y = y => vyTop - y;
  const VW = vx1 - vx0, VH = vyTop - vyBot, fs = span * 0.034;
  const ink = M.finish.method === 'laser' ? 'rgba(244,252,255,0.92)' : M.finish.color;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(VW)} ${fmt(VH)}" class="pv-svg" role="img" aria-label="${esc(opt.label || 'Award preview')}">`;
  s += `<defs><linearGradient id="acr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9fbfd" stop-opacity="0.34"/><stop offset="0.55" stop-color="#bfe9f0" stop-opacity="0.16"/><stop offset="1" stop-color="#8fd3df" stop-opacity="0.28"/></linearGradient>`;
  s += `<linearGradient id="bm-black" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4250"/><stop offset="0.08" stop-color="#20252e"/><stop offset="1" stop-color="#0f1217"/></linearGradient>`;
  s += `<linearGradient id="bm-clear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9fbfd" stop-opacity="0.45"/><stop offset="1" stop-color="#8fd3df" stop-opacity="0.22"/></linearGradient>`;
  s += `<linearGradient id="bm-frosted" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7f8" stop-opacity="0.85"/><stop offset="1" stop-color="#cfd8dc" stop-opacity="0.75"/></linearGradient>`;
  s += `<linearGradient id="bm-wood" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="#7a4b2a"/><stop offset="0.5" stop-color="#9a6438"/><stop offset="1" stop-color="#6b3f22"/></linearGradient>`;
  s += `<filter id="frost" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.96  0 0 0 0 0.99  0 0 0 0 1  -0.33 -0.33 -0.34 1 0"/></filter>`;
  s += `<filter id="glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${fmt(span * 0.004)}"/></filter></defs>`;
  // base
  if (M.base) {
    const r = [[-bW / 2, 0], [bW / 2, 0], [bW / 2, -bH], [-bW / 2, -bH]];
    s += `<path d="${polyD(r, X, Y)}" fill="url(#bm-${M.base.material})" stroke="${M.base.material === 'black' ? '#4a5466' : 'rgba(200,240,245,0.7)'}" stroke-width="${fmt(span * 0.002)}"/>`;
  }
  // plaque
  const vd = polyD(M.vis, X, Y);
  s += `<path d="${vd}" fill="url(#acr)"/>`;
  s += `<path d="${vd}" fill="none" stroke="#9fe3e6" stroke-opacity="0.55" stroke-width="${fmt(span * 0.006)}" filter="url(#glow)"/>`;
  s += `<path d="${vd}" fill="none" stroke="#d6fbfc" stroke-width="${fmt(span * 0.0022)}"/>`;
  // safe area
  if (opt.safe !== false) { const so = Core.safeOutline(M); if (so) s += `<path d="${polyD(so, X, Y)}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="${fmt(span * 0.0018)}" stroke-dasharray="${fmt(span * 0.008)} ${fmt(span * 0.008)}"/>`; }
  // artwork
  if (M.art.logo && P.logo) {
    const lg = M.art.logo;
    s += `<image x="${fmt(X(lg.x))}" y="${fmt(Y(lg.y + lg.h))}" width="${fmt(lg.w)}" height="${fmt(lg.h)}" preserveAspectRatio="none" href="${P.logo.dataUrl}"${M.finish.method === 'laser' ? ' filter="url(#frost)"' : ''}/>`;
    if (lg.state !== 'ok') s += `<rect x="${fmt(X(lg.box.x0))}" y="${fmt(Y(lg.box.y1))}" width="${fmt(lg.w)}" height="${fmt(lg.h)}" fill="none" stroke="${lg.state === 'out' ? '#ff6b5a' : '#ffc14d'}" stroke-width="${fmt(span * 0.003)}" stroke-dasharray="${fmt(span * 0.01)} ${fmt(span * 0.006)}"/>`;
  }
  for (const it of M.art.items) {
    s += `<path d="${svgPathD(it.cmds, X, Y)}" fill="${ink}"/>`;
    if (it.state !== 'ok') { const b = it.ink; s += `<rect x="${fmt(X(b.x0) - span * 0.004)}" y="${fmt(Y(b.y1) - span * 0.004)}" width="${fmt(b.x1 - b.x0 + span * 0.008)}" height="${fmt(b.y1 - b.y0 + span * 0.008)}" fill="none" stroke="${it.state === 'out' ? '#ff6b5a' : '#ffc14d'}" stroke-width="${fmt(span * 0.003)}" stroke-dasharray="${fmt(span * 0.01)} ${fmt(span * 0.006)}"/>`; }
  }
  // size reference phone (not part of any export)
  if (ph) {
    const sw = fmt(span * 0.0022), X0 = X(px0), Y0 = Y(phoneTop), inset = 2.4;
    s += `<line x1="${fmt(X(xl) - pad * 0.4)}" y1="${fmt(Y(-bH))}" x2="${fmt(X(x1) + pad * 0.4)}" y2="${fmt(Y(-bH))}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="${sw}"/>`;
    s += `<g class="pv-phone" aria-hidden="true"><rect x="${fmt(X0)}" y="${fmt(Y0)}" width="${ph.w}" height="${ph.h}" rx="9.5" fill="#b9cad4" fill-opacity="0.12" stroke="#b9cad4" stroke-opacity="0.85" stroke-width="${sw}"/>`;
    s += `<rect x="${fmt(X0 + inset)}" y="${fmt(Y0 + inset)}" width="${fmt(ph.w - 2 * inset)}" height="${fmt(ph.h - 2 * inset)}" rx="7.4" fill="#071119" fill-opacity="0.55"/>`;
    s += `<rect x="${fmt(X0 + ph.w / 2 - 13)}" y="${fmt(Y0 + inset)}" width="26" height="5" rx="2.5" fill="#b9cad4" fill-opacity="0.55"/></g>`;
    const t = opt.phone;
    s += `<text x="${fmt(X0 + ph.w / 2)}" y="${fmt(Y0 - fs * 1.55)}" font-size="${fmt(fs)}" fill="#e3edf2" font-weight="700" text-anchor="middle" class="pv-lab">${esc(t.title || ph.name)}</text>`;
    if (t.sub) s += `<text x="${fmt(X0 + ph.w / 2)}" y="${fmt(Y0 - fs * 0.45)}" font-size="${fmt(fs * 0.9)}" fill="#c9d6df" text-anchor="middle" class="pv-lab">${esc(t.sub)}</text>`;
  }
  // dimensions for customers
  const dc = '#c9d6df', lw = fmt(span * 0.0022), ah = span * 0.012;
  const arrowV = (x, ya, yb) => `<path d="M${fmt(X(x))} ${fmt(Y(ya))}L${fmt(X(x))} ${fmt(Y(yb))}M${fmt(X(x) - ah * 0.45)} ${fmt(Y(ya) + ah)}L${fmt(X(x))} ${fmt(Y(ya))}L${fmt(X(x) + ah * 0.45)} ${fmt(Y(ya) + ah)}M${fmt(X(x) - ah * 0.45)} ${fmt(Y(yb) - ah)}L${fmt(X(x))} ${fmt(Y(yb))}L${fmt(X(x) + ah * 0.45)} ${fmt(Y(yb) - ah)}" stroke="${dc}" stroke-width="${lw}" fill="none"/>`;
  const lab = (x, y, txt, cls, anchor) => `<text x="${fmt(X(x))}" y="${fmt(Y(y))}" font-size="${fmt(fs)}" fill="${cls === 'strong' ? '#ffffff' : dc}" font-weight="${cls === 'strong' ? 700 : 400}" text-anchor="${anchor || 'start'}" class="pv-lab">${esc(txt)}</text>`;
  const L = opt.labels || { width: 'Width', plaque: 'Plaque', total: 'Total', unit: v => fmt(v) + ' mm' };
  const xD1 = x1 + span * 0.05, xD2 = x1 + span * 0.17;
  const topY = M.H;
  s += `<path d="M${fmt(X(M.vbb.x1 + span * 0.01))} ${fmt(Y(topY))}L${fmt(X(xD2 + span * 0.02))} ${fmt(Y(topY))}M${fmt(X(Math.max(M.vbb.x1, bW / 2) + span * 0.01))} ${fmt(Y(0))}L${fmt(X(xD1 + span * 0.02))} ${fmt(Y(0))}" stroke="${dc}" stroke-opacity="0.5" stroke-width="${lw}" stroke-dasharray="${fmt(span * 0.006)} ${fmt(span * 0.006)}"/>`;
  s += arrowV(xD1, topY, 0);
  { const tx = X(xD1) - fs * 0.45, ty = Y(topY / 2); s += `<text x="${fmt(tx)}" y="${fmt(ty)}" transform="rotate(-90 ${fmt(tx)} ${fmt(ty)})" font-size="${fmt(fs)}" fill="#ffffff" font-weight="700" text-anchor="middle" class="pv-lab">${esc(L.plaque + ' ' + L.unit(M.H))}</text>`; }
  if (M.base) {
    s += `<path d="M${fmt(X(bW / 2 + span * 0.01))} ${fmt(Y(-bH))}L${fmt(X(xD2 + span * 0.02))} ${fmt(Y(-bH))}" stroke="${dc}" stroke-opacity="0.5" stroke-width="${lw}" stroke-dasharray="${fmt(span * 0.006)} ${fmt(span * 0.006)}"/>`;
    s += arrowV(xD2, topY, -bH);
    s += `<g transform="rotate(-90 ${fmt(X(xD2) - fs * 0.45)} ${fmt(Y((topY - bH) / 2))})"><text x="${fmt(X(xD2) - fs * 0.45)}" y="${fmt(Y((topY - bH) / 2))}" font-size="${fmt(fs)}" fill="#ffd27a" font-weight="700" text-anchor="middle" class="pv-lab">${esc(L.total + ' ' + L.unit(M.Ht))}</text></g>`;
  }
  // width
  const yW = M.H + span * 0.07;
  s += `<path d="M${fmt(X(M.vbb.x0))} ${fmt(Y(yW))}L${fmt(X(M.vbb.x1))} ${fmt(Y(yW))}M${fmt(X(M.vbb.x0) + ah)} ${fmt(Y(yW) - ah * 0.45)}L${fmt(X(M.vbb.x0))} ${fmt(Y(yW))}L${fmt(X(M.vbb.x0) + ah)} ${fmt(Y(yW) + ah * 0.45)}M${fmt(X(M.vbb.x1) - ah)} ${fmt(Y(yW) - ah * 0.45)}L${fmt(X(M.vbb.x1))} ${fmt(Y(yW))}L${fmt(X(M.vbb.x1) - ah)} ${fmt(Y(yW) + ah * 0.45)}" stroke="${dc}" stroke-width="${lw}" fill="none"/>`;
  s += lab((M.vbb.x0 + M.vbb.x1) / 2, yW + span * 0.012, L.width + ' ' + L.unit(M.vbb.x1 - M.vbb.x0), 'strong', 'middle');
  s += '</svg>';
  return s;
};

root.AwardCore = Core;
if (typeof module !== 'undefined') module.exports = Core;
})(typeof window !== 'undefined' ? window : globalThis);
