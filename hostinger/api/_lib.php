<?php
declare(strict_types=1);

/**
 * Shared helpers for the Hostinger PHP endpoints.
 * Not a public route — Apache returns 403 for /api/_*.
 */

const NP_ADMIN_COOKIE = 'np_admin';
const NP_ADMIN_MAX_AGE = 12 * 60 * 60;
const NP_CONSENT_VERSION = '2026-09-28';
const NP_MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const NP_MAX_VIDEO_SECONDS = 5 * 60;
const NP_VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/3gpp', 'video/webm'];
const NP_VIDEO_EXT = [
    'video/mp4' => 'mp4',
    'video/quicktime' => 'mov',
    'video/3gpp' => '3gp',
    'video/webm' => 'webm',
];
const NP_CATEGORIES = [
    'politics', 'courts', 'economy', 'world', 'sports', 'defence-security',
    'disasters-weather', 'law-order', 'crime', 'explainers', 'np-facts', 'fact-check',
];
const NP_INDIAN_STATES = [
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
    'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
    'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

function np_config(): array
{
    static $cached = null;
    if ($cached !== null) {
        return $cached;
    }
    $cached = [];
    foreach (np_config_candidates() as $path) {
        if ($path && is_file($path) && is_readable($path)) {
            $loaded = include $path;
            if (is_array($loaded)) {
                $cached = $loaded;
                break;
            }
        }
    }
    return $cached;
}

function np_config_candidates(): array
{
    $fromEnv = getenv('NP_CONFIG') ?: '';
    $webRoot = dirname(__DIR__); // .../public_html  (this file lives in public_html/api)
    $above = dirname($webRoot);  // sibling of public_html
    return array_values(array_filter([
        $fromEnv,
        $above . '/np-config.php',
        $webRoot . '/../np-config.php',
    ]));
}

function np_cfg(string $key, string $default = ''): string
{
    $value = np_config()[$key] ?? $default;
    return is_string($value) ? $value : $default;
}

function np_is_database_configured(): bool
{
    return np_cfg('SUPABASE_URL') !== '' && np_cfg('SUPABASE_SERVICE_ROLE_KEY') !== '';
}

function np_is_r2_configured(): bool
{
    return np_cfg('R2_ACCOUNT_ID') !== ''
        && np_cfg('R2_ACCESS_KEY_ID') !== ''
        && np_cfg('R2_SECRET_ACCESS_KEY') !== ''
        && np_cfg('R2_BUCKET') !== '';
}

function np_is_upload_configured(): bool
{
    return np_is_database_configured() || np_is_r2_configured();
}

function np_upload_provider(): ?string
{
    if (np_is_database_configured()) {
        return 'supabase';
    }
    if (np_is_r2_configured()) {
        return 'r2';
    }
    return null;
}

function np_storage_bucket(): string
{
    $bucket = np_cfg('SUPABASE_STORAGE_BUCKET');
    return $bucket !== '' ? $bucket : 'submissions';
}

function np_admin_configured(): bool
{
    $hash = np_cfg('ADMIN_PASSWORD_HASH');
    return np_cfg('ADMIN_EMAIL') !== ''
        && np_cfg('ADMIN_SESSION_SECRET') !== ''
        && str_starts_with($hash, 'scrypt$')
        && count(explode('$', $hash)) === 3;
}

function np_client_ip(): string
{
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        $first = trim(explode(',', $forwarded)[0]);
        if ($first !== '') {
            return $first;
        }
    }
    $real = $_SERVER['HTTP_X_REAL_IP'] ?? '';
    if ($real !== '') {
        return $real;
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function np_hash_ip(string $ip): string
{
    $salt = np_cfg('IP_HASH_SALT', 'np-mvp-default-salt');
    return hash('sha256', $salt . ':' . $ip);
}

function np_iso_now(): string
{
    $dt = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    return $dt->format('Y-m-d\TH:i:s.v\Z');
}

function np_json_input(): mixed
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return null;
    }
    try {
        return json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable) {
        return null;
    }
}

