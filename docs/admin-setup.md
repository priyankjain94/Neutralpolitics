# Admin desk setup

The public site works with no accounts connected. `/admin` stays closed until you set the variables below in Vercel. The password never goes in this repository.

Story files in git stay the base copy. Edits, publish flags, corrections, submissions, signups, and the audit log live in Supabase. The site does not commit those changes with a GitHub token.

## 1. Create a free Supabase project

1. Sign in at [supabase.com](https://supabase.com) and create a project on the free tier.
2. Wait until the database is ready.
3. In **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

The service role key bypasses row level security. Use it only on the server. Do not put it in any `NEXT_PUBLIC_` variable, and do not commit it.

## 2. Run the SQL

In the Supabase **SQL Editor**, paste `supabase/setup_all.sql` and run it once. It is safe to run again. It applies the migrations in order and creates the private video bucket.

The separate files, if you prefer them one at a time, are:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_admin_desk.sql`
3. `supabase/migrations/0003_error_reports.sql`

`0001` creates `submissions`, `submission_events`, `signups`, and `reports`. `0002` adds desk status, payment tracking columns, `story_overrides`, `desk_corrections`, and `audit_log`. `0003` creates `error_reports` for the public “Report an error” form. Row level security is enabled. `anon` and `authenticated` cannot read or write those tables. The service role can.

Payment columns are a record only. The site does not send money.

## 3. Video bucket

`setup_all.sql` inserts a private Storage bucket named `submissions` (200 MB, video MIME types only). If that insert cannot see `storage.buckets`, create the bucket by hand:

- Name: `submissions`
- Public: off
- File size limit: `209715200` (200 MB)
- Allowed MIME types: `video/mp4`, `video/quicktime`, `video/3gpp`, `video/webm`

Leave the bucket private. The contribute form asks `/api/contribute/start` for a signed upload URL, the browser uploads straight to the bucket, then `/api/contribute/complete` marks the row. The row stores the consent text version, consent time, and a salted IP hash. The desk plays the file with a short-lived signed URL. No public read policy is required.

`SUPABASE_STORAGE_BUCKET` is optional. Leave it empty to use the name `submissions`.

Cloudflare R2 is used only when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are both unset. Prefer the Supabase bucket.

## 4. Hash the admin password

On your own machine, from this repository:

```bash
node scripts/hash-password.mjs 'a long password you choose'
```

The script prints one line that starts with `scrypt$`. That line is `ADMIN_PASSWORD_HASH`.

- Do not commit the hash.
- Do not commit the password.
- Do not paste either into a GitHub issue, pull request, or this file.

Generate a session secret as well:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

That line is `ADMIN_SESSION_SECRET`.

## 5. Set Vercel environment variables

Project: `neutralpolitics`. Team: `neutral-politics`. Add these for Production (and Preview if you want the desk there too), then redeploy.

| Variable | Value |
| --- | --- |
| `ADMIN_EMAIL` | `priyank.cam@gmail.com` |
| `ADMIN_PASSWORD_HASH` | the `scrypt$…` line from step 4 |
| `ADMIN_SESSION_SECRET` | the random string from step 4 |
| `SUPABASE_URL` | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |

Optional:

| Variable | Value |
| --- | --- |
| `SUPABASE_STORAGE_BUCKET` | `submissions` only if you used a different name |
| `IP_HASH_SALT` | a long random string. Consent IP hashes use this salt |

Until `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET` are all set, `/admin` shows **Admin is not configured**. It does not open.

Until `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, the contribute form stays on “uploads opening soon”, the newsletter form stays closed, and “Report an error” says the form is temporarily unavailable and gives the corrections email. With those two set, newsletter signups write to `signups` (with the consent time), contributor videos write to `submissions` and the private bucket, and error reports write to `error_reports`.

## 6. Sign in

Open `https://neutralpolitics.vercel.app/admin`.

- The page is `noindex` and is not in the sitemap.
- The session cookie is `httpOnly`, `SameSite=Lax`, and `Secure` on HTTPS.
- Five wrong passwords from one IP lock login for 15 minutes.
- Sign out from the desk header.

## What the desk can do

- Dashboard counts, including open error reports, and a recent audit log.
- Stories: search and filter, read English and Hindi, edit title, summary, body, category, and sources, mark sensitive, publish or unpublish. Saves update `story_overrides`. Empty fields keep the git text. `sensitive` is an internal flag. It does not hide a story by itself. Publish and unpublish do.
- Submissions: status `new`, `under review`, `verified`, `rejected`, `published`; notes; a link to a story slug; payment amount, status (`unpaid` / `pending` / `paid`), method, reference, and date.
- Signups: list, CSV export, delete a row on request.
- Corrections: add and edit notes shown on the public corrections page.
- Error reports: list and filter (`new`, `reviewing`, `fixed`, `rejected`), notes, a link to the story, one click that copies the suggested correction onto the public corrections page, and CSV export.
- CSV export for submissions, signups, and error reports.

Public pages and the sitemap pick up overrides within about a minute. Middleware blocks a story whose override status is `draft`, including one that is still `published` in git. Pagefind search and the RSS feeds follow the git files until the next deploy.

`NP_ADMIN_FIXTURE` is a local-only switch for screenshots. Do not set it in Vercel.
