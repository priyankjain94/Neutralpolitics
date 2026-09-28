# Google and Facebook sign-in

The site shows **Continue with Google** and **Continue with Facebook** on the newsletter signup and on step 3 of the contributor form. Until the variables below are set, those buttons stay disabled and say **Coming soon**. They do not call Supabase, and they do not throw.

Sign-in uses Supabase Auth in the browser: `signInWithOAuth` with the providers `google` and `facebook`. After the provider returns, `/auth/callback` exchanges the code and sends the reader back to the page they started on. A successful sign-in fills name and email on the contributor form, and email on the newsletter form. The reader still confirms consent before anything is stored.

Do not put the service-role key in any `NEXT_PUBLIC_` variable. This repository is public.

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → URL configuration** set:
   - Site URL: `https://neutralpolitics.vercel.app`
   - Redirect URLs (add both):
     - `https://neutralpolitics.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
3. In **Project Settings → API**, copy the project URL and the **anon public** key. Those are the two Vercel variables in section 4. The service-role key stays server-only (`SUPABASE_SERVICE_ROLE_KEY`) and is not used for these buttons.

## 2. Google Cloud OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Configure the OAuth consent screen (External is fine for a public site).
3. **Create credentials → OAuth client ID → Web application**.
4. Authorized JavaScript origins:
   - `https://neutralpolitics.vercel.app`
   - `http://localhost:3000`
5. Authorized redirect URI: the callback Supabase shows on the Google provider page, which looks like `https://<project-ref>.supabase.co/auth/v1/callback`. This is Supabase’s URL, not the site’s `/auth/callback`.
6. In Supabase, open **Authentication → Providers → Google**, enable it, and paste the Google **Client ID** and **Client secret**.

## 3. Meta (Facebook) app

1. Open [developers.facebook.com](https://developers.facebook.com/) and create an app. Add the **Facebook Login** product.
2. Under Facebook Login → Settings, set Valid OAuth Redirect URIs to the same Supabase callback: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase, open **Authentication → Providers → Facebook**, enable it, and paste the Meta **App ID** and **App secret**.
4. While the Meta app is in Development mode, only app roles (admins, developers, testers) can sign in. Switch the app to Live, and complete App Review if Meta asks for `email` and `public_profile`, before readers can use the button.

## 4. Vercel environment variables

In the Vercel project **neutralpolitics**, add:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anon public key from Supabase. Not the service-role key. |

Redeploy production after saving them. `NEXT_PUBLIC_` values are baked in at build time, so a redeploy is required before the buttons become active.

The same names belong in `.env.local` for `npm run dev`. Leave them empty to keep the Coming soon state.