function np_send_json(array $body, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function np_redirect(string $location, int $status = 303, array $extraHeaders = []): never
{
    http_response_code($status);
    header('Location: ' . $location);
    foreach ($extraHeaders as $name => $value) {
        header($name . ': ' . $value);
    }
    exit;
}

function np_request_is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    $forwarded = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
    return $forwarded === 'https';
}

function np_rate_dir(): string
{
    $fromCfg = np_cfg('NP_RATE_LIMIT_DIR');
    if ($fromCfg !== '') {
        return $fromCfg;
    }
    foreach (np_config_candidates() as $path) {
        if ($path && is_file($path)) {
            return dirname($path) . '/np-rate-limit';
        }
    }
    return rtrim(sys_get_temp_dir(), '/') . '/np-rate-limit';
}

function np_rate_limit(string $key, int $limit, int $windowMs): bool
{
    $dir = np_rate_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return false;
    }
    $file = $dir . '/' . hash('sha256', $key) . '.json';
    $fh = @fopen($file, 'c+');
    if ($fh === false) {
        return false;
    }
    if (!flock($fh, LOCK_EX)) {
        fclose($fh);
        return false;
    }
    $raw = stream_get_contents($fh);
    $stamps = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
    if (!is_array($stamps)) {
        $stamps = [];
    }
    $now = (int) floor(microtime(true) * 1000);
    $recent = array_values(array_filter($stamps, static fn($stamp) => is_int($stamp) && ($now - $stamp) < $windowMs));
    if (count($recent) >= $limit) {
        rewind($fh);
        ftruncate($fh, 0);
        fwrite($fh, json_encode($recent));
        flock($fh, LOCK_UN);
        fclose($fh);
        return false;
    }
    $recent[] = $now;
    rewind($fh);
    ftruncate($fh, 0);
    fwrite($fh, json_encode($recent));
    flock($fh, LOCK_UN);
    fclose($fh);
    return true;
}

function np_verify_turnstile(?string $token, string $ip): bool
{
    $secret = np_cfg('TURNSTILE_SECRET_KEY');
    if ($secret === '') {
        return true;
    }
    if (!$token) {
        return false;
    }
    $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    if ($ch === false) {
        return false;
    }
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'secret' => $secret,
            'response' => $token,
            'remoteip' => $ip,
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $raw = curl_exec($ch);
    $ok = curl_errno($ch) === 0 && curl_getinfo($ch, CURLINFO_HTTP_CODE) < 400;
    curl_close($ch);
    if (!$ok || !is_string($raw)) {
        return false;
    }
    $data = json_decode($raw, true);
    return is_array($data) && !empty($data['success']);
}

function np_normalize_indian_mobile(string $input): ?string
{
    $digits = preg_replace('/\D+/', '', $input) ?? '';
    $local = $digits;
    if (str_starts_with($local, '91') && strlen($local) === 12) {
        $local = substr($local, 2);
    }
    if (str_starts_with($local, '0') && strlen($local) === 11) {
        $local = substr($local, 1);
    }
    if (!preg_match('/^[6-9]\d{9}$/', $local)) {
        return null;
    }
    return '+91' . $local;
}

function np_is_email(string $value): bool
{
    return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $value);
}

function np_is_uuid(string $value): bool
{
    return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value);
}

function np_uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20, 12));
}

function np_trim_str(mixed $value, int $max): string
{
    if (!is_string($value) && !is_numeric($value)) {
        return '';
    }
    return mb_substr(trim((string) $value), 0, $max);
}

