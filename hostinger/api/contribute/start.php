<?php
declare(strict_types=1);
require dirname(__DIR__) . '/_lib.php';
np_require_post();

if (!np_is_upload_configured()) {
    np_send_json(['error' => 'Uploads are not open on this copy of the site.'], 503);
}
$ip = np_client_ip();
if (!np_rate_limit('contribute:' . $ip, 8, 60 * 60 * 1000)) {
    np_send_json(['error' => 'Too many attempts. Try again later.'], 429);
}
$input = np_json_input();
if (!is_array($input)) {
    np_send_json(['error' => 'Check the form and try again.'], 400);
}
$name = np_trim_str($input['name'] ?? '', 120);
$phoneRaw = np_trim_str($input['phone'] ?? '', 20);
$email = np_trim_str($input['email'] ?? '', 200);
$city = np_trim_str($input['city'] ?? '', 80);
$state = np_trim_str($input['state'] ?? '', 80);
$description = np_trim_str($input['description'] ?? '', 5000);
$eventDate = np_trim_str($input['event_date'] ?? '', 40);
$eventLocation = np_trim_str($input['event_location'] ?? '', 200);
$language = $input['language'] ?? '';
$extra = np_trim_str($input['extra_notes'] ?? '', 2000);
$social = np_trim_str($input['social_handle'] ?? '', 80);
$credit = $input['credit_preference'] ?? '';
$categoryRaw = np_trim_str($input['category'] ?? '', 40);
$videoSize = $input['video_size_bytes'] ?? null;
$videoMime = $input['video_mime'] ?? '';
$duration = $input['video_duration_s'] ?? null;
$consent = $input['consent'] ?? false;
$age18 = $input['age18'] ?? false;
$token = is_string($input['turnstile_token'] ?? null) ? $input['turnstile_token'] : null;

$ok = strlen($name) >= 2
    && strlen($phoneRaw) >= 8
    && np_is_email($email)
    && strlen($city) >= 2
    && strlen($state) >= 2
    && strlen($description) >= 30
    && strlen($eventDate) >= 4
    && strlen($eventLocation) >= 2
    && in_array($language, ['en', 'hi'], true)
    && in_array($credit, ['name', 'anonymous'], true)
    && is_int($videoSize)
    && $videoSize > 0
    && $videoSize <= NP_MAX_VIDEO_BYTES
    && in_array($videoMime, NP_VIDEO_MIMES, true)
    && $consent === true
    && $age18 === true;
if ($duration !== null && $duration !== '') {
    if (!is_int($duration) || $duration <= 0 || $duration > NP_MAX_VIDEO_SECONDS) {
        $ok = false;
    }
}
if (!$ok) {
    np_send_json(['error' => 'Check the form and try again.'], 400);
}
$phone = np_normalize_indian_mobile($phoneRaw);
if (!$phone) {
    np_send_json(['error' => 'Enter an Indian mobile number.'], 400);
}
if (!in_array($state, NP_INDIAN_STATES, true)) {
    np_send_json(['error' => 'Choose a state.'], 400);
}
$category = $categoryRaw !== '' && in_array($categoryRaw, NP_CATEGORIES, true) ? $categoryRaw : null;
if (!np_verify_turnstile($token, $ip)) {
    np_send_json(['error' => 'Captcha check failed.'], 400);
}
$provider = np_upload_provider();
if (!$provider || !np_is_database_configured()) {
    np_send_json(['error' => 'Uploads are not open on this copy of the site.'], 503);
}

$id = np_uuid();
$now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
$year = $now->format('Y');
$month = $now->format('m');
$key = "submissions/{$year}/{$month}/{$id}." . NP_VIDEO_EXT[$videoMime];
$reference = 'NP-' . $year . '-' . strtoupper(bin2hex(random_bytes(3)));
try {
    $eventIso = (new DateTimeImmutable($eventDate))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z');
} catch (Throwable) {
    np_send_json(['error' => 'Check the form and try again.'], 400);
}
$stamp = $now->format('Y-m-d\TH:i:s.v\Z');
$res = np_db_insert('submissions', [
    'id' => $id,
    'reference' => $reference,
    'name' => $name,
    'phone' => $phone,
    'email' => $email,
    'city' => $city,
    'state' => $state,
    'description' => $description,
    'event_date' => $eventIso,
    'event_location' => $eventLocation,
    'language' => $language,
    'extra_notes' => $extra !== '' ? $extra : null,
    'social_handle' => $social !== '' ? $social : null,
    'credit_preference' => $credit,
    'category' => $category,
    'desk_status' => 'new',
    'payment_track' => 'unpaid',
    'video_key' => $key,
    'video_provider' => $provider,
    'video_size_bytes' => $videoSize,
    'video_mime' => $videoMime,
    'video_duration_s' => is_int($duration) ? $duration : null,
    'consent_version' => NP_CONSENT_VERSION,
    'consent_at' => $stamp,
    'age_confirmed_at' => $stamp,
    'consent_ip_hash' => np_hash_ip($ip),
    'status' => 'new',
]);
if (!$res['ok']) {
    np_send_json(['error' => 'Could not save the submission.'], 500);
}

if ($provider === 'r2') {
    $uploadUrl = np_presign_r2('PUT', $key, $videoMime, 1800);
    np_send_json(['id' => $id, 'reference' => $reference, 'uploadUrl' => $uploadUrl, 'headers' => ['content-type' => $videoMime]]);
}
$uploadUrl = np_storage_signed_upload_url($key);
if (!$uploadUrl) {
    np_send_json(['error' => 'Could not prepare the upload.'], 500);
}
np_send_json(['id' => $id, 'reference' => $reference, 'uploadUrl' => $uploadUrl, 'headers' => ['content-type' => $videoMime]]);
