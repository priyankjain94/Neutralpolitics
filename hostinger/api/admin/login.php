<?php
declare(strict_types=1);
require dirname(__DIR__) . '/_lib.php';
np_require_post();

$back = static function (string $code): never {
    np_redirect($code !== '' ? '/admin?e=' . rawurlencode($code) : '/admin', 303);
};

if (!np_admin_configured()) {
    $back('');
}
$ip = np_client_ip();
if (!np_rate_limit('admin-login:' . $ip, 5, 15 * 60 * 1000)) {
    $back('rate');
}
$email = (string) ($_POST['email'] ?? '');
$password = (string) ($_POST['password'] ?? '');
if (!np_credentials_match($email, $password)) {
    if (np_is_database_configured()) {
        np_db_insert('audit_log', [
            'actor' => np_cfg('ADMIN_EMAIL') !== '' ? np_cfg('ADMIN_EMAIL') : 'admin',
            'action' => 'login_failed',
            'target' => strtolower(trim($email)),
            'detail' => null,
        ]);
    }
    $back('1');
}
$token = np_sign_session(strtolower(trim($email)), np_cfg('ADMIN_SESSION_SECRET'));
if (np_is_database_configured()) {
    np_db_insert('audit_log', [
        'actor' => np_cfg('ADMIN_EMAIL') !== '' ? np_cfg('ADMIN_EMAIL') : 'admin',
        'action' => 'login',
        'target' => strtolower(trim($email)),
        'detail' => null,
    ]);
}
np_redirect('/admin', 303, ['Set-Cookie' => np_cookie_header($token, NP_ADMIN_MAX_AGE)]);
