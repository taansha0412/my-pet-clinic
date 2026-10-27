<?php
require 'config.php';
$uid = need_login();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $st = db()->prepare('SELECT id, name, species, breed, age FROM pets WHERE owner_id = ? ORDER BY name');
    $st->execute([$uid]);
    out($st->fetchAll());
}

if ($method === 'POST') {
    $b = body();
    $name = trim($b['name'] ?? '');
    $species = trim($b['species'] ?? '');
    if ($name === '' || $species === '') out(['error' => 'Pet name and species are required'], 400);
    $age = ($b['age'] ?? '') === '' ? null : (int)$b['age'];
    db()->prepare('INSERT INTO pets (owner_id, name, species, breed, age) VALUES (?, ?, ?, ?, ?)')
        ->execute([$uid, $name, $species, trim($b['breed'] ?? ''), $age]);
    out(['id' => (int)db()->lastInsertId()], 201);
}

if ($method === 'DELETE') {
    db()->prepare('DELETE FROM pets WHERE id = ? AND owner_id = ?')->execute([(int)($_GET['id'] ?? 0), $uid]);
    out(['ok' => true]);
}

out(['error' => 'Method not allowed'], 405);