function np_b64url_encode(string $raw): string
{
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function np_b64url_decode(string $value): ?string
{
    $pad = strtr($value, '-_', '+/');
    $pad .= str_repeat('=', (4 - strlen($pad) % 4) % 4);
    $raw = base64_decode($pad, true);
    return $raw === false ? null : $raw;
}

function np_sign_session(string $email, string $secret): string
{
    $payload = np_b64url_encode(json_encode([
        'email' => $email,
        'exp' => (int) floor(microtime(true) * 1000) + NP_ADMIN_MAX_AGE * 1000,
    ], JSON_UNESCAPED_SLASHES));
    return $payload . '.' . np_b64url_encode(hash_hmac('sha256', $payload, $secret, true));
}

function np_read_session(?string $token, string $secret): ?array
{
    if (!$token || $secret === '') {
        return null;
    }
    $split = strrpos($token, '.');
    if ($split === false || $split === 0) {
        return null;
    }
    $payload = substr($token, 0, $split);
    $sig = substr($token, $split + 1);
    $expected = np_b64url_encode(hash_hmac('sha256', $payload, $secret, true));
    if (!hash_equals($expected, $sig)) {
        return null;
    }
    $raw = np_b64url_decode($payload);
    if ($raw === null) {
        return null;
    }
    try {
        $data = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
    } catch (Throwable) {
        return null;
    }
    if (!is_array($data) || empty($data['email']) || !is_numeric($data['exp'] ?? null)) {
        return null;
    }
    if ((int) $data['exp'] <= (int) floor(microtime(true) * 1000)) {
        return null;
    }
    $allowed = np_cfg('ADMIN_EMAIL');
    if ($allowed === '' || strtolower((string) $data['email']) !== strtolower($allowed)) {
        return null;
    }
    return ['email' => (string) $data['email']];
}

function np_scrypt(string $password, string $salt, int $length = 32): string
{
    if (function_exists('sodium_crypto_pwhash_scryptsalsa208sha256_ll')) {
        return sodium_crypto_pwhash_scryptsalsa208sha256_ll($password, $salt, 16384, 8, 1, $length);
    }
    return np_scrypt_php($password, $salt, 16384, 8, 1, $length);
}

/**
 * RFC 7914 scrypt, used only when libsodium is unavailable.
 * Matches Node crypto.scryptSync(password, salt, 32) defaults (N=16384, r=8, p=1).
 */
function np_scrypt_php(string $password, string $salt, int $n, int $r, int $p, int $dkLen): string
{
    $blockSize = 128 * $r;
    $B = hash_pbkdf2('sha256', $password, $salt, 1, $p * $blockSize, true);
    for ($i = 0; $i < $p; $i++) {
        $block = substr($B, $i * $blockSize, $blockSize);
        $B = substr_replace($B, np_scrypt_romix($block, $n, $r), $i * $blockSize, $blockSize);
    }
    return hash_pbkdf2('sha256', $password, $B, 1, $dkLen, true);
}

function np_scrypt_romix(string $block, int $n, int $r): string
{
    $x = $block;
    $v = [];
    for ($i = 0; $i < $n; $i++) {
        $v[$i] = $x;
        $x = np_scrypt_blockmix($x, $r);
    }
    for ($i = 0; $i < $n; $i++) {
        $j = np_scrypt_integerify($x, $r) % $n;
        $x = np_scrypt_blockmix($x ^ $v[$j], $r);
    }
    return $x;
}

function np_scrypt_integerify(string $block, int $r): int
{
    $offset = (2 * $r - 1) * 64;
    $unpacked = unpack('V', substr($block, $offset, 4));
    return $unpacked[1] & 0xffffffff;
}

function np_scrypt_blockmix(string $block, int $r): string
{
    $x = substr($block, -64);
    $out = '';
    $even = '';
    $odd = '';
    for ($i = 0; $i < 2 * $r; $i++) {
        $x = np_scrypt_salsa208($x ^ substr($block, $i * 64, 64));
        if ($i % 2 === 0) {
            $even .= $x;
        } else {
            $odd .= $x;
        }
    }
    return $even . $odd;
}

function np_scrypt_salsa208(string $b): string
{
    $u = unpack('V16', $b);
    $x = [];
    for ($i = 1; $i <= 16; $i++) {
        $x[$i - 1] = $u[$i];
    }
    $orig = $x;
    $rotl = static function (int $a, int $n): int {
        $a &= 0xffffffff;
        return (($a << $n) | ($a >> (32 - $n))) & 0xffffffff;
    };
    for ($i = 0; $i < 8; $i += 2) {
        $x[4] ^= $rotl($x[0] + $x[12], 7);
        $x[8] ^= $rotl($x[4] + $x[0], 9);
        $x[12] ^= $rotl($x[8] + $x[4], 13);
        $x[0] ^= $rotl($x[12] + $x[8], 18);
        $x[9] ^= $rotl($x[5] + $x[1], 7);
        $x[13] ^= $rotl($x[9] + $x[5], 9);
        $x[1] ^= $rotl($x[13] + $x[9], 13);
        $x[5] ^= $rotl($x[1] + $x[13], 18);
        $x[14] ^= $rotl($x[10] + $x[6], 7);
        $x[2] ^= $rotl($x[14] + $x[10], 9);
        $x[6] ^= $rotl($x[2] + $x[14], 13);
        $x[10] ^= $rotl($x[6] + $x[2], 18);
        $x[3] ^= $rotl($x[15] + $x[11], 7);
        $x[7] ^= $rotl($x[3] + $x[15], 9);
        $x[11] ^= $rotl($x[7] + $x[3], 13);
        $x[15] ^= $rotl($x[11] + $x[7], 18);
        $x[1] ^= $rotl($x[0] + $x[3], 7);
        $x[2] ^= $rotl($x[1] + $x[0], 9);
        $x[3] ^= $rotl($x[2] + $x[1], 13);
        $x[0] ^= $rotl($x[3] + $x[2], 18);
        $x[6] ^= $rotl($x[5] + $x[4], 7);
        $x[7] ^= $rotl($x[6] + $x[5], 9);
        $x[4] ^= $rotl($x[7] + $x[6], 13);
        $x[5] ^= $rotl($x[4] + $x[7], 18);
        $x[11] ^= $rotl($x[10] + $x[9], 7);
        $x[8] ^= $rotl($x[11] + $x[10], 9);
        $x[9] ^= $rotl($x[8] + $x[11], 13);
        $x[10] ^= $rotl($x[9] + $x[8], 18);
        $x[12] ^= $rotl($x[15] + $x[14], 7);
        $x[13] ^= $rotl($x[12] + $x[15], 9);
        $x[14] ^= $rotl($x[13] + $x[12], 13);
        $x[15] ^= $rotl($x[14] + $x[13], 18);
    }
    $out = '';
    for ($i = 0; $i < 16; $i++) {
        $out .= pack('V', ($x[$i] + $orig[$i]) & 0xffffffff);
    }
    return $out;
}

function np_verify_password(string $password, string $stored): bool
{
    $parts = explode('$', $stored);
    if (count($parts) !== 3 || $parts[0] !== 'scrypt' || $parts[1] === '' || $parts[2] === '') {
        return false;
    }
    $actual = np_scrypt($password, $parts[1], 32);
    $expected = hex2bin($parts[2]);
    if ($expected === false || strlen($actual) !== strlen($expected)) {
        return false;
    }
    return hash_equals($expected, $actual);
}

function np_same_email(string $input, string $expected): bool
{
    $left = hash('sha256', strtolower(trim($input)), true);
    $right = hash('sha256', strtolower(trim($expected)), true);
    return hash_equals($left, $right);
}

function np_credentials_match(string $email, string $password): bool
{
    if (!np_admin_configured()) {
        return false;
    }
    $okEmail = np_same_email($email, np_cfg('ADMIN_EMAIL'));
    $okPassword = np_verify_password($password, np_cfg('ADMIN_PASSWORD_HASH'));
    return $okEmail && $okPassword;
}

function np_cookie_header(string $token, int $maxAge): string
{
    $parts = [
        NP_ADMIN_COOKIE . '=' . $token,
        'HttpOnly',
        'SameSite=Lax',
        'Path=/',
        'Max-Age=' . $maxAge,
    ];
    if (np_request_is_https()) {
        $parts[] = 'Secure';
    }
    return implode('; ', $parts);
}

function np_session_email(): ?string
{
    $token = $_COOKIE[NP_ADMIN_COOKIE] ?? '';
    $session = np_read_session($token, np_cfg('ADMIN_SESSION_SECRET'));
    return $session['email'] ?? null;
}

function np_supabase(string $method, string $path, mixed $body = null, array $query = [], array $headers = []): array
{
    $base = rtrim(np_cfg('SUPABASE_URL'), '/');
    $key = np_cfg('SUPABASE_SERVICE_ROLE_KEY');
    if ($base === '' || $key === '') {
        return ['ok' => false, 'status' => 0, 'data' => null, 'error' => 'not configured'];
    }
    $url = $base . $path;
    if ($query) {
        $url .= (str_contains($path, '?') ? '&' : '?') . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    }
    $ch = curl_init($url);
    if ($ch === false) {
        return ['ok' => false, 'status' => 0, 'data' => null, 'error' => 'curl'];
    }
    $reqHeaders = array_merge([
        'apikey: ' . $key,
        'Authorization: Bearer ' . $key,
        'Content-Type: application/json',
        'Accept: application/json',
    ], $headers);
    $opts = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $reqHeaders,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HEADER => true,
    ];
    if ($body !== null) {
        $opts[CURLOPT_POSTFIELDS] = is_string($body) ? $body : json_encode($body, JSON_UNESCAPED_SLASHES);
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);
    if ($errno !== 0 || !is_string($raw)) {
        return ['ok' => false, 'status' => $status, 'data' => null, 'error' => 'network'];
    }
    $respBody = substr($raw, $headerSize);
    $data = $respBody === '' ? null : json_decode($respBody, true);
    $ok = $status >= 200 && $status < 300;
    $error = null;
    if (!$ok) {
        $error = is_array($data) ? (string) ($data['message'] ?? $data['error'] ?? $data['msg'] ?? 'error') : ($respBody ?: 'error');
    }
    return ['ok' => $ok, 'status' => $status, 'data' => $data, 'error' => $error];
}

