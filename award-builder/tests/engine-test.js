/* Engine test: no installs needed. Run: node tests/engine-test.js
   Checks every shape x base type x size preset: validation, sealed STL bodies, volume, DXF structure. */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const opentype = require(path.join(root, 'vendor/opentype.min.js'));
const earcut = require(path.join(root, 'vendor/earcut.min.js'));
const Core = require(path.join(root, 'js/core.js'));
Core.setDeps({ opentype, earcut });
const buf = f => { const b = fs.readFileSync(path.join(root, f)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); };
Core.initFonts(buf('fonts/IBMPlexSansArabic-Regular.ttf'), buf('fonts/IBMPlexSansArabic-Bold.ttf'));

let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('FAIL', m); } };
function sealed(tris) {
  const key = i => `${tris[i].toFixed(4)},${tris[i + 1].toFixed(4)},${tris[i + 2].toFixed(4)}`, edges = new Map(); let vol = 0;
  for (let i = 0; i < tris.length; i += 9) {
    const v = [key(i), key(i + 3), key(i + 6)];
    for (let k = 0; k < 3; k++) { const e = v[k] + '|' + v[(k + 1) % 3]; edges.set(e, (edges.get(e) || 0) + 1); }
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = Array.from(tris.slice(i, i + 9));
    vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
  }
  let bad = 0; for (const [e, c] of edges) { const [a, b] = e.split('|'); if (c !== 1 || edges.get(b + '|' + a) !== 1) bad++; }
  return { bad, vol };
}
for (const shape of Core.SHAPES) for (const type of ['slot', 'bonded', 'none']) for (const preset of Object.keys(Core.SIZE_PRESETS)) {
  const P = Core.defaultParams(), sz = Core.presetSize(preset, Core.DEFAULT_RULES);
  Object.assign(P, { shape, W: sz.W, H: sz.H, sizePreset: preset }); P.base.type = type; if (type === 'none') P.t = 15;
  const M = Core.build(P, Core.DEFAULT_RULES), id = `${shape}/${type}/${preset}`;
  ok(M.errors.length === 0, `${id}: preset has errors ${M.errors.map(e => e.code)}`);
  const ms = Core.meshes(M), p = sealed(ms.plaque);
  ok(p.bad === 0, `${id}: plaque mesh not sealed (${p.bad} bad edges)`);
  ok(Math.abs(p.vol - Math.abs(Core.area(M.cut)) * M.t) < 1, `${id}: plaque volume mismatch`);
  if (ms.base) { const b = sealed(ms.base); ok(b.bad === 0 && b.vol > 0, `${id}: base mesh not sealed`); }
  const dxf = Core.dxf(M), L = Core.dxfLayers(M);
  ok(dxf.includes('AC1009') && dxf.trim().endsWith('EOF') && dxf.includes(L.plaque), `${id}: DXF structure`);
  ok(new DataView(Core.stl(M, 'T')).getUint32(80, true) * 50 + 84 === Core.stl(M, 'T').byteLength, `${id}: STL size`);
}
// Arabic shaping sanity: joined forms are narrower than isolated letters
const joined = Core.shapeLine('شكر', true).adv, isolated = ['ش', 'ك', 'ر'].reduce((a, c) => a + Core.shapeLine(c, true).adv, 0);
ok(joined < isolated, 'Arabic letters should join');
console.log(`${checks - fails}/${checks} checks passed`);
process.exit(fails ? 1 : 0);
