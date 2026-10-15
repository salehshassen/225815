# Award Builder v0.4: IP download blocks. Deployment and live checks

For your live project `iyeavqsdtneksbumrrcw` and site https://salehshassen.github.io/225815/award-builder/.
Order matters: **database, then functions, then website.** The initial schema is not run again, and existing accounts, plans,
export counts and suspensions are kept. Nothing below has been run on your services yet.

## Deploy

1. **Optional backup:** in the admin dashboard, click **Export CSV** to keep a copy of your customer list.
2. **Database:** Supabase Dashboard → **SQL Editor** → **New query** → paste all of
   `award-builder-backend/supabase/migrations/20261015000000_ip_download_bans.sql` → **Run**. Expect *Success. No rows returned*.
   - Do **not** use `supabase db push`: your first two migrations were run in the SQL Editor, so `db push` would try to run them again.
   - Check in **Table Editor**: a new empty table `ip_bans`; `profiles` has two new empty columns (`last_download_ip`, `last_download_ip_at`); customers and export counts unchanged.
   - Running the file a second time by accident is harmless.
3. **Functions:** open a terminal in the unzipped `award-builder-backend` folder and run:
   ```
   npx supabase@latest login
   npx supabase@latest link --project-ref iyeavqsdtneksbumrrcw
   npx supabase@latest functions deploy export --use-api
   npx supabase@latest functions deploy admin --use-api
   ```
   Your existing `ALLOWED_ORIGINS` secret is kept. Between steps 2 and 3, the old functions keep working with the new database.
4. **Optional settings** (the defaults need no command):
   ```
   npx supabase@latest secrets set IP_UNKNOWN_POLICY=block     # default allow: if the server cannot see a client IP, downloads still work
   npx supabase@latest secrets set RECORD_DOWNLOAD_IP=off      # default on: stores each account's last download IP (bans still work if off)
   ```
   If you change either setting, re-run the two `deploy` commands. If you set `RECORD_DOWNLOAD_IP=off`, also remove the
   "most recent download" wording from `privacy.html`.
5. **Website:** GitHub → repository `225815` → folder `award-builder` → **Add file → Upload files**. Drag in **everything** inside the
   unzipped `award-builder-frontend` folder (all folders plus `privacy.html`, `terms.html`, `google969a58c9264a531c.html`) → **Commit changes**.
   - Uploading replaces files with the same name. Do **not** delete anything first.
   - `js/config.js` already holds your live Project URL and publishable key. No secret keys are in this folder.
   - If your Google verification file also exists somewhere else in the repository (for example the repository root), leave that copy where it is.
6. Wait 1–2 minutes, open the site with **Ctrl+Shift+R** (Cmd+Shift+R on Mac), then run the checks below.

## Live checks

Use two devices on **different networks**:
- **A**: your computer, signed in as mousasaleh003@gmail.com.
- **B**: a phone on **mobile data**, signed in with a second Google account.

| # | What to do | Expected | Pass/Fail |
|---|---|---|---|
| L1 | A: Admin → **Check IP detection** | Shows your computer's IP (compare with any "what is my IP" site in the same browser) and **Spoofing test passed**. If it says the test could not run, do L12. If it shows a **Warning**, stop and do not rely on IP bans. | |
| L2 | B: approve a design → **Download all files**. A: **Refresh** | ZIP saved on B. B's row shows **Last download IP** = the phone's address | |
| L3 | A: **Block IP** on B's row (or type it and click **Ban IP**). Then ban the same IP again | List shows **Banned**, ban time, reason, your email. Second ban: "already banned; nothing changed" | |
| L4 | B (still signed in, page not reloaded): click a download | "Downloads are blocked for the network you are using…"; no file. B can still preview, change steps, sign out and sign in | |
| L5 | B: switch the phone to Wi-Fi (a different network) and download | Works: changing networks gets around an IP-only block. Switch back to mobile data | |
| L6 | A: **Restore IP** (row button), then restore again. B: download on mobile data | List shows **Restored** + time; second restore: "nothing changed"; B downloads again | |
| L7 | A: **Suspend** B. B: download. A: **Restore** B | Suspended message (restored IP does not override suspension); after restore, B downloads | |
| L8 | A: browser DevTools → device toolbar (~375 px wide) on `admin.html` | IP form, **Ban IP**/**Restore IP**, every row's buttons and the customer table are usable without sideways scrolling | |
| L9 | If L1 or L2 showed an **IPv6** address: ban it, try B, restore it | Same results as L3–L6. Otherwise note "IPv6 not available on my networks" | |
| L10 | B: open `.../award-builder/admin.html` | **No access** | |
| L11 | Supabase → Table Editor → `admin_audit` | `ban_ip` / `restore_ip` rows with your admin ID, the IP and the reason; repeats not logged | |
| L12 | Optional command-line spoof test (on A): ban A's own IP, sign in as B in a private window, copy the access token (DevTools → Application → Local storage → `aw-auth` → `access_token`), run the command below, then restore A's IP | Prints `{"error":"ip_banned",...}`: forged headers were ignored | |
| L13 | Open `privacy.html`, `terms.html` and `google969a58c9264a531c.html` on the site | All load; privacy shows **IP addresses and download restrictions** | |
| L14 | Supabase → Edge Functions → `export` → Logs | No unexpected errors; no "client IP unavailable" warnings | |

Command for L12 (replace `TOKEN`; the publishable key is the public one from `js/config.js`):
```
curl -s -X POST "https://iyeavqsdtneksbumrrcw.supabase.co/functions/v1/export" -H "apikey: sb_publishable_R56u5r7wKzTx2zAJWk_dig_UPVVbn9H" -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -H "CF-Connecting-IP: 203.0.113.250" -H "X-Forwarded-For: 203.0.113.250" -H "X-Real-IP: 203.0.113.250" -d '{"design":{},"kind":"stl"}'
```

## Owner decisions still open
- **Retention:** blocked-IP records and their audit entries are kept until you delete them; no period is set. If you choose one, for example deleting restored entries after N days, run in the SQL Editor:
  `delete from public.ip_bans where status = 'restored' and restored_at < now() - interval 'N days';`
  Then update the retention sentence in `privacy.html`.
- **Recording last download IP:** on by default (step 4 turns it off).
- **Terms:** `terms.html` is unchanged. If you want it to mention network-level download blocks, add a sentence and have it reviewed.

## Undo quickly
- To lift every block: `update public.ip_bans set status = 'restored', restored_at = now(), updated_at = now() where status = 'banned';`
- Account suspension and plans are not affected by this.
