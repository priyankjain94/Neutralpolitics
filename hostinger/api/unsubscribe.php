<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
np_require_post();

if (!np_is_database_configured()) {
    np_send_json(['error' => 'Signups are not open on this copy of the site.'], 503);
}
$ip = np_client_ip();
if (!np_rate_limit('unsub:' . $ip, 20, 60 * 60 * 1000)) {
    np_send_json(['error' => 'Too many attempts. Try again later.'], 429);
}
$input = np_json_input();
if (!is_array($input)) {
    np_send_json(['error' => 'Add an email or a WhatsApp number.'], 400);
}
$email = strtolower(np_trim_str($input['email'] ?? '', 200));
$whatsappRaw = np_trim_str($input['whatsapp'] ?? '', 20);
$whatsapp = $whatsappRaw !== '' ? np_normalize_indian_mobile($whatsappRaw) : null;
if ($email === '' && !$whatsapp) {
    np_send_json(['error' => 'Add an email or a WhatsApp number.'], 400);
}
$now = np_iso_now();
if ($email !== '') {
    np_db_update('signups', ['unsubscribed_at' => $now], [
        'email' => 'ilike.' . $email,
        'unsubscribed_at' => 'is.null',
    ]);
}
if ($whatsapp) {
    np_db_update('signups', ['unsubscribed_at' => $now], [
        'whatsapp_e164' => 'eq.' . $whatsapp,
        'unsubscribed_at' => 'is.null',
    ]);
}
np_send_json(['ok' => true]);
