<?php
require __DIR__ . '/db.php';

/* GET  -> my profile + current membership (logged in)
   POST { full_name, email, phone, address } -> update my profile (logged in) */

endpoint(function () {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    $user = require_user();

    if ($method === 'GET') {
        $stmt = db()->prepare(
            "SELECT m.status, m.start_date, m.end_date,
                    p.name AS plan_name, p.price
               FROM memberships m
               JOIN membership_plans p ON p.id = m.plan_id
              WHERE m.user_id = ?
              ORDER BY m.end_date DESC LIMIT 1"
        );
        $stmt->execute([(int) $user['id']]);
        $membership = $stmt->fetch();

        $membershipOut = null;
        if ($membership) {
            $end = new DateTime($membership['end_date']);
            $daysLeft = (int) $end->diff(new DateTime('today'))->days
                * ($end >= new DateTime('today') ? 1 : -1);
            if ($end < new DateTime('today')) {
                $daysLeft = 0;
            }
            $membershipOut = [
                'plan'       => $membership['plan_name'],
                'price'      => (float) $membership['price'],
                'status'     => $membership['end_date'] >= date('Y-m-d') && $membership['status'] === 'active'
                                    ? 'active' : 'expired',
                'start_date' => $membership['start_date'],
                'end_date'   => $membership['end_date'],
                'days_left'  => max(0, $daysLeft),
            ];
        }

        json_out([
            'id'          => (int) $user['id'],
            'full_name'   => $user['full_name'],
            'email'       => $user['email'],
            'phone'       => $user['phone'],
            'address'     => $user['address'],
            'created_at'  => $user['created_at'],
            'membership'  => $membershipOut,
        ]);
    }

    if ($method === 'POST') {
        $input = json_in();
        $fullName = post_value($input, 'full_name');
        $email = strtolower(post_value($input, 'email'));
        $phone = post_value($input, 'phone');
        $address = post_value($input, 'address');

        if ($fullName === '' || $email === '') {
            fail('Full name and email are required.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            fail('Please enter a valid email address.');
        }

        $stmt = db()->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
        $stmt->execute([$email, (int) $user['id']]);
        if ($stmt->fetch()) {
            fail('Another account already uses that email.', 409);
        }

        $stmt = db()->prepare(
            'UPDATE users SET full_name = ?, email = ?, phone = ?, address = ? WHERE id = ?'
        );
        $stmt->execute([
            $fullName,
            $email,
            $phone !== '' ? $phone : null,
            $address !== '' ? $address : null,
            (int) $user['id'],
        ]);

        json_out(['ok' => true]);
    }

    fail('Method not allowed.', 405);
});
