<?php
require 'config.php';
$action = $_GET['action'] ?? '';

if ($action === 'register') {
    $b = body();
    $name = trim($b['name'] ?? '');
    $email = strtolower(trim($b['email'] ?? ''));
    $pw = $b['password'] ?? '';
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pw) < 6)
        out(['error' => 'Enter your name, a valid email and a password of 6+ characters'], 400);
    $st = db()->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    if ($st->fetch()) out(['error' => 'That email is already registered'], 409);
    db()->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
        ->execute([$name, $email, password_hash($pw, PASSWORD_DEFAULT)]);
    $_SESSION['uid'] = (int)db()->lastInsertId();
    $_SESSION['name'] = $name;
    out(['name' => $name]);
}

if ($action === 'login') {
    $b = body();
    $st = db()->prepare('SELECT * FROM users WHERE email = ?');
    $st->execute([strtolower(trim($b['email'] ?? ''))]);
    $u = $st->fetch();
    if (!$u || !password_verify($b['password'] ?? '', $u['password_hash']))
        out(['error' => 'Wrong email or password'], 401);
    $_SESSION['uid'] = (int)$u['id'];
    $_SESSION['name'] = $u['name'];
    out(['name' => $u['name']]);
}

if ($action === 'logout') {
    session_destroy();
    out(['ok' => true]);
}

if ($action === 'me') {
    out(['name' => $_SESSION['name'] ?? null]);
}

out(['error' => 'Unknown action'], 400);