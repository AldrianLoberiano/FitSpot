<?php
require __DIR__ . '/db.php';

/* POST { full_name, email, password, confirm? } -> creates a member account. */

endpoint(function () {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        fail('Method not allowed.', 405);
    }

    $input = json_in();
    $fullName = post_value($input, 'full_name');
    $email = strtolower(post_value($input, 'email'));
    $password = post_value($input, 'password');
    $confirm = post_value($input, 'confirm');

    if ($fullName === '' || $email === '' || $password === '') {
        fail('Full name, email, and password are required.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Please enter a valid email address.');
    }
    if (strlen($password) < 6) {
        fail('Password must be at least 6 characters long.');
    }
    if ($confirm !== '' && $password !== $confirm) {
        fail('Passwords do not match.');
    }

    $stmt = db()->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        fail('An account with that email already exists.', 409);
    }

    $stmt = db()->prepare(
        "INSERT INTO users (full_name, email, password_hash, role)
         VALUES (?, ?, ?, 'member')"
    );
    $stmt->execute([$fullName, $email, password_hash($password, PASSWORD_BCRYPT)]);

    json_out(['id' => (int) db()->lastInsertId()], 201);
});
