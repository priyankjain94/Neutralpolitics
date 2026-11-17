<?php
declare(strict_types=1);
require dirname(__DIR__) . '/_lib.php';
np_require_post();

if (np_is_database_configured()) {
    np_db_insert('audit_log', [
        'actor' => np_cfg('ADMIN_EMAIL') !== '' ? np_cfg('ADMIN_EMAIL') : 'admin',
        'action' => 'logout',
        'target' => np_cfg('ADMIN_EMAIL') !== '' ? np_cfg('ADMIN_EMAIL') : 'admin',
        'detail' => null,
    ]);
}
np_redirect('/admin', 303, ['Set-Cookie' => np_cookie_header('', 0)]);
