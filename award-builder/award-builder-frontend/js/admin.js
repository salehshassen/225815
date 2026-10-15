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
let toastTimer = 0;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 3500); }
const fmt = v => { if (!v) return '–'; const d = new Date(v); return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); };
const MESSAGES = { not_admin: 'This account is not the administrator.', suspended: 'This account is suspended.', bad_plan: 'That plan does not exist.',
  cannot_suspend_self: 'You cannot suspend your own administrator account.', no_such_user: 'That customer no longer exists.', invalid_session: 'Your session has ended. Please sign in again.', not_signed_in: 'Please sign in.' };

async function call(action, payload, raw) {
  const { data } = await sb.auth.getSession(); const session = data && data.session;
  if (!session) throw { status: 401, code: 'not_signed_in' };
  let r;
  try { r = await fetch(CFG.supabaseUrl + '/functions/v1/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.supabasePublishableKey, Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify(Object.assign({ action }, payload || {})) }); }
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
    await load();
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
    return `<tr data-id="${esc(u.id)}">
      <td class="cust"><b>${esc(u.full_name || '–')}${u.is_admin ? '<span class="tag">Admin</span>' : ''}</b><span>${esc(u.email)}</span></td>
      <td>${esc(fmt(u.signup_at))}</td><td>${esc(fmt(u.last_login_at))}</td>
      <td><select class="plan-sel" data-plan="${esc(u.id)}" aria-label="Plan for ${esc(u.email)}">${planOpts(u.plan_id)}</select></td>
      <td><span class="st ${u.status === 'active' ? 'active' : 'suspended'}">${u.status === 'active' ? 'Active' : 'Suspended'}</span>${u.status_reason ? `<span class="reason" title="${esc(u.status_reason)}">${esc(u.status_reason)}</span>` : ''}</td>
      <td class="num">${esc(u.export_count)}</td><td>${esc(fmt(u.last_export_at))}</td>
      <td>${self ? '<span class="small">You</span>' : u.status === 'active' ? `<button type="button" class="btn small danger" data-suspend="${esc(u.id)}">Suspend</button>` : `<button type="button" class="btn small" data-restore="${esc(u.id)}">Restore</button>`}</td></tr>`;
  }).join('') || '<tr><td colspan="8" class="small">No customers found.</td></tr>';
  const page = Math.floor(S.offset / S.limit) + 1, pages = Math.max(1, Math.ceil(S.total / S.limit));
  $('#pageInfo').textContent = `Page ${page} of ${pages}`; $('#prev').disabled = S.offset === 0; $('#next').disabled = S.offset + S.limit >= S.total;
}
async function act(fn, ok) { try { await fn(); toast(ok); } catch (e) { toast(errText(e)); } await load(); }

document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
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
  const sel = e.target.closest('[data-plan]'); if (!sel) return;
  const u = S.users.find(x => x.id === sel.dataset.plan); if (!u) return;
  if (!window.confirm(`Change ${u.email} to the "${sel.options[sel.selectedIndex].text}" plan?`)) { sel.value = u.plan_id; return; }
  act(() => call('set_plan', { userId: u.id, planId: sel.value }), 'Plan updated');
});
let qt = 0;
document.addEventListener('input', e => { if (e.target.id !== 'q') return; clearTimeout(qt); qt = setTimeout(() => { S.q = e.target.value.trim(); S.offset = 0; load(); }, 300); });
if (sb) sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') setTimeout(() => { history.replaceState(null, '', location.pathname); boot(); }, 0); });
boot();
})();
