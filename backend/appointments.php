<?php
require 'config.php';
$uid = need_login();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $st = db()->prepare(
        'SELECT a.id, a.appt_time, a.reason, p.name AS pet, v.name AS vet
         FROM appointments a
         JOIN pets p ON p.id = a.pet_id
         JOIN vets v ON v.id = a.vet_id
         WHERE p.owner_id = ? ORDER BY a.appt_time');
    $st->execute([$uid]);
    out($st->fetchAll());
}

if ($method === 'POST') {
    $b = body();
    $petId = (int)($b['pet_id'] ?? 0);
    $vetId = (int)($b['vet_id'] ?? 0);
    $ts = strtotime($b['appt_time'] ?? '');
    if (!$petId || !$vetId || !$ts) out(['error' => 'Choose a pet, a vet and a date and time'], 400);
    if ($ts < time()) out(['error' => 'Pick a time in the future'], 400);

    $own = db()->prepare('SELECT id FROM pets WHERE id = ? AND owner_id = ?');
    $own->execute([$petId, $uid]);
    if (!$own->fetch()) out(['error' => 'That pet is not on your account'], 403);

    try {
        db()->prepare('INSERT INTO appointments (pet_id, vet_id, appt_time, reason) VALUES (?, ?, ?, ?)')
            ->execute([$petId, $vetId, date('Y-m-d H:i:00', $ts), trim($b['reason'] ?? '')]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') out(['error' => 'That vet is already booked at that time. Try another slot'], 409);
        throw $e;
    }
    out(['ok' => true], 201);
}

if ($method === 'DELETE') {
    db()->prepare(
        'DELETE a FROM appointments a JOIN pets p ON p.id = a.pet_id WHERE a.id = ? AND p.owner_id = ?'
    )->execute([(int)($_GET['id'] ?? 0), $uid]);
    out(['ok' => true]);
}

out(['error' => 'Method not allowed'], 405);