<?php
// Vet dashboard data: pets waiting for a timing and pets already approved.
require 'config.php';
need_vet();

$pending = db()->query(
    "SELECT id, pet_name, owner_name, created_at FROM pets WHERE status = 'pending' ORDER BY id ASC"
)->fetchAll();

$approved = db()->query(
    "SELECT p.id, p.pet_name, p.owner_name, p.appt_time, COALESCE(v.name, 'Vet') AS vet
     FROM pets p LEFT JOIN vets v ON v.id = p.approved_by
     WHERE p.status = 'approved' ORDER BY p.appt_time ASC"
)->fetchAll();

out(['pending' => $pending, 'approved' => $approved]);
