# Neutral Politics

The website for [Neutral Politics](https://www.instagram.com/theneutralpolitics/) (`@theneutralpolitics`): a neutral, verified Indian news desk. This is the first working version. It is a classic newspaper layout, in English and Hindi, with articles stored as Markdown in this repository.

## Stack

- Next.js (App Router) and TypeScript
- Articles as Markdown plus a shared JSON file
- Pagefind for search, one index per language
- Supabase Postgres for contributor videos, newsletter signups, and reader reports
- Cloudflare R2 for private video uploads (Supabase Storage is the fallback)
- Deployable on Vercel Hobby with no paid services

The site builds and runs with no accounts connected. Forms that need a database or storage say so, instead of failing the build.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Hindi is at [http://localhost:3000/hi](http://localhost:3000/hi).

Search uses the Pagefind index created by `npm run build` (or `npm run search:index`). After a production build:

```bash
npm run build
npm start
```

## Environment variables

Copy `.env.example`. Never commit `.env` or `.env.local`. This repository is public.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, no trailing slash |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key. Not for the browser |
| `SUPABASE_STORAGE_BUCKET` | Optional private bucket if you are not using R2 |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 for contributor video |
| `ADMIN_PASSWORD` | Password for `/admin`. There is no default |
| `IP_HASH_SALT` | Salt for hashing IPs on submissions |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Optional Cloudflare Turnstile |
| `TRANSLATION_PROVIDER` | `none` (default) or `http` |
| `TRANSLATION_HTTP_URL`, `TRANSLATION_HTTP_KEY` | Your own translator. See below |
| `IMPORT_ALWAYS_DRAFT` | `true` keeps every import as a draft |

Leave secrets empty until you create the accounts yourself. This project does not create them.

## Content

Each story is three files:

```text
content/news/2026/09/bank-strike-28-30-sep.json
content/news/2026/09/bank-strike-28-30-sep.en.md
content/news/2026/09/bank-strike-28-30-sep.hi.md
```

The JSON holds the shared facts: status (`draft` or `published`), `status_hi`, Instagram shortcode, category, sources, and dates. The Markdown files hold the headline, standfirst, body, key facts, and the Hindi translation record.

`status: draft` is never rendered, never added to the sitemap, RSS, or search index. A direct URL redirects away. `sensex-fall` is one file that stays a draft.

English URLs are `/news/2026/09/<slug>`. Hindi URLs are `/hi/news/2026/09/<slug>`. Slugs stay in Latin script. Each page sets `hreflang` for `en-IN`, `hi-IN`, and `x-default`.

Categories: Politics, Courts, Economy, World, Sports, Defence & Security, Disasters & Weather, Law & Order, Explainers, NP Facts, Fact-check. The URL segment is always the English slug, including on Hindi pages (`/hi/category/courts`).

## Importer

The posting workflow writes a `post.json` (schema in `schema/post.schema.json`, example in `examples/post.json`). The importer turns that file into the three content files and dedupes on the Instagram shortcode. The same shortcode updates the existing article. It does not create a second one.

```bash
npm run import -- examples/post.json --out /tmp/np-import-test
npm run import -- examples/post.json --out /tmp/np-import-test
```

The second run prints `Unchanged`.

Validation requires a shortcode, a headline, and two source URLs from two outlet groups. `CLAIMED` rows are skipped. Sensitive stories, NP Facts, unknown categories, corrections, and anything imported while `IMPORT_ALWAYS_DRAFT` is not `false` are written as drafts.

A relative `poster` or `caption_file` is read from the `post.json` directory. The poster is copied into `public/media/<year>/<month>/<slug>/`.

## Hindi translation

Translation is a step in the importer, not a paid API baked into the site. The default provider `none` copies the English fields, records `translation.status: machine`, and leaves Hindi as a draft.

To plug in your own translator, set `TRANSLATION_PROVIDER=http` and `TRANSLATION_HTTP_URL`. The request and response shapes are in `scripts/translators/README.md`. The glossary lives in `content/glossary.json`. Outlet names, source headlines, URLs, and photo credits are not translated.

Automatic checks compare numbers, glossary terms, and length. A failed check keeps `status_hi` as `draft`. The header toggle then sends the reader to the Hindi home with a short notice instead of a broken article.

Published stories are written in both languages. Hindi files in this import are marked `translation.engine: cloud-agent` and `translation.status: machine`. Drafts stay off the public site in both languages.

## Database

Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor. It creates:

- `submissions` — contributor videos, statuses `new → verifying → approved / rejected → posted`, notes, and a nullable `payment_status` that this version does not use
- `submission_events` — the review log
- `signups` — newsletter or WhatsApp numbers, with consent, and no sending
- `reports` — corrections, fact-check claims, and contact messages

Row level security is on. The anonymous key cannot read or write. The site uses the service role only on the server.

Contributor video does not pass through Vercel. The browser asks `/api/contribute/start` for a signed URL, uploads straight to R2 (or Supabase Storage), then calls `/api/contribute/complete`. The limit shown on the form is 500 MB and about five minutes. Rejected files should be deleted after 30 days. That cleanup is operational, not a paid job in this version.

## Admin

`/admin` is password protected with `ADMIN_PASSWORD`, `noindex`, and absent from the public nav. After signing in:

- `/admin/submissions` lists and filters submissions
- `/admin/submissions/<id>` plays a short-lived video URL, stores notes, a verification checklist, and status changes
- `/admin/signups` lists signups and exports CSV
- `/admin/reports` updates correction, fact-check, and contact messages

Payment is shown as an em dash. Nothing is paid out.

## Search, feeds, and SEO

Pagefind indexes the built HTML for each language from the `lang` attribute. Hindi search has a link to search English.

- `/rss.xml` and `/hi/rss.xml`
- `/category/<name>/rss.xml`
- `/sitemap.xml` with hreflang alternates
- `/news-sitemap.xml` for stories from the last 48 hours
- `NewsArticle` JSON-LD, and `ClaimReview` on fact-checks
- Open Graph images per article

`robots.txt` disallows `/admin` and `/api`. Preview deployments (`VERCEL_ENV=preview`) are `noindex`.

## Deploying on Vercel

The connected project is `neutralpolitics` on the Hobby plan, team `neutral-politics`. Preview trigger: 28 Sep 2026, 17:40 UTC.

- **Framework:** Next.js.
- **Build command:** leave the framework default. Do not override it. In this repo `npm run build` runs the Pagefind index, then `next build`.
- **Environment variables:** none are required. The site builds, and the public pages render, with every variable unset. Contributor uploads, the database, and `/admin` stay closed until you add them.

1. Push this repository.
2. Import the project in Vercel with the Next.js preset. Do not upgrade to Pro unless you have decided to.
3. Add variables from `.env.example` in the Vercel project settings only when you connect those services. Leave unused ones empty.
4. Deploy with the default build command.
5. Point a domain when you have bought one. Set `NEXT_PUBLIC_SITE_URL` to that origin and redeploy so canonical URLs, sitemaps, and share links match.

Do not put keys in the repository. Vercel environment variables are the right place.

## What is deliberately not included

No email is sent. No WhatsApp message is sent. No contributor is paid. No analytics script is loaded. Instagram is embedded only after a tap, from the public embed URL, with no token.
