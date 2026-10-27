<?php
// Vet login only. Pet owners do not need an account.
require 'config.php';
$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $b = body();
    $st = db()->prepare('SELECT id, name, password_hash FROM vets WHERE name = ?');
    $st->execute([trim($b['name'] ?? '')]);
    $v = $st->fetch();
    if (!$v || !password_verify($b['password'] ?? '', $v['password_hash']))
        out(['error' => 'Wrong name or password'], 401);
    session_regenerate_id(true);
    $_SESSION['vet_id'] = (int)$v['id'];
    $_SESSION['vet_name'] = $v['name'];
    out(['name' => $v['name']]);
}

if ($action === 'logout') {
    session_destroy();
    out(['ok' => true]);
}

if ($action === 'me') {
    out(['name' => $_SESSION['vet_name'] ?? null]);
}

out(['error' => 'Unknown action'], 400);