function np_db_insert(string $table, array $row): array
{
    return np_supabase('POST', '/rest/v1/' . rawurlencode($table), $row, [], ['Prefer: return=minimal']);
}

function np_db_update(string $table, array $row, array $query): array
{
    return np_supabase('PATCH', '/rest/v1/' . rawurlencode($table), $row, $query, ['Prefer: return=minimal']);
}

function np_db_select(string $table, string $select, array $query = []): array
{
    $query['select'] = $select;
    return np_supabase('GET', '/rest/v1/' . rawurlencode($table), null, $query);
}

function np_storage_signed_upload_url(string $key): ?string
{
    $bucket = rawurlencode(np_storage_bucket());
    $path = implode('/', array_map('rawurlencode', explode('/', $key)));
    $res = np_supabase('POST', '/storage/v1/object/upload/sign/' . $bucket . '/' . $path, new stdClass());
    if (!$res['ok'] || !is_array($res['data'])) {
        return null;
    }
    $url = $res['data']['signedUrl'] ?? $res['data']['signedURL'] ?? $res['data']['url'] ?? null;
    if (!is_string($url) || $url === '') {
        return null;
    }
    if (str_starts_with($url, 'http')) {
        return $url;
    }
    return rtrim(np_cfg('SUPABASE_URL'), '/') . '/storage/v1' . (str_starts_with($url, '/') ? $url : '/' . $url);
}

