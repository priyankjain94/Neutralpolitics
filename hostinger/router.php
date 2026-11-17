<?php
declare(strict_types=1);
/**
 * Router for `php -S 127.0.0.1:8080 -t out hostinger/router.php`.
 * Mirrors the Apache .htaccess rules so local checks match Hostinger.
 */

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$query = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_QUERY) ?: '';
$root = $_SERVER['DOCUMENT_ROOT'] ?? getcwd();
$host = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '') ?? '');
$canonical = $host === 'www.neutralpolitics.in' || $host === 'neutralpolitics.in';

function np_router_noindex(bool $force = false): void
{
    global $canonical;
    if ($force || !$canonical) {
        header('X-Robots-Tag: noindex, nofollow');
    }
}

if ($host === 'neutralpolitics.in') {
    $path = $uri === '/' ? '/' : rtrim($uri, '/');
    header('Location: https://www.neutralpolitics.in' . $path . ($query !== '' ? '?' . $query : ''), true, 308);
    exit;
}

if ($uri !== '/' && str_ends_with($uri, '/')) {
    $dest = preg_replace('#/+$#', '', $uri) ?: '/';
    np_router_noindex();
    header('Location: ' . $dest . ($query !== '' ? '?' . $query : ''), true, 308);
    exit;
}

if (!$canonical && $uri === '/robots.txt') {
    np_router_noindex();
    header('Content-Type: text/plain; charset=utf-8');
    readfile($root . '/robots-preview.txt');
    exit;
}

if (preg_match('#^/(api|admin)/_#', $uri)) {
    http_response_code(403);
    exit;
}

$map = [
    '/api/error-reports' => '/api/error-reports.php',
    '/api/reports' => '/api/reports.php',
    '/api/subscribe' => '/api/subscribe.php',
    '/api/unsubscribe' => '/api/unsubscribe.php',
    '/api/contribute/start' => '/api/contribute/start.php',
    '/api/contribute/complete' => '/api/contribute/complete.php',
    '/api/admin/login' => '/api/admin/login.php',
    '/api/admin/logout' => '/api/admin/logout.php',
];
if (isset($map[$uri])) {
    require $root . $map[$uri];
    exit;
}

if ($uri === '/admin' || str_starts_with($uri, '/admin/')) {
    require $root . '/admin/index.php';
    exit;
}

if ($uri === '/') {
    $home = $root . '/index.html';
    if (is_file($home)) {
        np_router_noindex();
        header('Content-Type: text/html; charset=utf-8');
        readfile($home);
        exit;
    }
}

$file = $root . $uri;
if ($uri !== '/' && is_file($file)) {
    np_router_noindex($uri === '/search' || $uri === '/hi/search' ? isset($_GET['q']) : false);
    return false;
}

$html = $root . $uri . '.html';
if (is_file($html)) {
    np_router_noindex(($uri === '/search' || $uri === '/hi/search') && isset($_GET['q']));
    header('Content-Type: text/html; charset=utf-8');
    if (!$canonical) {
        header('X-Robots-Tag: noindex, nofollow');
    }
    readfile($html);
    exit;
}

$index = $root . $uri . '/index.html';
if (is_file($index)) {
    np_router_noindex();
    header('Content-Type: text/html; charset=utf-8');
    readfile($index);
    exit;
}

if (preg_match('#^/(hi/)?news/\d{4}/\d{2}/[^/]+$#', $uri)) {
    $_GET['lang'] = str_starts_with($uri, '/hi/') ? 'hi' : 'en';
    require $root . '/api/unpublished.php';
    exit;
}

$notFound = $root . '/404.html';
http_response_code(404);
np_router_noindex();
if (is_file($notFound)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($notFound);
    exit;
}
http_response_code(404);
echo 'Not found';
