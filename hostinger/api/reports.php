<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
np_require_post();

if (!np_is_database_configured()) {
    np_send_json(['error' => 'Messages are not open on this copy of the site.'], 503);
}
$ip = np_client_ip();
if (!np_rate_limit('report:' . $ip, 20, 60 * 60 * 1000)) {
    np_send_json(['error' => 'Too many attempts. Try again later.'], 429);
}
$input = np_json_input();
if (!is_array($input)) {
    np_send_json(['error' => 'Check the form and try again.'], 400);
}
$type = $input['type'] ?? '';
$message = np_trim_str($input['message'] ?? '', 5000);
$article = np_trim_str($input['article_url'] ?? '', 500);
$email = np_trim_str($input['email'] ?? '', 200);
$name = np_trim_str($input['name'] ?? '', 120);
$token = is_string($input['turnstile_token'] ?? null) ? $input['turnstile_token'] : null;
if (!in_array($type, ['correction', 'factcheck', 'contact'], true) || strlen($message) < 10) {
    np_send_json(['error' => 'Check the form and try again.'], 400);
}
if ($email !== '' && !str_contains($email, '@')) {
    np_send_json(['error' => 'Check the email address.'], 400);
}
if (!np_verify_turnstile($token, $ip)) {
    np_send_json(['error' => 'Captcha check failed.'], 400);
}
$res = np_db_insert('reports', [
    'type' => $type,
    'article_url' => $article !== '' ? $article : null,
    'message' => $message,
    'email' => $email !== '' ? $email : null,
    'name' => $name !== '' ? $name : null,
    'consent_ip_hash' => np_hash_ip($ip),
]);
if (!$res['ok']) {
    np_send_json(['error' => 'Could not save the message.'], 500);
}
np_send_json(['ok' => true]);
