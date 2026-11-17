<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
np_require_post();

if (!np_is_database_configured()) {
    np_send_json(['error' => 'Signups are not open on this copy of the site.'], 503);
}
$ip = np_client_ip();
if (!np_rate_limit('signup:' . $ip, 20, 60 * 60 * 1000)) {
    np_send_json(['error' => 'Too many attempts. Try again later.'], 429);
}
$input = np_json_input();
if (!is_array($input)) {
    np_send_json(['error' => 'Add an email or a WhatsApp number.'], 400);
}
$email = strtolower(np_trim_str($input['email'] ?? '', 200));
$whatsappRaw = np_trim_str($input['whatsapp'] ?? '', 20);
$language = $input['language'] ?? '';
$topics = $input['topics'] ?? null;
$consent = $input['consent'] ?? false;
$source = np_trim_str($input['source_page'] ?? '', 200);
$token = is_string($input['turnstile_token'] ?? null) ? $input['turnstile_token'] : null;
if (!in_array($language, ['en', 'hi', 'both'], true) || $consent !== true || !is_array($topics) || count($topics) < 1 || count($topics) > 12) {
    np_send_json(['error' => 'Add an email or a WhatsApp number.'], 400);
}
foreach ($topics as $topic) {
    if (!is_string($topic) || trim($topic) === '' || strlen(trim($topic)) > 40) {
        np_send_json(['error' => 'Add an email or a WhatsApp number.'], 400);
    }
}
if ($email !== '' && !np_is_email($email)) {
    np_send_json(['error' => 'Add an email or a WhatsApp number.'], 400);
}
if (!np_verify_turnstile($token, $ip)) {
    np_send_json(['error' => 'Captcha check failed.'], 400);
}
$whatsapp = $whatsappRaw !== '' ? np_normalize_indian_mobile($whatsappRaw) : null;
if ($whatsappRaw !== '' && !$whatsapp) {
    np_send_json(['error' => 'Enter an Indian mobile number.'], 400);
}
if ($email === '' && !$whatsapp) {
    np_send_json(['error' => 'Add an email or a WhatsApp number.'], 400);
}
$channel = ($email !== '' && $whatsapp) ? 'both' : ($email !== '' ? 'email' : 'whatsapp');
$res = np_db_insert('signups', [
    'email' => $email !== '' ? $email : null,
    'whatsapp_e164' => $whatsapp,
    'language' => $language,
    'topics' => array_values(array_map('trim', $topics)),
    'channel' => $channel,
    'consent_text_version' => NP_CONSENT_VERSION,
    'consent_at' => np_iso_now(),
    'source_page' => $source !== '' ? $source : null,
]);
if (!$res['ok'] && !str_contains(strtolower((string) $res['error']), 'duplicate')) {
    np_send_json(['error' => 'Could not save the signup.'], 500);
}
np_send_json(['ok' => true]);
