<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';

$lang = ($_GET['lang'] ?? '') === 'hi' ? 'hi' : 'en';
$dest = $lang === 'hi' ? '/hi?notice=hi-soon' : '/?notice=en-soon';
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
np_redirect($dest, 302, ['X-Robots-Tag' => 'noindex, nofollow']);
