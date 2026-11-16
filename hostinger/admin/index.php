<?php
declare(strict_types=1);

require dirname(__DIR__) . '/api/_lib.php';

function np_desk_page(string $title, string $body): never
{
    header('Content-Type: text/html; charset=utf-8');
    header('X-Robots-Tag: noindex, nofollow');
    header('Cache-Control: no-store');
    $safeTitle = np_esc($title);
    echo <<<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>{$safeTitle} | Neutral Politics</title>
  <style>
    body { font: 16px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 2rem auto; max-width: 52rem; padding: 0 1rem; color: #121212; }
    a { color: #0b3d91; }
    form { display: grid; gap: 0.8rem; max-width: 22rem; }
    label { display: grid; gap: 0.25rem; }
    input, button { font: inherit; padding: 0.45rem 0.6rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid #ddd; text-align: left; padding: 0.35rem 0.4rem; vertical-align: top; }
    .nav a { margin-right: 0.8rem; }
    .error { color: #8d1d1d; }
  </style>
</head>
<body>
{$body}
</body>
</html>
HTML;
    exit;
}

function np_desk_login(string $error): never
{
    $message = $error === '1'
        ? '<p class="error">That email or password is not right.</p>'
        : ($error === 'rate' ? '<p class="error">Too many tries. Wait 15 minutes and try again.</p>' : '');
    if (!np_admin_configured()) {
        np_desk_page('Desk', '<p>Neutral Politics</p><h1>Desk</h1><p>Admin is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET in np-config.php, one level above the web root.</p>');
    }
    np_desk_page('Desk', <<<HTML
<p>Neutral Politics</p>
<h1>Desk</h1>
<form method="post" action="/api/admin/login">
  <label>Email <input name="email" type="email" autocomplete="username" required /></label>
  <label>Password <input name="password" type="password" autocomplete="current-password" required /></label>
  <button type="submit">Enter</button>
</form>
{$message}
HTML);
}

function np_desk_nav(string $current): string
{
    $links = [
        ['dashboard', '/admin', 'Dashboard'],
        ['stories', '/admin/stories', 'Stories'],
        ['submissions', '/admin/submissions', 'Submissions'],
        ['signups', '/admin/signups', 'Signups'],
        ['errors', '/admin/error-reports', 'Error reports'],
    ];
    $parts = [];
    foreach ($links as [$id, $href, $label]) {
        $parts[] = $id === $current ? '<strong>' . np_esc($label) . '</strong>' : '<a href="' . np_esc($href) . '">' . np_esc($label) . '</a>';
    }
    return '<p class="nav">' . implode(' ', $parts) . ' <form style="display:inline" method="post" action="/api/admin/logout"><button type="submit">Log out</button></form></p>';
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/admin', PHP_URL_PATH) ?: '/admin';
$path = preg_replace('#/$#', '', $path) ?: '/';
$email = np_session_email();
if (!$email) {
    np_desk_login((string) ($_GET['e'] ?? ''));
}

$pages = [
    '/admin' => 'dashboard',
    '/admin/stories' => 'stories',
    '/admin/submissions' => 'submissions',
    '/admin/signups' => 'signups',
    '/admin/error-reports' => 'errors',
];
if (!isset($pages[$path])) {
    np_redirect('/admin', 302, ['X-Robots-Tag' => 'noindex, nofollow']);
}
$kind = $pages[$path];
$published = np_published();

if ($kind === 'dashboard') {
    $publishedCount = count(array_unique(array_merge($published['en'], $published['hi'])));
    $pending = '—';
    $signups = '—';
    $openReports = '—';
    $activity = '<li>No admin actions yet.</li>';
    $dbNote = '';
    if (np_is_database_configured()) {
        $submissions = np_db_select('submissions', 'desk_status,status', ['limit' => '500']);
        $pending = (string) count(array_filter(is_array($submissions['data']) ? $submissions['data'] : [], static function ($row) {
            $status = (string) ($row['desk_status'] ?? $row['status'] ?? 'new');
            return in_array($status, ['new', 'under_review', 'verifying'], true);
        }));
        $signupRows = np_db_select('signups', 'id', ['limit' => '500']);
        $signups = (string) count(is_array($signupRows['data']) ? $signupRows['data'] : []);
        $reports = np_db_select('error_reports', 'status', ['limit' => '500']);
        $openReports = (string) count(array_filter(is_array($reports['data']) ? $reports['data'] : [], static function ($row) {
            return in_array($row['status'] ?? '', ['new', 'reviewing'], true);
        }));
        $audit = np_db_select('audit_log', 'id,at,action,target,detail', ['order' => 'at.desc', 'limit' => '12']);
        if (!empty($audit['data']) && is_array($audit['data'])) {
            $items = [];
            foreach ($audit['data'] as $row) {
                $items[] = '<li><time>' . np_esc($row['at'] ?? '') . '</time> ' . np_esc($row['action'] ?? '')
                    . (!empty($row['target']) ? ' · ' . np_esc($row['target']) : '')
                    . (!empty($row['detail']) ? ' · ' . np_esc($row['detail']) : '') . '</li>';
            }
            $activity = implode('', $items);
        }
    } else {
        $dbNote = '<p>The database is not configured. Story counts below come from the files baked at build time. Submissions, signups and error reports need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in np-config.php.</p>';
    }
    $draftCount = count($published['draft']);
    $safeEmail = np_esc($email);
    np_desk_page('Desk', np_desk_nav('dashboard') . <<<HTML
<h1>Dashboard</h1>
<p>Signed in as {$safeEmail}.</p>
{$dbNote}
<ul>
  <li>Published story files: {$publishedCount}</li>
  <li>Draft files waiting for a rebuild: {$draftCount}</li>
  <li>Open submissions: {$pending}</li>
  <li>Signups: {$signups}</li>
  <li>Open error reports: {$openReports}</li>
</ul>
<p>Publishing a story is still a git commit. The next Hostinger build writes the new HTML and uploads it by FTP. Unpublishing a live story also takes effect on that build, not on the next click.</p>
<h2>Recent activity</h2>
<ul>{$activity}</ul>
HTML);
}

if ($kind === 'stories') {
    $rows = [];
    $keys = $published['en'];
    sort($keys);
    foreach ($keys as $key) {
        $langs = in_array($key, $published['hi'], true) ? 'en + hi' : 'en';
        $rows[] = '<tr><td>' . np_esc($key) . '</td><td>' . np_esc($langs) . '</td></tr>';
    }
    $table = implode('', $rows);
    np_desk_page('Stories', np_desk_nav('stories') . <<<HTML
<h1>Stories</h1>
<p>These are the files in this build. The story editor that writes Supabase overrides still runs with <code>npm run dev</code>. A new public page needs a new build.</p>
<table><thead><tr><th>Slug</th><th>Languages</th></tr></thead><tbody>{$table}</tbody></table>
HTML);
}

if ($kind === 'signups') {
    if (!np_is_database_configured()) {
        np_desk_page('Signups', np_desk_nav('signups') . '<h1>Signups</h1><p>The database is not configured.</p>');
    }
    $res = np_db_select('signups', 'created_at,email,whatsapp_e164,language,channel', ['order' => 'created_at.desc', 'limit' => '100']);
    if (!$res['ok']) {
        np_desk_page('Signups', np_desk_nav('signups') . '<h1>Signups</h1><p class="error">Could not load signups.</p>');
    }
    $rows = '';
    foreach (is_array($res['data']) ? $res['data'] : [] as $row) {
        $rows .= '<tr><td>' . np_esc($row['created_at'] ?? '') . '</td><td>' . np_esc($row['email'] ?? '') . '</td><td>'
            . np_esc($row['whatsapp_e164'] ?? '') . '</td><td>' . np_esc($row['language'] ?? '') . '</td><td>'
            . np_esc($row['channel'] ?? '') . '</td></tr>';
    }
    if ($rows === '') {
        $rows = '<tr><td colspan="5">Nothing here yet.</td></tr>';
    }
    np_desk_page('Signups', np_desk_nav('signups') . "<h1>Signups</h1><table><thead><tr><th>When</th><th>Email</th><th>WhatsApp</th><th>Language</th><th>Channel</th></tr></thead><tbody>{$rows}</tbody></table>");
}

if ($kind === 'errors') {
    if (!np_is_database_configured()) {
        np_desk_page('Error reports', np_desk_nav('errors') . '<h1>Error reports</h1><p>The database is not configured.</p>');
    }
    $res = np_db_select('error_reports', 'created_at,status,language,story_ref,what_wrong', ['order' => 'created_at.desc', 'limit' => '100']);
    if (!$res['ok']) {
        np_desk_page('Error reports', np_desk_nav('errors') . '<h1>Error reports</h1><p class="error">Could not load error reports.</p>');
    }
    $rows = '';
    foreach (is_array($res['data']) ? $res['data'] : [] as $row) {
        $rows .= '<tr><td>' . np_esc($row['created_at'] ?? '') . '</td><td>' . np_esc($row['status'] ?? '') . '</td><td>'
            . np_esc($row['language'] ?? '') . '</td><td>' . np_esc($row['story_ref'] ?? '') . '</td><td>'
            . np_esc($row['what_wrong'] ?? '') . '</td></tr>';
    }
    if ($rows === '') {
        $rows = '<tr><td colspan="5">Nothing here yet.</td></tr>';
    }
    np_desk_page('Error reports', np_desk_nav('errors') . "<h1>Error reports</h1><table><thead><tr><th>When</th><th>Status</th><th>Language</th><th>Story</th><th>What is wrong</th></tr></thead><tbody>{$rows}</tbody></table>");
}

if (!np_is_database_configured()) {
    np_desk_page('Submissions', np_desk_nav('submissions') . '<h1>Submissions</h1><p>The database is not configured.</p>');
}
$res = np_db_select('submissions', 'created_at,reference,name,city,desk_status,video_mime', ['order' => 'created_at.desc', 'limit' => '100']);
if (!$res['ok']) {
    np_desk_page('Submissions', np_desk_nav('submissions') . '<h1>Submissions</h1><p class="error">Could not load submissions.</p>');
}
$rows = '';
foreach (is_array($res['data']) ? $res['data'] : [] as $row) {
    $rows .= '<tr><td>' . np_esc($row['created_at'] ?? '') . '</td><td>' . np_esc($row['reference'] ?? '') . '</td><td>'
        . np_esc($row['name'] ?? '') . '</td><td>' . np_esc($row['city'] ?? '') . '</td><td>'
        . np_esc($row['desk_status'] ?? '') . '</td><td>' . np_esc($row['video_mime'] ?? '') . '</td></tr>';
}
if ($rows === '') {
    $rows = '<tr><td colspan="6">Nothing here yet.</td></tr>';
}
np_desk_page('Submissions', np_desk_nav('submissions') . "<h1>Submissions</h1><p>Status changes from the old desk screens still run with <code>npm run dev</code>. New videos still upload through the public contribute form.</p><table><thead><tr><th>When</th><th>Reference</th><th>Name</th><th>City</th><th>Status</th><th>Video</th></tr></thead><tbody>{$rows}</tbody></table>");
