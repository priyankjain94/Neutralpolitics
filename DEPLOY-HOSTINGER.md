# Deploy on Hostinger (Apache + PHP)

The public site is the same static export as the Cloudflare build (`npm run build` writes `out/`). On Hostinger, Apache serves those files with `.htaccess`, and PHP under `/api/` and `/admin` replaces the Cloudflare Pages Functions.

Do not change DNS or nameservers until Priyank says yes. Leave the Vercel project in place.

## Preview site

- Temporary URL: `https://forward-ivory-mallard-25.hostingersite.com`
- Web root: `public_html/`
- The temp URL now 403s; do not use it for previews. On any host that is not `www.neutralpolitics.in` or `neutralpolitics.in`, `.htaccess` still rewrites `robots.txt` to `robots-preview.txt` (`Disallow: /`). A host-based `X-Robots-Tag` header is not used, because LiteSpeed does not honor `SetEnvIf Host` plus `env=!NP_CANONICAL_HOST` and that rule was noindexing production.

## Build

```
npm run build
```

Output directory: `out`

The build still writes Cloudflare `_headers` / `_routes.json` (harmless on Apache) and then copies:

- `.htaccess` — clean URLs, trailing-slash strip, apex → www, unpublished-story notices, gzip, cache, and a host-safe preview `robots.txt`
- `api/*.php` — public forms and admin session
- `admin/index.php` — login plus read-only desk lists
- `robots-preview.txt`

Clean URLs stay `/news/YYYY/MM/<slug>` and `/hi/news/...`. There was no `/en/` redirect in the Pages Functions, so this deploy does not invent one; `/en/` is still a 404.

## First upload (zip)

Extract `np-site.zip` into `public_html/` so that `index.html`, `.htaccess`, `api/` and `admin/` sit in the web root.

Copy `hostinger/np-config.sample.php` to `np-config.php` **one level above** `public_html` (a sibling of the web root, never inside it) and fill in the runtime secrets. The PHP endpoints load `../np-config.php` from the web root.

## GitHub Actions (auto-publish)

On every push to `main`, the GitHub Actions workflow builds the site and uploads `out/` by FTPS.

The workflow file lives at `hostinger/deploy-hostinger.yml` in this PR because the token used to push it cannot create files under `.github/workflows/` (GitHub requires the `workflow` scope). After merge, or before the first run, copy it once:

```
mkdir -p .github/workflows
cp hostinger/deploy-hostinger.yml .github/workflows/deploy-hostinger.yml
git add .github/workflows/deploy-hostinger.yml && git commit -m "Install the Hostinger FTPS deploy workflow." && git push
```

A GitHub user or token with the `workflow` scope can also just add that file on the branch. That is how the Instagram story sync keeps publishing: a commit to `main` is still enough.

Set these repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `FTP_SERVER` | `46.202.182.134` |
| `FTP_USERNAME` | `u169914107.forward-ivory-mallard-25.hostingersite.com` |
| `FTP_PASSWORD` | The FTP password from hPanel (create or reset it there). Never put it in the repo or in chat. |
| `FTP_SERVER_DIR` | Optional. Leave unset. The workflow uses `./` because this FTP user is the site-specific account whose home is already `public_html`. If a test upload lands *next to* `public_html` instead of inside it, set this to `public_html/`. |

Port 21, protocol `ftps`.

Optional build secrets (baked into HTML; the site still builds without them):

- `NEXT_PUBLIC_SITE_URL` — leave unset to use `https://www.neutralpolitics.in`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Google / Facebook sign-in; buttons stay “Coming soon” if unset
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Turnstile is skipped if unset
- `NEXT_PUBLIC_GSC_VERIFICATION`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — optional at build time, only to bake story overrides into HTML

Runtime secrets belong only in `np-config.php`, not in GitHub Actions:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`
- `IP_HASH_SALT`
- `TURNSTILE_SECRET_KEY`
- `R2_*` only if Supabase storage is not used

Generate the admin password hash with `node scripts/hash-password.mjs '<password>'`. Hostinger PHP should have libsodium; a PHP fallback is included if it does not.

## What PHP covers

Ported, at the same paths the static forms already use:

- `POST /api/error-reports`
- `POST /api/reports`
- `POST /api/contribute/start` and `/api/contribute/complete` (Supabase signed upload, or R2 presign)
- `POST /api/subscribe` and `/api/unsubscribe` (kept so existing form posts do not 404; the public newsletter signup stays off the product)
- `POST /api/admin/login` and `/api/admin/logout`
- `GET /admin`, `/admin/stories`, `/admin/submissions`, `/admin/signups`, `/admin/error-reports` — login plus read-only lists

Not ported (same as the Cloudflare static plan): the story editor and desk status / payment changes still need `npm run dev`. A new or unpublished story appears on the public site on the next build.

## Local check

```
npm run build
php -S 127.0.0.1:8080 -t out hostinger/router.php
```

The router mirrors `.htaccess`. Preview hosts, including this PHP server, send `X-Robots-Tag: noindex`.
