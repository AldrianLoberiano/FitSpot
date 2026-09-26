<?php
require __DIR__ . '/db.php';

/* GET ?upcoming=1 -> upcoming schedules with slot usage and my booking status (public/session)
   GET             -> classes with their next upcoming schedule (public)
   POST            -> create a class (admin)
   PUT             -> update a class (admin)
   DELETE          -> delete a class (admin, cascades schedules + bookings) */

endpoint(function () {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        if (isset($_GET['upcoming'])) {
            $user = current_user();

            $rows = db()->query(
                "SELECT s.id AS schedule_id, s.class_id, c.name, c.description,
                        s.schedule_date, s.start_time, s.end_time, s.capacity,
                        (SELECT COUNT(*) FROM bookings b
                          WHERE b.schedule_id = s.id
                            AND b.status IN ('pending', 'confirmed')) AS booked
                   FROM class_schedules s
                   JOIN fitness_classes c ON c.id = s.class_id
                  WHERE s.schedule_date >= CURDATE()
                    AND s.status <> 'cancelled'
                  ORDER BY s.schedule_date, s.start_time"
            )->fetchAll();

            $mine = [];
            if ($user !== null && $rows) {
                $ids = array_column($rows, 'schedule_id');
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $stmt = db()->prepare(
                    "SELECT schedule_id, status FROM bookings
                      WHERE user_id = ? AND status <> 'cancelled'
                        AND schedule_id IN ($placeholders)"
                );
                $stmt->execute(array_merge([(int) $user['id']], $ids));
                foreach ($stmt->fetchAll() as $booking) {
                    $mine[(int) $booking['schedule_id']] = $booking['status'];
                }
            }

            $result = [];
            foreach ($rows as $row) {
                $booked = (int) $row['booked'];
                $capacity = (int) $row['capacity'];
                $scheduleId = (int) $row['schedule_id'];
                $myStatus = $mine[$scheduleId] ?? null;
                $badge = $myStatus !== null
                    ? status_badge($myStatus)
                    : ($booked >= $capacity ? ['Full', 'badge-red'] : ['Open', 'badge-green']);

                $result[] = [
                    'schedule_id'  => $scheduleId,
                    'class_id'     => (int) $row['class_id'],
                    'name'         => $row['name'],
                    'description'  => $row['description'],
                    'schedule'     => schedule_label($row['schedule_date'], $row['start_time'], $row['end_time']),
                    'date'         => $row['schedule_date'],
                    'booked'       => $booked,
                    'capacity'     => $capacity,
                    'remaining'    => max(0, $capacity - $booked),
                    'my_status'    => $myStatus,
                    'badge_label'  => $badge[0],
                    'badge_color'  => $badge[1],
                ];
            }

            json_out(['schedules' => $result]);
        }

        $classes = db()->query(
            'SELECT id, name, description, capacity, is_active
               FROM fitness_classes ORDER BY name'
        )->fetchAll();

        $first = [];
        $scheds = db()->query(
            "SELECT id, class_id, schedule_date, start_time, end_time
               FROM class_schedules
              WHERE schedule_date >= CURDATE() AND status <> 'cancelled'
              ORDER BY schedule_date, start_time"
        )->fetchAll();
        foreach ($scheds as $sched) {
            $classId = (int) $sched['class_id'];
            if (!isset($first[$classId])) {
                $first[$classId] = $sched;
            }
        }

        $result = [];
        foreach ($classes as $class) {
            $classId = (int) $class['id'];
            $next = $first[$classId] ?? null;
            $result[] = [
                'id'           => $classId,
                'name'         => $class['name'],
                'description'  => $class['description'],
                'capacity'     => (int) $class['capacity'],
                'is_active'    => (int) $class['is_active'],
                'next_schedule' => $next
                    ? schedule_label($next['schedule_date'], $next['start_time'], $next['end_time'])
                    : null,
            ];
        }

        json_out(['classes' => $result]);
    }

    require_user('admin');
    $input = json_in();

    if ($method === 'POST') {
        $name = post_value($input, 'name');
        $description = post_value($input, 'description');
        $capacity = post_value($input, 'capacity');

        if ($name === '') {
            fail('Class name is required.');
        }
        if (!ctype_digit($capacity) || (int) $capacity < 1) {
            fail('Capacity must be at least 1.');
        }

        $stmt = db()->prepare(
            'INSERT INTO fitness_classes (name, description, capacity) VALUES (?, ?, ?)'
        );
        $stmt->execute([$name, $description !== '' ? $description : null, (int) $capacity]);

        json_out(['id' => (int) db()->lastInsertId()], 201);
    }

    if ($method === 'PUT') {
        $id = (int) ($input['id'] ?? 0);
        $name = post_value($input, 'name');
        $description = post_value($input, 'description');
        $capacity = post_value($input, 'capacity');

        if (!$id || $name === '') {
            fail('Class name is required.');
        }
        if (!ctype_digit($capacity) || (int) $capacity < 1) {
            fail('Capacity must be at least 1.');
        }

        $stmt = db()->prepare(
            'UPDATE fitness_classes SET name = ?, description = ?, capacity = ? WHERE id = ?'
        );
        $stmt->execute([$name, $description !== '' ? $description : null, (int) $capacity, $id]);

        json_out(['id' => $id]);
    }

    if ($method === 'DELETE') {
        $id = (int) ($input['id'] ?? 0);
        if (!$id) {
            fail('Class id is required.');
        }
        db()->prepare('DELETE FROM fitness_classes WHERE id = ?')->execute([$id]);
        json_out(['id' => $id]);
    }

    fail('Method not allowed.', 405);
});
