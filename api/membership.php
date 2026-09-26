<?php
require __DIR__ . '/db.php';

/* POST { plan_id } -> switch my membership to a plan (member; 1 month from today) */

endpoint(function () {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        fail('Method not allowed.', 405);
    }

    $user = require_user('member');
    $input = json_in();
    $planId = (int) ($input['plan_id'] ?? 0);

    if (!$planId) {
        fail('Plan id is required.');
    }

    $stmt = db()->prepare(
        'SELECT id, name FROM membership_plans WHERE id = ? AND is_active = 1'
    );
    $stmt->execute([$planId]);
    $plan = $stmt->fetch();
    if (!$plan) {
        fail('That plan is not available.', 404);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            "UPDATE memberships SET status = 'cancelled'
              WHERE user_id = ? AND status = 'active'"
        );
        $stmt->execute([(int) $user['id']]);

        $stmt = $pdo->prepare(
            "INSERT INTO memberships (user_id, plan_id, status, start_date, end_date)
             VALUES (?, ?, 'active', CURDATE(), CURDATE() + INTERVAL 1 MONTH)"
        );
        $stmt->execute([(int) $user['id'], $planId]);

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    json_out(['plan' => $plan['name'], 'plan_id' => $planId]);
});
