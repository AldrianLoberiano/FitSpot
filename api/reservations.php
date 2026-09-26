<?php
require __DIR__ . '/db.php';

/* GET    -> all reservations with member, class, and schedule (admin)
   POST { id, action: confirm|cancel } -> update a reservation status (admin) */

endpoint(function () {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        require_user('admin');

        $rows = db()->query(
            "SELECT b.id, b.status, b.booked_at,
                    u.full_name AS member,
                    c.name AS class_name,
                    s.schedule_date, s.start_time, s.end_time
               FROM bookings b
               JOIN users u ON u.id = b.user_id
               JOIN class_schedules s ON s.id = b.schedule_id
               JOIN fitness_classes c ON c.id = s.class_id
              ORDER BY b.booked_at DESC, b.id DESC"
        )->fetchAll();

        $result = [];
        foreach ($rows as $row) {
            $badge = status_badge($row['status']);
            $result[] = [
                'id'          => (int) $row['id'],
                'member'      => $row['member'],
                'class_name'  => $row['class_name'],
                'schedule'    => schedule_label($row['schedule_date'], $row['start_time'], $row['end_time']),
                'status'      => $row['status'],
                'status_label'=> $badge[0],
                'status_color'=> $badge[1],
            ];
        }

        json_out(['reservations' => $result]);
    }

    require_user('admin');
    $input = json_in();

    if ($method === 'POST') {
        $id = (int) ($input['id'] ?? 0);
        $action = post_value($input, 'action');

        if (!$id || !in_array($action, ['confirm', 'cancel'], true)) {
            fail('Reservation id and a valid action are required.');
        }

        $stmt = db()->prepare('SELECT status FROM bookings WHERE id = ?');
        $stmt->execute([$id]);
        $booking = $stmt->fetch();
        if (!$booking) {
            fail('Reservation not found.', 404);
        }
        if ($booking['status'] === $action . 'ed' || ($action === 'cancel' && $booking['status'] === 'cancelled')) {
            fail('That reservation is already ' . $booking['status'] . '.', 409);
        }

        if ($action === 'confirm') {
            db()->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?")->execute([$id]);
            $badge = status_badge('confirmed');
        } else {
            db()->prepare(
                "UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?"
            )->execute([$id]);
            $badge = status_badge('cancelled');
        }

        json_out([
            'id'           => $id,
            'status'       => $action === 'confirm' ? 'confirmed' : 'cancelled',
            'status_label' => $badge[0],
            'status_color' => $badge[1],
        ]);
    }

    fail('Method not allowed.', 405);
});