function np_storage_signed_url(string $key, int $expires = 120): ?string
{
    $bucket = rawurlencode(np_storage_bucket());
    $path = implode('/', array_map('rawurlencode', explode('/', $key)));
    $res = np_supabase('POST', '/storage/v1/object/sign/' . $bucket . '/' . $path, ['expiresIn' => $expires]);
    if (!$res['ok'] || !is_array($res['data'])) {
        return null;
    }
    $url = $res['data']['signedUrl'] ?? $res['data']['signedURL'] ?? $res['data']['url'] ?? null;
    if (!is_string($url) || $url === '') {
        return null;
    }
    if (str_starts_with($url, 'http')) {
        return $url;
    }
    return rtrim(np_cfg('SUPABASE_URL'), '/') . '/storage/v1' . (str_starts_with($url, '/') ? $url : '/' . $url);
}

function np_http_head(string $url): array
{
    $ch = curl_init($url);
    if ($ch === false) {
        return ['ok' => false, 'status' => 0, 'length' => 0, 'type' => ''];
    }
    curl_setopt_array($ch, [
        CURLOPT_NOBODY => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $length = (int) curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
    $type = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    return ['ok' => $status >= 200 && $status < 300, 'status' => $status, 'length' => $length, 'type' => $type];
}

function np_rfc3986(string $value): string
{
    return str_replace(['+', '%7E'], ['%20', '~'], rawurlencode($value));
}

function np_presign_r2(string $method, string $key, ?string $contentType = null, int $expires = 900): string
{
    $accountId = np_cfg('R2_ACCOUNT_ID');
    $accessKey = np_cfg('R2_ACCESS_KEY_ID');
    $secret = np_cfg('R2_SECRET_ACCESS_KEY');
    $bucket = np_cfg('R2_BUCKET');
    $host = $accountId . '.r2.cloudflarestorage.com';
    $region = 'auto';
    $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    $amzDate = $now->format('Ymd\THis\Z');
    $dateStamp = $now->format('Ymd');
    $scope = $dateStamp . '/' . $region . '/s3/aws4_request';
    $credential = $accessKey . '/' . $scope;
    $canonicalUri = '/' . $bucket . '/' . implode('/', array_map('np_rfc3986', explode('/', $key)));
    $signedHeaders = $contentType ? 'content-type;host' : 'host';
    $query = [
        ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
        ['X-Amz-Credential', $credential],
        ['X-Amz-Date', $amzDate],
        ['X-Amz-Expires', (string) $expires],
        ['X-Amz-SignedHeaders', $signedHeaders],
    ];
    $canonicalQuery = implode('&', array_map(
        static fn($pair) => np_rfc3986($pair[0]) . '=' . np_rfc3986($pair[1]),
        $query
    ));
    $canonicalHeaders = $contentType
        ? "content-type:{$contentType}\nhost:{$host}\n"
        : "host:{$host}\n";
    $canonicalRequest = implode("\n", [
        $method,
        $canonicalUri,
        $canonicalQuery,
        $canonicalHeaders,
        $signedHeaders,
        'UNSIGNED-PAYLOAD',
    ]);
    $stringToSign = implode("\n", [
        'AWS4-HMAC-SHA256',
        $amzDate,
        $scope,
        hash('sha256', $canonicalRequest),
    ]);
    $signingKey = hash_hmac('sha256', 'aws4_request', hash_hmac(
        'sha256',
        's3',
        hash_hmac('sha256', $region, hash_hmac('sha256', $dateStamp, 'AWS4' . $secret, true), true),
        true
    ), true);
    $signature = hash_hmac('sha256', $stringToSign, $signingKey);
    return "https://{$host}{$canonicalUri}?{$canonicalQuery}&X-Amz-Signature={$signature}";
}

function np_published(): array
{
    static $data = null;
    if ($data !== null) {
        return $data;
    }
    $candidates = [
        dirname(__DIR__) . '/admin/_data/published.json',
        __DIR__ . '/_data/published.json',
        dirname(__DIR__, 2) . '/data/published.json',
    ];
    foreach ($candidates as $path) {
        if (is_file($path)) {
            $decoded = json_decode((string) file_get_contents($path), true);
            if (is_array($decoded)) {
                $data = [
                    'en' => $decoded['en'] ?? [],
                    'hi' => $decoded['hi'] ?? [],
                    'draft' => $decoded['draft'] ?? [],
                ];
                return $data;
            }
        }
    }
    $data = ['en' => [], 'hi' => [], 'draft' => []];
    return $data;
}

function np_esc(mixed $value): string
{
    return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function np_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function np_require_post(): void
{
    if (np_method() !== 'POST') {
        header('Allow: POST');
        np_send_json(['error' => 'Method not allowed'], 405);
    }
}
