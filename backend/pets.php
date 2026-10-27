<?php
// Pet owner side: register a pet (POST) and check its status by ID (GET).
require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $b = body();
    $pet = trim($b['pet_name'] ?? '');
    $owner = trim($b['owner_name'] ?? '');
    if ($pet === '' || $owner === '' || strlen($pet) > 100 || strlen($owner) > 100) {
        out(['error' => 'Enter both the pet name and the owner name'], 400);
    }
    $st = db()->prepare('INSERT INTO pets (pet_name, owner_name) VALUES (?, ?)');
    $st->execute([$pet, $owner]);
    $id = (int)db()->lastInsertId();
    out([
        'id' => $id,
        'pet_name' => $pet,
        'owner_name' => $owner,
        'status' => 'pending',
        'appt_time' => null
    ], 201);
}

if ($method === 'GET') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        out(['error' => 'Invalid pet ID'], 400);
    }
    $st = db()->prepare('SELECT id, pet_name, owner_name, status, appt_time FROM pets WHERE id = ?');
    $st->execute([$id]);
    $row = $st->fetch();
    if (!$row) {
        out(['error' => 'No pet found with that ID'], 404);
    }
    out($row);
}

out(['error' => 'Method not allowed'], 405);
