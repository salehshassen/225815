# Award Builder: setup guide (accounts, admin, server downloads)

> Existing v0.3 installation? To add IP download blocks, use **DEPLOY-IP-BANS.md**, not this guide.

You will create everything in your own accounts. Nothing here costs money on the free plans.
Administrator: **mousasaleh003@gmail.com** (already set in `supabase/migrations/20261014000100_admin_account.sql`).
Website address: **https://salehshassen.github.io/225815/award-builder/**

## Before you start (about 45–60 minutes)

- The Google account **mousasaleh003@gmail.com** (you will sign in to Google Cloud and Supabase with it).
- Access to the GitHub repository **225815** that hosts the current site.
- A computer with **Node.js 18 or newer** (https://nodejs.org) for step 11 onwards. Docker is not needed.
- A second Google account (any address) for the live checks in Part F.

Keep two packages apart:
- `award-builder-frontend` → your **public** GitHub Pages repository (contains no backend code and no secrets).
- `award-builder-backend` → Supabase, and optionally a **private** GitHub repository for safekeeping.

---

## Part A. Create the Supabase project

1. Go to https://supabase.com, sign up (you can use Continue with GitHub or your Google account), and click **New project**.
   - Organization: your personal organization on the **Free** plan.
   - Project name: `award-builder`.
   - Database password: click **Generate**, then save it in a password manager. You need it once, in step 13.
   - Region: choose the closest one to Saudi Arabia that the list offers.
   - Click **Create new project** and wait until the dashboard says the project is ready.
2. Copy two values into a text file (both are public and safe to share):
   - **Project URL**: Project Settings → **Data API** (looks like `https://abcdefghijklmnop.supabase.co`). The part before `.supabase.co` is your **project ref**.
   - **Publishable key**: Project Settings → **API Keys** → *Publishable key* (starts with `sb_publishable_`).
     If you only see *anon* and *service_role*, click **Create new API keys** first.
   - Do **not** copy the *secret* key (`sb_secret_...`) anywhere. The backend functions receive it automatically.
3. Create the database tables and security rules:
   - Open **SQL Editor** → **New query**. Open `supabase/migrations/20261014000000_award_builder_accounts.sql` from the backend package in a text editor, copy everything, paste, click **Run**. Expect *Success. No rows returned*.
   - **New query** again, paste `supabase/migrations/20261014000100_admin_account.sql`, click **Run**.
   - **New query** again, paste `supabase/migrations/20261015000000_ip_download_bans.sql`, click **Run** (IP download blocks, v0.4).
   - Already running v0.3? Do not repeat these steps; follow **DEPLOY-IP-BANS.md** instead.
   - Check: **Table Editor** shows `plans` with one row (`free`) and `admin_allowlist` with `mousasaleh003@gmail.com`.

## Part B. Create the Google sign-in client (Google Cloud)

4. Open https://console.cloud.google.com signed in as **mousasaleh003@gmail.com**. Create a project named `Award Builder` (project picker at the top → **New project**).
5. Open **Google Auth Platform** (search for it in the top search bar) and click **Get started**:
   - App name `Award Builder`, user support email `mousasaleh003@gmail.com`.
   - Audience: **External**. Contact email: yours. Accept the policy and **Create**.
   - **Data Access** → **Add or remove scopes** → tick `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` → **Update** → **Save**.
   - **Branding** → *Authorized domains*: add `salehshassen.github.io` and `supabase.co`, then **Save**.
6. **Clients** → **Create client**:
   - Application type: **Web application**. Name: `Award Builder (Supabase)`.
   - Authorized JavaScript origins: `https://salehshassen.github.io` and `http://localhost:8000`.
   - Authorized redirect URIs: `https://<your-project-ref>.supabase.co/auth/v1/callback` (the exact text is shown in Supabase in step 8).
   - Click **Create**, then copy the **Client ID** and **Client secret**. The client secret goes only into Supabase (step 8), never into the website or GitHub.
7. **Audience** → **Publish app** (status changes from *Testing* to *In production*). While in *Testing*, only test users you list can sign in.
   With only the basic email/profile scopes Google usually allows this without a review; if Google asks for verification (for example after you add a logo), follow its prompts.

## Part C. Connect Google to Supabase

8. Supabase → **Authentication** → **Sign In / Providers** → **Google**: switch it on, paste the Client ID and Client secret, **Save**. Check that the *Callback URL* shown there is exactly what you entered in step 6.
9. Same page → **Email**: switch it **off**, so Google is the only way to sign in. Leave *Allow new users to sign up* on.
10. **Authentication** → **URL Configuration**:
    - Site URL: `https://salehshassen.github.io/225815/award-builder/`
    - Redirect URLs → **Add URL**: `https://salehshassen.github.io/225815/award-builder/**` and (for testing on your computer) `http://localhost:8000/**`.

## Part D. Deploy the two backend functions

You need Node.js 18 or newer (https://nodejs.org). Docker is not needed.

11. Open a terminal in the `award-builder-backend` folder.
12. `npx supabase@latest login` (a browser window opens; approve it).
13. `npx supabase@latest link --project-ref <your-project-ref>` (enter the database password from step 1 if asked).
14. `npx supabase@latest secrets set ALLOWED_ORIGINS=https://salehshassen.github.io,http://localhost:8000`
15. `npx supabase@latest functions deploy export --use-api` and then `npx supabase@latest functions deploy admin --use-api`.
    (`--use-api` bundles on Supabase's servers; both functions are well under its 5 MB limit. `supabase/config.toml` keeps "Verify JWT" on.)
16. Check: Supabase → **Edge Functions** lists `export` and `admin`.

## Part E. Publish the website

17. In the `award-builder-frontend` folder, open `js/config.js` and paste your Project URL and publishable key from step 2. Save.
18. In GitHub, open repository `225815`, folder `award-builder`. Delete the old files in that folder (the old version had a `vendor/jspdf.umd.min.js` that is no longer used), then upload everything from `award-builder-frontend` into the same folder and **Commit**. The site updates within a couple of minutes.
19. Optional but recommended: create a new **private** repository (for example `award-builder-backend`) and upload the backend package there. Never add it to the public `225815` repository.

## Part F. Live deployment checks

None of these have been run on the real services yet; they are the checks that prove the deployment works.
Use two browser windows:
- **Window A**: normal window, signed in as **mousasaleh003@gmail.com** (administrator).
- **Window B**: private/incognito window, signed in with a **second Google account** (customer).

Mark each check Pass or Fail. If one fails, note the check number and the exact message shown, then see Troubleshooting.

| # | Check | What to do | Expected result | Pass/Fail |
|---|---|---|---|---|
| F1 | New version is live | Open https://salehshassen.github.io/225815/award-builder/ (reload with Ctrl+Shift+R) | Header shows **Continue with Google**; shape, size, text and preview all work without signing in | |
| F2 | Customer sign-in | Window B: click **Continue with Google**, pick the second account | You return to the site; header shows the account name and **Free plan** | |
| F3 | Account record stored | Supabase → Table Editor → `profiles` | A row for the second account with email, name, `signup_at`, `last_login_at`, status `active`, plan `free` | |
| F4 | Server download | Window B: design an award, go to step 5, tick both checks, **Approve**, click **Download all files** | A ZIP downloads with the drawing PDF, STL, DXF, inscription SVG, artwork PNG, design record and README; header shows **Exports: 1** | |
| F5 | Files are correct | Open the PDF; open the STL in any 3D viewer; open the DXF in any CAD/laser program | Dimensions match the preview; Arabic text in the drawing and artwork is joined correctly | |
| F6 | Admin dashboard | Window A: sign in, click **Admin** in the header | Dashboard lists both accounts with signup date, last login, plan and export count | |
| F7 | Customer blocked from admin | Window B: open `https://salehshassen.github.io/225815/award-builder/admin.html` | **No access** (the server refused); no customer data shown | |
| F8 | Suspend a signed-in user | Window A: click **Suspend** for the second account. Window B (still signed in): click any download | Refused with "Your account is suspended…"; no file saved; header shows **Suspended** | |
| F9 | Suspended user cannot sign in | Window B: **Sign out**, then **Continue with Google** with the same account | Sign-in is refused; the site says the account is suspended (if Google/Supabase words it differently you may see "Sign-in failed: …") | |
| F10 | Restore | Window A: click **Restore**. Window B: sign in again and download | Sign-in and download work again | |
| F11 | Sign-out | Window B: click **Sign out** | Header returns to **Continue with Google**; step 5 asks you to sign in before downloading | |
| F12 | Plans stay free | Window A: check the Plan column | Every account shows **Free**; the second account cannot change its own plan (there is no control for it) | |
| F13 | Export counts | Window A: click **Refresh** | The second account's export count matches the downloads you made (a full package counts once) | |
| F14 | CSV for Excel | Window A: click **Export CSV**, open the file in Excel | One row per account; names (including Arabic), dates, status, plan and exports in separate columns | |
| F15 | No secrets published | On GitHub, search repository 225815 for `sb_secret` and `service_role`; open `award-builder/js/config.js` | No search results; `config.js` contains only the Project URL and an `sb_publishable_` key | |
| F16 | Backend health | Supabase → **Edge Functions** → `export` → **Logs** (then the same for `admin`) | Your requests appear; the only errors are the refusals you caused in F7–F9 | |

When F1–F16 all pass, the deployed services are verified. Until then, treat sign-in, suspension and downloads as unverified on the live site.

## Keeping it running

- Free projects are paused after a week without activity; restore them from the Supabase dashboard if that happens.
- All new users start on the Free plan. Change a customer's plan or access only in the admin dashboard.
- To change the administrator: SQL Editor → `delete from public.admin_allowlist; insert into public.admin_allowlist(email) values ('new@gmail.com');`
- If you ever paste the secret key somewhere public: Project Settings → API Keys → roll (rotate) it immediately.

## Troubleshooting

| What you see | Fix |
|---|---|
| Google: `redirect_uri_mismatch` | The redirect URI in step 6 must match the Callback URL in step 8 exactly. |
| After Google you land on the wrong page | Check Site URL and Redirect URLs (step 10). |
| Header shows nothing / "account service isn't connected" | `js/config.js` still has placeholders (step 17). |
| Download fails with a network or CORS error | Re-run step 14, then redeploy (step 15). |
| ZIP saved but without the PNG | The server could not download its PNG renderer from the CDN at that moment; the other files are fine; try again later. |
| Only you can sign in | The Google app is still in *Testing* (step 7). |
