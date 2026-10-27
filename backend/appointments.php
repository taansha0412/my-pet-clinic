<?php
// A vet gives a waiting pet a date and time. That moves it to the approved list.
require 'config.php';
$vetId = need_vet();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(['error' => 'Method not allowed'], 405);
}

$b = body();
$petId = (int)($b['pet_id'] ?? 0);
$rawTime = trim($b['appt_time'] ?? '');
$ts = strtotime($rawTime);
if (!$petId || !$ts) {
    out(['error' => 'Choose a valid date and time'], 400);
}
// Allow a 5-minute buffer so current minute isn't blocked by minor time drift
if ($ts < time() - 300) {
    out(['error' => 'Pick a time in the future'], 400);
}

try {
    $formattedDate = date('Y-m-d H:i:00', $ts);
    $st = db()->prepare(
        "UPDATE pets SET status = 'approved', appt_time = ?, approved_by = ?
         WHERE id = ? AND status = 'pending'"
    );
    $st->execute([$formattedDate, $vetId, $petId]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        out(['error' => 'You already have a pet at that time. Pick another slot'], 409);
    }
    throw $e;
}

if ($st->rowCount() === 0) {
    out(['error' => 'That pet is not waiting for approval'], 404);
}
out(['ok' => true]);
