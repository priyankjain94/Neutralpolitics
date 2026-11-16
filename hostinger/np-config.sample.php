<?php
/**
 * Neutral Politics — Hostinger runtime config.
 *
 * Copy this file to np-config.php ONE LEVEL ABOVE the web root
 * (sibling of public_html, not inside it) and fill in the values.
 *
 *   domains/<site>/public_html/   <- extract the site zip here
 *   domains/<site>/np-config.php  <- this file, filled in
 *
 * Never commit the filled file. Never put it inside public_html.
 * The public NEXT_PUBLIC_* values below are optional at runtime;
 * they are baked into the HTML at build time (GitHub Actions secrets).
 */
declare(strict_types=1);

return [
    // Required for report-an-error, contribute uploads, and desk lists.
    'SUPABASE_URL' => '',
    'SUPABASE_SERVICE_ROLE_KEY' => '',
    // Optional. Defaults to "submissions".
    'SUPABASE_STORAGE_BUCKET' => '',

    // /admin stays closed until all three are set.
    // Hash: node scripts/hash-password.mjs '<password>'
    'ADMIN_EMAIL' => '',
    'ADMIN_PASSWORD_HASH' => '',
    'ADMIN_SESSION_SECRET' => '',

    // Salt for hashing contributor IPs. Use a long random string.
    'IP_HASH_SALT' => '',

    // Optional Cloudflare Turnstile. If empty, forms still work and the check is skipped.
    'TURNSTILE_SECRET_KEY' => '',

    // Only used if Supabase storage is not configured.
    'R2_ACCOUNT_ID' => '',
    'R2_ACCESS_KEY_ID' => '',
    'R2_SECRET_ACCESS_KEY' => '',
    'R2_BUCKET' => '',

    // Optional override for the rate-limit file directory (outside the web root).
    'NP_RATE_LIMIT_DIR' => '',
];
