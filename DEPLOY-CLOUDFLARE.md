# Deploy on Cloudflare Pages

The public site is a static export. Cloudflare Pages serves the files in `out/`. A Pages Function runs only to add the non-www `noindex` header, redirect the apex host and trailing slashes, send unpublished story URLs to the homepage notice, and handle the forms that need a server.

Build command:

```
npm run build
```

Output directory: `out`

Do not commit secrets. Set the names below in the Pages project. `NEXT_PUBLIC_*`, `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` are read while the HTML is built, so they must be available to the build, not only to the functions. The function secrets must be available at runtime. The same production variable can be both.

## Build and runtime

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `IP_HASH_SALT`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_GSC_VERIFICATION`
- `BING_SITE_VERIFICATION`
- `NEXT_PUBLIC_SITE_URL`

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are optional at build time. If they are present, story overrides are baked into the HTML. They are required at runtime for the report, signup, contribute and desk functions.

## Optional

- `INDEXNOW_PING` set to `1` on a production build pings IndexNow after the files are written. Leave it unset for preview builds.
- `NP_STATIC` is set by `npm run build`. Do not set `NP_ADMIN_FIXTURE` in production.

Search is Pagefind files under `/pagefind/`. There is no search server.

`/admin` login and the read-only desk lists are Pages Functions. The story editor still uses `npm run dev`, because those screens are Next server actions. A new or unpublished story appears on the public site on the next build.

DNS stays a separate step. This repo does not change DNS, Instagram or the Vercel project.
