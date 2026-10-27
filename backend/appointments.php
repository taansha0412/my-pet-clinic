<?php
// A vet gives a waiting pet a date and time. That moves it to the approved list.
require 'config.php';
$vetId = need_vet();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'Method not allowed'], 405);

$b = body();
$petId = (int)($b['pet_id'] ?? 0);
$ts = strtotime($b['appt_time'] ?? '');
if (!$petId || !$ts) out(['error' => 'Choose a date and time'], 400);
if ($ts < time()) out(['error' => 'Pick a time in the future'], 400);

try {
    $st = db()->prepare(
        "UPDATE pets SET status = 'approved', appt_time = ?, approved_by = ?
         WHERE id = ? AND status = 'pending'");
    $st->execute([date('Y-m-d H:i:00', $ts), $vetId, $petId]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') out(['error' => 'You already have a pet at that time. Pick another slot'], 409);
    throw $e;
}

if ($st->rowCount() === 0) out(['error' => 'That pet is not waiting for approval'], 404);
out(['ok' => true]);
