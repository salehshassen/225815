/* UI smoke test that mimics GitHub Pages: serves the repo as static files and drives the customer flow in jsdom.
   Setup once: npm install   Run: npm run test:ui
   jsdom has no WebGL or real canvas, so the 3D view's fallback and the PNG pipeline (with a stub canvas) are checked here;
   check the 3D view and PNG contents in a real browser. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const NodeZip = require('jszip');
const root = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf', '.txt': 'text/plain' };
const served = [];
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/award-builder\//, '/');
  const file = path.join(root, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { served.push('404 ' + rel); res.writeHead(404); return res.end(); }
  served.push('200 ' + rel); res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
const PNG1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = []; let fails = 0;
const ok = (c, m) => { if (!c) fails++; log.push((c ? 'PASS ' : 'FAIL ') + m); };

server.listen(0, async () => {
  const url = `http://127.0.0.1:${server.address().port}/award-builder/`; // project-site style sub-path, like USER.github.io/REPO/
  const errs = [], vc = new VirtualConsole();
  vc.on('jsdomError', e => errs.push(String(e.message || e)));
  vc.on('error', e => { if (!/WebGL/.test(String(e))) errs.push('console.error ' + e); });
  const saved = [], blobs = new Map();
  const dom = await JSDOM.fromURL(url, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      const ctx = { translate() {}, scale() {}, fill() {}, drawImage() {}, putImageData() {}, getImageData(x, y, a, b) { return { data: new Uint8ClampedArray(a * b * 4) }; }, set fillStyle(v) {} };
      w.HTMLCanvasElement.prototype.getContext = function (t) { return /webgl/.test(t) ? null : ctx; };
      w.HTMLCanvasElement.prototype.toBlob = function (cb) { cb(new w.Blob([Uint8Array.from(Buffer.from(PNG1, 'base64'))], { type: 'image/png' })); };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,' + PNG1;
      w.Path2D = function () {};
      w.Image = class { set src(v) { this._s = v; this.naturalWidth = 400; this.naturalHeight = 200; setTimeout(() => this.onload && this.onload(), 5); } get src() { return this._s; } };
      w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }; w.HTMLDialogElement.prototype.close = function () { this.open = false; };
      let n = 0; w.URL.createObjectURL = b => { const u = 'blob:test/' + (++n); blobs.set(u, b); return u; }; w.URL.revokeObjectURL = () => {};
      w.HTMLAnchorElement.prototype.click = function () { if (this.download) saved.push({ name: this.download, blob: blobs.get(this.href) }); };
    }
  });
  const w = dom.window, d = w.document, $ = s => d.querySelector(s);
  await new Promise(r => w.addEventListener('load', r)); await sleep(400);
  // jsdom cannot run the browser build of JSZip's async scheduler; swap in the Node build (same API) for the test only
  w.JSZip = function () { const z = new NodeZip(), f = z.file.bind(z), g = z.generateAsync.bind(z);
    z.file = (name, data) => { if (data && typeof data !== 'string') { const t = Object.prototype.toString.call(data); data = t === '[object ArrayBuffer]' ? Buffer.from(new Uint8Array(data)) : Buffer.from(data.buffer, data.byteOffset, data.byteLength); } return f(name, data); };
    z.generateAsync = async o => new w.Uint8Array(await g(o)); return z; };
  const click = el => { if (!el) throw new Error('missing element'); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
  const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
  const ro = () => $('#readout').textContent.replace(/\s+/g, ' ');
  try {
    ok(!$('.fatal') && $('#viewFront svg path'), 'loaded from static host with bundled libraries and font');
    ok(/Plaque 15 × 20 cm/.test(ro()), 'centimetres shown to customers');
    ok($('#viewFront .pv-phone') && /iPhone 13/.test($('#viewFront').textContent), 'iPhone 13 size reference');
    click($('#nextBtn')); await sleep(40);
    click($('[data-size="small"]')); await sleep(50); ok(/Plaque 12 × 16 cm/.test(ro()), 'Small preset');
    type($('#slH'), '250'); await sleep(50); ok($('[data-size="custom"]').getAttribute('aria-pressed') === 'true' && /× 25 cm/.test(ro()), 'How tall? slider switches to Custom');
    ok(/not including the base/.test($('#slHHint').textContent), 'height explains the base is excluded');
    click($('[data-size="medium"]')); await sleep(50);
    click($('#nextBtn')); await sleep(30); click($('#exAr')); await sleep(60);
    click($('#nextBtn')); await sleep(30); click($('#nextBtn')); await sleep(40);
    for (const c of d.querySelectorAll('[data-chk]')) { c.checked = true; c.dispatchEvent(new w.Event('change', { bubbles: true })); }
    await sleep(20); click($('#approveBtn')); await sleep(80); ok($('.seal'), 'approved');
    for (const k of [...d.querySelectorAll('[data-dl]')].map(b => b.dataset.dl)) { click($(`[data-dl="${k}"]`)); await sleep(1200); }
    const names = saved.map(s => s.name); log.push('  downloads: ' + names.join(' | '));
    ok(['.zip', '_drawing.pdf', '.stl', '.dxf', '_inscription.svg', '.png', '.json'].every(x => names.some(n => n.endsWith(x))), 'browser downloads: zip, pdf, raw STL and DXF, svg, png, json');
    const zipEntry = saved.find(s => s.name.endsWith('.zip'));
    const zbuf = Buffer.from(await new Promise((res, rej) => { const fr = new w.FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsArrayBuffer(zipEntry.blob); }));
    const zip = await NodeZip.loadAsync(zbuf), inZip = Object.keys(zip.files);
    ok(inZip.length === 7 && inZip.includes('README.txt') && inZip.some(n => n.endsWith('.stl')) && inZip.some(n => n.endsWith('.dxf')), 'package contents: ' + inZip.length + ' files');
    click($('[data-view="drawing"]')); await sleep(60); ok($('#sheet svg'), 'drawing view');
    click($('#btnLang')); await sleep(80); ok(d.documentElement.dir === 'rtl', 'Arabic interface');
  } catch (e) { fails++; log.push('HARNESS ERROR ' + e.stack); }
  const missing = served.filter(s => s.startsWith('404'));
  ok(!missing.length, 'all assets served (no 404s)' + (missing.length ? ': ' + missing.join(', ') : ''));
  ok(!errs.length, 'no runtime errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' || ') : ''));
  console.log(log.join('\n')); server.close(); dom.window.close(); process.exit(fails ? 1 : 0);
});
