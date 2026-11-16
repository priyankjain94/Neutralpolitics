<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
np_require_post();

if (!np_is_database_configured()) {
    np_send_json(['error' => 'unavailable'], 503);
}
$ip = np_client_ip();
if (!np_rate_limit('error-report:' . $ip, 5, 15 * 60 * 1000)) {
    np_send_json(['error' => 'rate'], 429);
}
$input = np_json_input();
if (!is_array($input)) {
    np_send_json(['error' => 'check'], 400);
}
$story = np_trim_str($input['story_ref'] ?? '', 500);
$wrong = np_trim_str($input['what_wrong'] ?? '', 4000);
$suggested = np_trim_str($input['suggested_correction'] ?? '', 4000);
$source = np_trim_str($input['source_url'] ?? '', 500);
$name = np_trim_str($input['name'] ?? '', 120);
$email = np_trim_str($input['email'] ?? '', 200);
$language = $input['language'] ?? '';
$consent = $input['consent_contact'] ?? false;
$website = np_trim_str($input['website'] ?? '', 200);
if (strlen($story) < 2 || strlen($wrong) < 10 || strlen($suggested) < 10 || !in_array($language, ['en', 'hi'], true) || $consent !== true) {
    np_send_json(['error' => 'check'], 400);
}
if ($website !== '') {
    np_send_json(['ok' => true]);
}
if ($email !== '' && !np_is_email($email)) {
    np_send_json(['error' => 'email'], 400);
}
if ($source !== '' && !preg_match('#^https?://#i', $source)) {
    np_send_json(['error' => 'source'], 400);
}
$now = np_iso_now();
$res = np_db_insert('error_reports', [
    'story_ref' => $story,
    'what_wrong' => $wrong,
    'suggested_correction' => $suggested,
    'source_url' => $source !== '' ? $source : null,
    'name' => $name !== '' ? $name : null,
    'email' => $email !== '' ? $email : null,
    'language' => $language,
    'consent_contact' => true,
    'consent_at' => $now,
    'consent_ip_hash' => np_hash_ip($ip),
    'status' => 'new',
]);
if (!$res['ok']) {
    np_send_json(['error' => 'save'], 500);
}
np_send_json(['ok' => true]);
