<?php
require __DIR__ . '/db.php';

/* POST { email, password } -> starts a PHP session for the user. */

endpoint(function () {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        fail('Method not allowed.', 405);
    }

    $input = json_in();
    $email = strtolower(post_value($input, 'email'));
    $password = post_value($input, 'password');

    if ($email === '' || $password === '') {
        fail('Email and password are required.');
    }

    $stmt = db()->prepare('SELECT id, password_hash, role, is_active FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        fail('Invalid email or password.', 401);
    }
    if (!(int) $user['is_active']) {
        fail('This account is disabled. Contact the gym staff.', 403);
    }

    start_session();
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $user['id'];

    json_out([
        'id'    => (int) $user['id'],
        'role'  => $user['role'],
    ]);
});
