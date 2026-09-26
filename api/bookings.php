<?php
require __DIR__ . '/db.php';

/* GET                 -> my bookings with class + schedule details (member)
   POST { schedule_id } or { class_name, schedule_date }
                     -> book a slot (member; capacity-safe transaction)
   POST { id, action: 'cancel' }
                     -> cancel my booking (member) */

endpoint(function () {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $user = require_user('member');

        $stmt = db()->prepare(
            "SELECT b.id, b.status, b.booked_at,
                    s.id AS schedule_id, s.schedule_date, s.start_time, s.end_time,
                    c.name AS class_name
               FROM bookings b
               JOIN class_schedules s ON s.id = b.schedule_id
               JOIN fitness_classes c ON c.id = s.class_id
              WHERE b.user_id = ?
              ORDER BY s.schedule_date, s.start_time"
        );
        $stmt->execute([(int) $user['id']]);

        $today = new DateTime('today');
        $result = [];
        foreach ($stmt->fetchAll() as $row) {
            $badge = status_badge($row['status']);
            $result[] = [
                'id'           => (int) $row['id'],
                'schedule_id'  => (int) $row['schedule_id'],
                'class_name'   => $row['class_name'],
                'schedule'     => schedule_label($row['schedule_date'], $row['start_time'], $row['end_time']),
                'status'       => $row['status'],
                'status_label' => $badge[0],
                'status_color' => $badge[1],
                'is_upcoming'  => new DateTime($row['schedule_date']) >= $today
                                  && $row['status'] !== 'cancelled',
            ];
        }

        json_out(['bookings' => $result]);
    }

    $user = require_user('member');
    $input = json_in();
    $action = post_value($input, 'action');

    if ($action === 'cancel') {
        $id = (int) ($input['id'] ?? 0);
        if (!$id) {
            fail('Booking id is required.');
        }

        $stmt = db()->prepare('SELECT id, status FROM bookings WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, (int) $user['id']]);
        $booking = $stmt->fetch();
        if (!$booking) {
            fail('Booking not found.', 404);
        }
        if ($booking['status'] === 'cancelled') {
            fail('That booking is already cancelled.', 409);
        }

        db()->prepare(
            "UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?"
        )->execute([$id]);

        json_out(['id' => $id, 'status' => 'cancelled']);
    }

    /* ---- book a slot ---- */

    $pdo = db();
    $pdo->beginTransaction();

    try {
        $scheduleId = (int) ($input['schedule_id'] ?? 0);
        $className = post_value($input, 'class_name');
        $date = post_value($input, 'schedule_date');

        if (!$scheduleId && ($className === '' || $date === '')) {
            $pdo->rollBack();
            fail('A class schedule is required.');
        }

        if (!$scheduleId) {
            $stmt = $pdo->prepare(
                "SELECT s.id FROM class_schedules s
                   JOIN fitness_classes c ON c.id = s.class_id
                  WHERE LOWER(c.name) = ? AND s.schedule_date = ?
                    AND s.status <> 'cancelled'
                  ORDER BY s.start_time LIMIT 1"
            );
            $stmt->execute([strtolower($className), $date]);
            $found = $stmt->fetch();
            if (!$found) {
                $pdo->rollBack();
                fail('No schedule found for that class on that date.', 404);
            }
            $scheduleId = (int) $found['id'];
        }

        $stmt = $pdo->prepare(
            'SELECT id, schedule_date, start_time, capacity, status
               FROM class_schedules WHERE id = ? FOR UPDATE'
        );
        $stmt->execute([$scheduleId]);
        $schedule = $stmt->fetch();
        if (!$schedule) {
            $pdo->rollBack();
            fail('Schedule not found.', 404);
        }
        if ($schedule['status'] === 'cancelled') {
            $pdo->rollBack();
            fail('That class has been cancelled.', 409);
        }

        $startsAt = new DateTime($schedule['schedule_date'] . ' ' . $schedule['start_time']);
        if ($startsAt < new DateTime()) {
            $pdo->rollBack();
            fail('That class has already started.', 409);
        }

        $stmt = $pdo->prepare(
            "SELECT COUNT(*) AS n FROM bookings
              WHERE schedule_id = ? AND status IN ('pending', 'confirmed')"
        );
        $stmt->execute([$scheduleId]);
        if ((int) $stmt->fetch()['n'] >= (int) $schedule['capacity']) {
            $pdo->rollBack();
            fail('That class is already full.', 409);
        }

        $stmt = $pdo->prepare(
            'SELECT id, status FROM bookings WHERE user_id = ? AND schedule_id = ? FOR UPDATE'
        );
        $stmt->execute([(int) $user['id'], $scheduleId]);
        $existing = $stmt->fetch();

        if ($existing && $existing['status'] !== 'cancelled') {
            $pdo->rollBack();
            fail('You have already booked this class.', 409);
        }

        if ($existing) {
            db()->prepare(
                "UPDATE bookings
                    SET status = 'pending', booked_at = NOW(), cancelled_at = NULL
                  WHERE id = ?"
            )->execute([(int) $existing['id']]);
            $bookingId = (int) $existing['id'];
        } else {
            $stmt = $pdo->prepare(
                "INSERT INTO bookings (user_id, schedule_id, status) VALUES (?, ?, 'pending')"
            );
            $stmt->execute([(int) $user['id'], $scheduleId]);
            $bookingId = (int) $pdo->lastInsertId();
        }

        $pdo->commit();

        json_out(['id' => $bookingId, 'status' => 'pending'], 201);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
});
