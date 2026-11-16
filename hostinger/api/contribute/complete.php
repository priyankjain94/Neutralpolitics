<?php
declare(strict_types=1);
require dirname(__DIR__) . '/_lib.php';
np_require_post();

if (!np_is_database_configured()) {
    np_send_json(['error' => 'Uploads are not open on this copy of the site.'], 503);
}
$input = np_json_input();
$id = is_array($input) ? (string) ($input['id'] ?? '') : '';
if (!np_is_uuid($id)) {
    np_send_json(['error' => 'Missing submission.'], 400);
}
$res = np_db_select('submissions', '*', ['id' => 'eq.' . $id, 'limit' => '1']);
$row = is_array($res['data'] ?? null) ? ($res['data'][0] ?? null) : null;
if (!$res['ok'] || !is_array($row)) {
    np_send_json(['error' => 'Submission not found.'], 404);
}
if (!empty($row['upload_completed_at'])) {
    np_send_json(['reference' => $row['reference']]);
}

$key = (string) ($row['video_key'] ?? '');
$provider = (string) ($row['video_provider'] ?? '');
$mime = (string) ($row['video_mime'] ?? '');
$size = (int) ($row['video_size_bytes'] ?? 0);
$ok = false;
if ($provider === 'r2' && np_is_r2_configured()) {
    $head = np_http_head(np_presign_r2('HEAD', $key, null, 120));
    if ($head['ok']) {
        $length = $head['length'];
        $type = $head['type'];
        if ($length && abs($length - $size) > 1024) {
            $ok = false;
        } elseif ($type !== '' && !str_starts_with($type, explode('/', $mime)[0])) {
            $ok = false;
        } else {
            $ok = true;
        }
    }
} else {
    $signed = np_storage_signed_url($key, 120);
    if ($signed) {
        $ok = np_http_head($signed)['ok'];
    }
}
if (!$ok) {
    np_send_json(['error' => 'The video did not arrive. Try the upload again.'], 400);
}
np_db_update('submissions', ['upload_completed_at' => np_iso_now()], ['id' => 'eq.' . $row['id']]);
np_db_insert('submission_events', [
    'submission_id' => $row['id'],
    'actor' => 'system',
    'from_status' => 'new',
    'to_status' => 'new',
    'note' => 'Upload completed',
]);
np_send_json(['reference' => $row['reference']]);
