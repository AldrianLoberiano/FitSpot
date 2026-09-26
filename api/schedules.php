<?php
require __DIR__ . '/db.php';

/* GET ?all=1 -> every schedule with slot usage (admin; default: upcoming, open)
   POST       -> create a schedule (admin)
   DELETE     -> delete a schedule (admin, cascades bookings) */

endpoint(function () {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $isAdmin = false;
        $user = current_user();
        if ($user !== null && $user['role'] === 'admin') {
            $isAdmin = isset($_GET['all']) || isset($_GET['admin']);
        }

        if ($isAdmin) {
            $rows = db()->query(
                "SELECT s.id AS schedule_id, s.class_id, c.name AS class_name,
                        s.schedule_date, s.start_time, s.end_time, s.capacity, s.status,
                        (SELECT COUNT(*) FROM bookings b
                          WHERE b.schedule_id = s.id
                            AND b.status IN ('pending', 'confirmed')) AS booked
                   FROM class_schedules s
                   JOIN fitness_classes c ON c.id = s.class_id
                  ORDER BY s.schedule_date, s.start_time"
            )->fetchAll();
        } else {
            $rows = db()->query(
                "SELECT s.id AS schedule_id, s.class_id, c.name AS class_name,
                        s.schedule_date, s.start_time, s.end_time, s.capacity, s.status,
                        (SELECT COUNT(*) FROM bookings b
                          WHERE b.schedule_id = s.id
                            AND b.status IN ('pending', 'confirmed')) AS booked
                   FROM class_schedules s
                   JOIN fitness_classes c ON c.id = s.class_id
                  WHERE s.schedule_date >= CURDATE() AND s.status <> 'cancelled'
                  ORDER BY s.schedule_date, s.start_time"
            )->fetchAll();
        }

        $result = [];
        foreach ($rows as $row) {
            $booked = (int) $row['booked'];
            $capacity = (int) $row['capacity'];
            $full = $booked >= $capacity;
            $result[] = [
                'schedule_id' => (int) $row['schedule_id'],
                'class_id'    => (int) $row['class_id'],
                'class_name'  => $row['class_name'],
                'date'        => $row['schedule_date'],
                'schedule'    => schedule_label($row['schedule_date'], $row['start_time'], $row['end_time']),
                'booked'      => $booked,
                'capacity'    => $capacity,
                'percent'     => $capacity > 0 ? min(100, (int) round($booked / $capacity * 100)) : 0,
                'status'      => $row['status'],
                'slot_label'  => $full ? 'Full' : 'Open',
                'slot_color'  => $full ? 'badge-red' : 'badge-green',
            ];
        }

        json_out(['schedules' => $result]);
    }

    require_user('admin');
    $input = json_in();

    if ($method === 'POST') {
        $classId = (int) ($input['class_id'] ?? 0);
        $date = post_value($input, 'schedule_date');
        $start = post_value($input, 'start_time');
        $end = post_value($input, 'end_time');
        $capacity = post_value($input, 'capacity');

        if (!$classId) {
            fail('Please choose a class.');
        }
        if (!DateTime::createFromFormat('Y-m-d', $date)) {
            fail('Please choose a valid date.');
        }
        if (!DateTime::createFromFormat('H:i', $start) || !DateTime::createFromFormat('H:i', $end)) {
            fail('Please choose valid start and end times.');
        }
        if ($end <= $start) {
            fail('End time must be after start time.');
        }
        if (!ctype_digit($capacity) || (int) $capacity < 1) {
            fail('Capacity must be at least 1.');
        }

        $stmt = db()->prepare(
            'INSERT INTO class_schedules (class_id, schedule_date, start_time, end_time, capacity)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$classId, $date, $start, $end, (int) $capacity]);

        json_out(['id' => (int) db()->lastInsertId()], 201);
    }

    if ($method === 'DELETE') {
        $id = (int) ($input['id'] ?? 0);
        if (!$id) {
            fail('Schedule id is required.');
        }
        db()->prepare('DELETE FROM class_schedules WHERE id = ?')->execute([$id]);
        json_out(['id' => $id]);
    }

    fail('Method not allowed.', 405);
});
