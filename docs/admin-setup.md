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

In the Supabase **SQL Editor**, run the files in this order. Paste the whole file, then run it.

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_admin_desk.sql`

`0001` creates `submissions`, `submission_events`, `signups`, and `reports`. `0002` adds desk status, payment tracking columns, `story_overrides`, `desk_corrections`, and `audit_log`. Row level security is enabled. `anon` and `authenticated` cannot read or write those tables. The service role can.

Payment columns are a record only. The site does not send money.

## 3. Create the video bucket

In **Storage → New bucket**:

- Name: `submissions`
- Public: off
- File size limit: `209715200` (200 MB)
- Allowed MIME types: `video/mp4`, `video/quicktime`, `video/3gpp`, `video/webm`

Or run this in the SQL editor:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  209715200,
  array['video/mp4', 'video/quicktime', 'video/3gpp', 'video/webm']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
```

Leave the bucket private. The browser uploads with a signed URL created by the service role. The desk plays video with a short-lived signed URL. No public read policy is required.

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

Until `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, the contribute form stays on “uploads opening soon” and the newsletter form stays closed. With those two set, both write to the database. Video upload also needs the private `submissions` bucket.

## 6. Sign in

Open `https://neutralpolitics.vercel.app/admin`.

- The page is `noindex` and is not in the sitemap.
- The session cookie is `httpOnly`, `SameSite=Lax`, and `Secure` on HTTPS.
- Five wrong passwords from one IP lock login for 15 minutes.
- Sign out from the desk header.

## What the desk can do

- Dashboard counts and a recent audit log.
- Stories: search and filter, read English and Hindi, edit title, summary, body, category, and sources, mark sensitive, publish or unpublish. Saves update `story_overrides`. Empty fields keep the git text. `sensitive` is an internal flag. It does not hide a story by itself. Publish and unpublish do.
- Submissions: status `new`, `under review`, `verified`, `rejected`, `published`; notes; a link to a story slug; payment amount, status (`unpaid` / `pending` / `paid`), method, reference, and date.
- Signups: list, CSV export, delete a row on request.
- Corrections: add and edit notes shown on the public corrections page.
- CSV export for submissions and signups.

Public pages and the sitemap pick up overrides within about a minute. Middleware blocks a story whose override status is `draft`, including one that is still `published` in git. Pagefind search and the RSS feeds follow the git files until the next deploy.

`NP_ADMIN_FIXTURE` is a local-only switch for screenshots. Do not set it in Vercel.
