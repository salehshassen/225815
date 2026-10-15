// Administrator dashboard. The page is public; the data is not: every request goes to the admin Edge Function,
// which verifies the signed-in Google account against the server-side admin allowlist.
(function () {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CFG = window.AWARD_CONFIG || {};
// Safety net: a secret/service key must never be published. If one is pasted into js/config.js, refuse to use it.
const KEY_IS_SECRET = (() => { const k = String(CFG.supabasePublishableKey || ''); if (/^sb_secret_/i.test(k)) return true;
  try { return JSON.parse(atob(k.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role'; } catch (e) { return false; } })();
if (KEY_IS_SECRET) console.error('Award Builder: js/config.js contains a SECRET key. Remove it, rotate it in Supabase, and use the publishable key.');
const CONFIGURED = !KEY_IS_SECRET && !!(window.supabase && CFG.supabaseUrl && CFG.supabasePublishableKey && !/YOUR-PROJECT|REPLACE/i.test(CFG.supabaseUrl + CFG.supabasePublishableKey));
const sb = CONFIGURED ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabasePublishableKey, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'aw-auth' } }) : null;
const S = { q: '', offset: 0, limit: 50, total: 0, users: [], plans: [], me: null, busy: false };
const IPS = { q: '', status: '', offset: 0, limit: 50, total: 0, bans: [], busy: false, myIp: null };
const FAKE_IP = '203.0.113.250'; // documentation-only address used by the spoofing test
let toastTimer = 0;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 3500); }
const fmt = v => { if (!v) return '–'; const d = new Date(v); return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); };
const MESSAGES = { not_admin: 'This account is not the administrator.', suspended: 'This account is suspended.', bad_plan: 'That plan does not exist.',
  cannot_suspend_self: 'You cannot suspend your own administrator account.', no_such_user: 'That customer no longer exists.',
  invalid_ip: 'That is not a single valid IPv4 or IPv6 address (ranges and ports are not supported).', ip_check_failed: 'The IP check failed on the server. Try again.', invalid_session: 'Your session has ended. Please sign in again.', not_signed_in: 'Please sign in.' };

async function call(action, payload, raw, extraHeaders) {
  const { data } = await sb.auth.getSession(); const session = data && data.session;
  if (!session) throw { status: 401, code: 'not_signed_in' };
  let r;
  try { r = await fetch(CFG.supabaseUrl + '/functions/v1/admin', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', apikey: CFG.supabasePublishableKey, Authorization: 'Bearer ' + session.access_token }, extraHeaders || {}), body: JSON.stringify(Object.assign({ action }, payload || {})) }); }
  catch (e) { throw { code: 'network' }; }
  if (!r.ok) { let b = {}; try { b = await r.json(); } catch (e) { /* ignore */ } throw { status: r.status, code: b.error || 'http_' + r.status }; }
  return raw ? r : r.json();
}
const errText = e => MESSAGES[e.code] || (e.code === 'network' ? 'Could not reach the server.' : 'Something went wrong (' + (e.code || 'error') + ').');

function gate(html) { $('#gate').innerHTML = html; $('#gate').hidden = false; $('#panel').hidden = true; }
const G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
async function boot() {
  if (!sb) { gate('<h2>Not connected yet</h2><p>Add your Supabase project URL and publishable key to <code>js/config.js</code> (see README).</p>'); return; }
  const err = new URLSearchParams(location.search).get('error_description');
  if (err) toast(/banned/i.test(err) ? 'This account is suspended.' : 'Sign-in failed: ' + err);
  const { data } = await sb.auth.getSession(); const session = data && data.session;
  if (!session) { $('#signOut').hidden = true; $('#who').textContent = ''; gate(`<h2>Administrator sign-in</h2><p>Sign in with the Google account that is registered as the administrator.</p><button type="button" class="btn gbtn" id="signIn">${G}<span>Continue with Google</span></button>`); return; }
  $('#signOut').hidden = false; $('#who').textContent = session.user.email || '';
  try {
    S.me = await call('whoami');
    $('#gate').hidden = true; $('#panel').hidden = false;
    await Promise.all([load(), loadIps()]);
  } catch (e) {
    if (e.status === 401) { await sb.auth.signOut().catch(() => {}); boot(); return; }
    gate(`<h2>No access</h2><p>${esc(errText(e))}</p><p class="small">Signed in as ${esc(session.user.email)}.</p>`);
  }
}
async function load() {
  if (S.busy) return; S.busy = true;
  try {
    const d = await call('list', { search: S.q, limit: S.limit, offset: S.offset });
    S.users = d.users; S.total = d.total; S.plans = d.plans; render();
  } catch (e) { toast(errText(e)); if (e.code === 'not_admin' || e.status === 401) boot(); }
  finally { S.busy = false; }
}
function render() {
  $('#count').textContent = `${S.total} customer${S.total === 1 ? '' : 's'}${S.q ? ' matching “' + S.q + '”' : ''}`;
  const planOpts = cur => S.plans.filter(p => p.is_active || p.id === cur).map(p => `<option value="${esc(p.id)}"${p.id === cur ? ' selected' : ''}>${esc(p.name)}${p.monthly_export_limit != null ? ' (' + p.monthly_export_limit + '/month)' : ''}</option>`).join('');
  $('#rows').innerHTML = S.users.map(u => {
    const self = S.me && u.id === S.me.id;
    const ipCell = u.last_download_ip
      ? `<span class="ipcell"><code>${esc(u.last_download_ip)}</code>${u.last_download_ip_banned ? '<span class="st suspended">Blocked</span>' : `<button type="button" class="btn small danger" data-banip="${esc(u.last_download_ip)}" aria-label="Block downloads from ${esc(u.last_download_ip)}">Block IP</button>`}</span>`
      : '–';
    return `<tr data-id="${esc(u.id)}">
      <td class="cust"><b>${esc(u.full_name || '–')}${u.is_admin ? '<span class="tag">Admin</span>' : ''}</b><span>${esc(u.email)}</span></td>
      <td data-label="Signed up">${esc(fmt(u.signup_at))}</td><td data-label="Last login">${esc(fmt(u.last_login_at))}</td>
      <td data-label="Plan"><select class="plan-sel" data-plan="${esc(u.id)}" aria-label="Plan for ${esc(u.email)}">${planOpts(u.plan_id)}</select></td>
      <td data-label="Status"><span class="st ${u.status === 'active' ? 'active' : 'suspended'}">${u.status === 'active' ? 'Active' : 'Suspended'}</span>${u.status_reason ? `<span class="reason" title="${esc(u.status_reason)}">${esc(u.status_reason)}</span>` : ''}</td>
      <td class="num" data-label="Exports">${esc(u.export_count)}</td><td data-label="Last export">${esc(fmt(u.last_export_at))}</td>
      <td data-label="Last download IP">${ipCell}</td>
      <td class="act">${self ? '<span class="small">You</span>' : u.status === 'active' ? `<button type="button" class="btn small danger" data-suspend="${esc(u.id)}">Suspend</button>` : `<button type="button" class="btn small" data-restore="${esc(u.id)}">Restore</button>`}</td></tr>`;
  }).join('') || '<tr><td colspan="9" class="small">No customers found.</td></tr>';
  const page = Math.floor(S.offset / S.limit) + 1, pages = Math.max(1, Math.ceil(S.total / S.limit));
  $('#pageInfo').textContent = `Page ${page} of ${pages}`; $('#prev').disabled = S.offset === 0; $('#next').disabled = S.offset + S.limit >= S.total;
}
async function act(fn, ok) { try { await fn(); toast(ok); } catch (e) { toast(errText(e)); } await load(); }

// ---------------- IP download blocks
async function loadIps() {
  if (IPS.busy) return; IPS.busy = true;
  try { const d = await call('ip_list', { search: IPS.q, status: IPS.status || null, limit: IPS.limit, offset: IPS.offset }); IPS.bans = d.bans; IPS.total = d.total; renderIps(); }
  catch (e) { toast(errText(e)); }
  finally { IPS.busy = false; }
}
function renderIps() {
  $('#ipCount').textContent = `${IPS.total} address${IPS.total === 1 ? '' : 'es'}${IPS.status ? ' (' + IPS.status + ')' : ''}`;
  $('#ipRows').innerHTML = IPS.bans.map(b => `<tr>
      <td class="cust"><b><code>${esc(b.ip)}</code></b><span>IPv${esc(b.ip_version)}</span></td>
      <td data-label="Status"><span class="st ${b.status === 'banned' ? 'suspended' : 'active'}">${b.status === 'banned' ? 'Banned' : 'Restored'}</span></td>
      <td data-label="Banned">${esc(fmt(b.banned_at))}${b.banned_by_email ? `<span class="reason">by ${esc(b.banned_by_email)}</span>` : ''}</td>
      <td data-label="Reason">${esc(b.reason || '–')}</td>
      <td data-label="Restored">${b.restored_at ? esc(fmt(b.restored_at)) + (b.restored_by_email ? `<span class="reason">by ${esc(b.restored_by_email)}</span>` : '') : '–'}</td>
      <td class="num" data-label="Blocked attempts">${esc(b.blocked_attempts)}${b.last_blocked_at ? `<span class="reason">last ${esc(fmt(b.last_blocked_at))}</span>` : ''}</td>
      <td class="act">${b.status === 'banned' ? `<button type="button" class="btn small" data-ip-restore="${esc(b.ip)}">Restore IP</button>` : `<button type="button" class="btn small danger" data-ip-reban="${esc(b.ip)}">Ban again</button>`}</td></tr>`).join('')
    || '<tr><td colspan="7" class="small">No IP addresses on the list.</td></tr>';
  const page = Math.floor(IPS.offset / IPS.limit) + 1, pages = Math.max(1, Math.ceil(IPS.total / IPS.limit));
  $('#ipPage').textContent = `Page ${page} of ${pages}`; $('#ipPrev').disabled = IPS.offset === 0; $('#ipNext').disabled = IPS.offset + IPS.limit >= IPS.total;
}
const looseIp = v => String(v || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
async function banIp(ip, reason) {
  ip = String(ip || '').trim(); if (!ip) { toast('Enter an IP address.'); $('#ipInput').focus(); return; }
  if (!IPS.myIp) { try { IPS.myIp = (await call('ip_check')).ip; } catch (e) { /* warning below is best-effort */ } }
  const mine = IPS.myIp && looseIp(ip) === looseIp(IPS.myIp);
  if (!window.confirm(`Ban downloads from ${ip}?\n\nEveryone using this network (for example a shared office, school, café or mobile carrier) will be unable to download files until you restore it. Viewing the site, signing in and previews keep working.${mine ? '\n\nThis is the IP address you are using right now: your own downloads from this network will be blocked too (this dashboard keeps working).' : ''}`)) return;
  try {
    const r = await call('ip_ban', { ip, reason: reason || null });
    toast(r.changed ? `${r.ip} is now banned for downloads` : `${r.ip} was already banned (since ${fmt(r.at)}); nothing changed`);
    if (r.changed) { $('#ipInput').value = ''; $('#ipReason').value = ''; }
  } catch (e) { toast(errText(e)); }
  await Promise.all([loadIps(), load()]);
}
async function restoreIp(ip) {
  ip = String(ip || '').trim(); if (!ip) { toast('Enter an IP address.'); $('#ipInput').focus(); return; }
  if (!window.confirm(`Restore downloads from ${ip}?\n\nThis only lifts the IP block. Suspended accounts and plan limits still apply.`)) return;
  try {
    const r = await call('ip_restore', { ip });
    toast(r.changed ? `${r.ip} restored` : r.status === 'not_listed' ? `${r.ip} is not on the list; nothing changed` : `${r.ip} was not banned; nothing changed`);
  } catch (e) { toast(errText(e)); }
  await Promise.all([loadIps(), load()]);
}
// Asks the server which IP it sees, then repeats the request with forged IP headers. If Supabase's network sets the
// client IP itself (as expected), both answers match and the forged value is ignored.
async function ipCheck() {
  const out = $('#ipCheckOut'); out.className = 'small'; out.textContent = 'Checking…';
  let a, b, bErr = null;
  try { a = await call('ip_check'); } catch (e) { out.className = 'small bad'; out.textContent = errText(e); return; }
  IPS.myIp = a.ip;
  try { b = await call('ip_check', null, false, { 'X-Forwarded-For': FAKE_IP, 'X-Real-IP': FAKE_IP, 'CF-Connecting-IP': FAKE_IP, 'True-Client-IP': FAKE_IP }); } catch (e) { bErr = e; }
  if (!a.ip) {
    out.className = 'small bad';
    out.textContent = `The server could not detect your IP address, so IP bans cannot be enforced reliably. When this happens downloads are ${a.policyWhenUnknown === 'block' ? 'blocked' : 'allowed'} (IP_UNKNOWN_POLICY).`;
  } else if (bErr) {
    out.className = 'small';
    out.textContent = `The server sees your IP as ${a.ip} (IPv${a.version}). The spoofing test could not run here (${errText(bErr)}); use the command-line test in DEPLOY-IP-BANS.md.`;
  } else if (b.ip === a.ip && b.ip !== FAKE_IP) {
    out.className = 'small ok';
    out.textContent = `The server sees your IP as ${a.ip} (IPv${a.version}). Spoofing test passed: forged X-Forwarded-For, X-Real-IP, CF-Connecting-IP and True-Client-IP headers were ignored.${a.banned ? ' This address is currently banned for downloads.' : ''}`;
  } else {
    out.className = 'small bad';
    out.textContent = `Warning: with forged headers the server saw ${b.ip || 'no address'} instead of ${a.ip}. Do not rely on IP bans; see DEPLOY-IP-BANS.md.`;
  }
}

document.addEventListener('submit', e => { if (e.target.id === 'ipForm') { e.preventDefault(); banIp($('#ipInput').value, $('#ipReason').value); } });
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'ipRestore') { restoreIp($('#ipInput').value); return; }
  if (b.id === 'ipCheck') { ipCheck(); return; }
  if (b.id === 'ipPrev') { IPS.offset = Math.max(0, IPS.offset - IPS.limit); loadIps(); return; }
  if (b.id === 'ipNext') { IPS.offset += IPS.limit; loadIps(); return; }
  if (b.dataset.ipRestore) { restoreIp(b.dataset.ipRestore); return; }
  if (b.dataset.ipReban) { const reason = window.prompt(`Ban ${b.dataset.ipReban} again. Optional reason (only administrators see it):`, ''); if (reason !== null) banIp(b.dataset.ipReban, reason); return; }
  if (b.dataset.banip) { const reason = window.prompt(`Block downloads from ${b.dataset.banip}. Optional reason (only administrators see it):`, ''); if (reason !== null) banIp(b.dataset.banip, reason); return; }
  if (b.id === 'signIn') { sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }); return; }
  if (b.id === 'signOut') { sb.auth.signOut().finally(() => location.reload()); return; }
  if (b.id === 'refresh') { load(); return; }
  if (b.id === 'prev') { S.offset = Math.max(0, S.offset - S.limit); load(); return; }
  if (b.id === 'next') { S.offset += S.limit; load(); return; }
  if (b.id === 'csv') {
    call('export_csv', { search: S.q }, true).then(async r => {
      const blob = await r.blob(), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = (/filename="([^"]+)"/.exec(r.headers.get('content-disposition') || '') || [])[1] || 'customers.csv';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
    }).catch(err => toast(errText(err)));
    return;
  }
  const u = S.users.find(x => x.id === (b.dataset.suspend || b.dataset.restore)); if (!u) return;
  if (b.dataset.suspend) {
    const reason = window.prompt(`Suspend ${u.email}? They will be blocked immediately, even if signed in.\n\nOptional reason (only you see it):`, '');
    if (reason === null) return;
    act(() => call('set_status', { userId: u.id, status: 'suspended', reason }), `${u.email} suspended`);
  } else if (window.confirm(`Restore access for ${u.email}?`)) act(() => call('set_status', { userId: u.id, status: 'active' }), `${u.email} restored`);
});
document.addEventListener('change', e => {
  if (e.target.id === 'ipStatus') { IPS.status = e.target.value; IPS.offset = 0; loadIps(); return; }
  const sel = e.target.closest('[data-plan]'); if (!sel) return;
  const u = S.users.find(x => x.id === sel.dataset.plan); if (!u) return;
  if (!window.confirm(`Change ${u.email} to the "${sel.options[sel.selectedIndex].text}" plan?`)) { sel.value = u.plan_id; return; }
  act(() => call('set_plan', { userId: u.id, planId: sel.value }), 'Plan updated');
});
let qt = 0, qt2 = 0;
document.addEventListener('input', e => {
  if (e.target.id === 'q') { clearTimeout(qt); qt = setTimeout(() => { S.q = e.target.value.trim(); S.offset = 0; load(); }, 300); }
  if (e.target.id === 'ipQ') { clearTimeout(qt2); qt2 = setTimeout(() => { IPS.q = e.target.value.trim(); IPS.offset = 0; loadIps(); }, 300); }
});
if (sb) sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') setTimeout(() => { history.replaceState(null, '', location.pathname); boot(); }, 0); });
boot();
})();
