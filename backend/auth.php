<?php
// Vet login only. Pet owners do not need an account.
require 'config.php';
$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $b = body();
    $name = trim($b['name'] ?? '');
    $password = (string)($b['password'] ?? '');
    if ($name === '' || $password === '') {
        out(['error' => 'Wrong name or password'], 401);
    }

    $st = db()->prepare('SELECT id, name, password_hash FROM vets WHERE BINARY name = BINARY ?');
    $st->execute([$name]);
    $v = $st->fetch();
    if (!$v || !password_verify($password, $v['password_hash'])) {
        out(['error' => 'Wrong name or password'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['vet_id'] = (int)$v['id'];
    $_SESSION['vet_name'] = $v['name'];
    out(['name' => $v['name']]);
}

if ($action === 'logout') {
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
    out(['ok' => true]);
}

if ($action === 'me') {
    out(['name' => $_SESSION['vet_name'] ?? null]);
}

out(['error' => 'Unknown action'], 400);
