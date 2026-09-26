<?php
require __DIR__ . '/db.php';

/* GET    -> all membership plans (public)
   POST   -> create a plan   (admin)
   PUT    -> update a plan   (admin)
   DELETE -> delete a plan   (admin, blocked while members are on it) */

endpoint(function () {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $rows = db()->query(
            'SELECT id, name, price, inclusions, is_active
               FROM membership_plans ORDER BY price, id'
        )->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['price'] = (float) $row['price'];
            $row['is_active'] = (int) $row['is_active'];
        }
        json_out(['plans' => $rows]);
    }

    $user = require_user('admin');
    $input = json_in();

    if ($method === 'POST') {
        $name = post_value($input, 'name');
        $price = post_value($input, 'price');
        $inclusions = post_value($input, 'inclusions');

        if ($name === '' || $price === '' || $inclusions === '') {
            fail('Plan name, price, and inclusions are required.');
        }
        if (!is_numeric($price) || (float) $price < 0) {
            fail('Price must be a valid amount.');
        }

        $stmt = db()->prepare(
            'INSERT INTO membership_plans (name, price, inclusions) VALUES (?, ?, ?)'
        );
        $stmt->execute([$name, number_format((float) $price, 2, '.', ''), $inclusions]);

        json_out(['id' => (int) db()->lastInsertId()], 201);
    }

    if ($method === 'PUT') {
        $id = (int) ($input['id'] ?? 0);
        $name = post_value($input, 'name');
        $price = post_value($input, 'price');
        $inclusions = post_value($input, 'inclusions');

        if (!$id || $name === '' || $price === '' || $inclusions === '') {
            fail('Plan name, price, and inclusions are required.');
        }
        if (!is_numeric($price) || (float) $price < 0) {
            fail('Price must be a valid amount.');
        }

        $stmt = db()->prepare(
            'UPDATE membership_plans SET name = ?, price = ?, inclusions = ? WHERE id = ?'
        );
        $stmt->execute([$name, number_format((float) $price, 2, '.', ''), $inclusions, $id]);

        json_out(['id' => $id]);
    }

    if ($method === 'DELETE') {
        $id = (int) ($input['id'] ?? 0);
        if (!$id) {
            fail('Plan id is required.');
        }

        $stmt = db()->prepare('SELECT COUNT(*) AS n FROM memberships WHERE plan_id = ?');
        $stmt->execute([$id]);
        if ((int) $stmt->fetch()['n'] > 0) {
            fail('Cannot delete: members are currently on this plan.', 409);
        }

        $stmt = db()->prepare('DELETE FROM membership_plans WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            fail('Plan not found.', 404);
        }
        json_out(['id' => $id]);
    }

    fail('Method not allowed.', 405);
});
