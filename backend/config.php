<?php
session_start();
header('Content-Type: application/json');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=127.0.0.1;dbname=pet_clinic;charset=utf8mb4',
            'petuser',
            'petpass',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
             PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    }
    return $pdo;
}

function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function need_login(): int {
    if (empty($_SESSION['uid'])) out(['error' => 'Log in to continue'], 401);
    return (int)$_SESSION['uid'];
}

set_exception_handler(function ($e) {
    out(['error' => 'Server error: ' . $e->getMessage()], 500);
});