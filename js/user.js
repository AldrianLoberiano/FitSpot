(function requireMember() {
    try {
        if (sessionStorage.getItem('fitspot-user') !== '1') {
            window.location.replace('../../index.html');
        }
    } catch (error) {}
})();

document.addEventListener('DOMContentLoaded', function () {
    const menuButtons = document.querySelectorAll('.sidebar-menu button[data-view]');
    const views = document.querySelectorAll('.admin-view');
    const pageTitle = document.getElementById('user-page-title');

    function showView(view) {
        menuButtons.forEach(function (button) {
            button.classList.toggle('is-active', button.dataset.view === view);
        });

        views.forEach(function (section) {
            section.classList.toggle('is-active', section.id === 'view-' + view);
        });

        const activeButton = document.querySelector('.sidebar-menu button[data-view="' + view + '"]');
        if (pageTitle && activeButton) pageTitle.textContent = activeButton.textContent.trim();
    }

    menuButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            showView(button.dataset.view);
        });
    });

    const avatar = document.getElementById('user-avatar');
    const dropdown = document.getElementById('user-dropdown');
    const logoutButton = document.getElementById('user-logout');

    function closeDropdown() {
        if (!dropdown || !avatar) return;
        dropdown.hidden = true;
        avatar.setAttribute('aria-expanded', 'false');
    }

    if (avatar && dropdown) {
        avatar.addEventListener('click', function (event) {
            event.stopPropagation();
            const isOpen = dropdown.hidden;
            dropdown.hidden = !isOpen;
            avatar.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', function (event) {
            if (!dropdown.hidden && !dropdown.contains(event.target)) {
                closeDropdown();
            }
        });
    }

    document.addEventListener('click', function (event) {
        const viewButton = event.target.closest('[data-open-view]');
        if (viewButton) {
            closeDropdown();
            showView(viewButton.dataset.openView);
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            try {
                sessionStorage.removeItem('fitspot-user');
            } catch (error) {}
            window.location.replace('../../index.html');
        });
    }

    /* ===== DEMO DATA ===== */

    const classes = [
        {
            id: 'zumba',
            name: 'Zumba',
            desc: 'Fun dance-based fitness class for all levels.',
            schedule: 'Monday | 5:00 PM',
            booked: 6,
            capacity: 8
        },
        {
            id: 'yoga',
            name: 'Yoga',
            desc: 'Improve flexibility, balance, and relaxation.',
            schedule: 'Tuesday | 6:00 PM',
            booked: 5,
            capacity: 5
        },
        {
            id: 'strength',
            name: 'Strength Training',
            desc: 'Build strength through guided exercises.',
            schedule: 'Wednesday | 5:00 PM',
            booked: 3,
            capacity: 10
        }
    ];

    let bookings = [
        {
            id: 'bk1',
            classId: 'zumba',
            name: 'Zumba',
            schedule: 'Monday | 5:00 PM',
            status: 'Pending'
        }
    ];

    let bookingCounter = 1;

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    }

    function showNote(id, text, isError) {
        const note = document.getElementById(id);
        if (!note) return;
        note.textContent = text;
        note.classList.toggle('is-error', Boolean(isError));
        note.hidden = false;
    }

    function statusBadge(status) {
        if (status === 'Confirmed') return 'badge-green';
        if (status === 'Pending') return 'badge-orange';
        return 'badge-gray';
    }

    function renderClasses() {
        const grid = document.getElementById('class-grid');
        if (!grid) return;

        grid.innerHTML = classes.map(function (fitnessClass) {
            const isBooked = bookings.some(function (booking) {
                return booking.classId === fitnessClass.id && booking.status !== 'Cancelled';
            });
            const isFull = fitnessClass.booked >= fitnessClass.capacity;
            const percent = Math.round((fitnessClass.booked / fitnessClass.capacity) * 100);

            let badge = '<span class="badge badge-green">Open</span>';
            if (isFull) {
                badge = '<span class="badge badge-red">Full</span>';
            } else if (isBooked) {
                badge = '<span class="badge badge-orange">Booked</span>';
            }

            let button;
            if (isBooked) {
                button = '<button type="button" class="btn-book" disabled>Booked</button>';
            } else if (isFull) {
                button = '<button type="button" class="btn-book" disabled>Class Full</button>';
            } else {
                button = '<button type="button" class="btn-book" data-book="' + fitnessClass.id + '">Book Class</button>';
            }

            return '' +
                '<article class="class-card">' +
                    '<div class="class-card-head">' +
                        '<h3>' + fitnessClass.name + '</h3>' +
                        badge +
                    '</div>' +
                    '<p class="class-desc">' + fitnessClass.desc + '</p>' +
                    '<p class="class-schedule">' + fitnessClass.schedule + '</p>' +
                    '<div class="slot-cell">' +
                        '<span class="slot-text">' + fitnessClass.booked + ' of ' + fitnessClass.capacity + ' slots booked</span>' +
                        '<div class="slot-bar' + (isFull ? ' is-full' : '') + '"><span style="width: ' + percent + '%;"></span></div>' +
                    '</div>' +
                    button +
                '</article>';
        }).join('');
    }

    function renderBookings() {
        const tbody = document.getElementById('tbody-bookings');
        const tableCard = document.getElementById('bookings-table');
        const emptyState = document.getElementById('bookings-empty');
        if (!tbody) return;

        tbody.innerHTML = bookings.map(function (booking) {
            const action = booking.status === 'Cancelled'
                ? ''
                : '<button type="button" class="btn-sm btn-delete" data-cancel-booking="' + booking.id + '">Cancel</button>';

            return '' +
                '<tr>' +
                    '<td>' + booking.name + '</td>' +
                    '<td>' + booking.schedule + '</td>' +
                    '<td class="status-cell"><span class="badge ' + statusBadge(booking.status) + '">' + booking.status + '</span></td>' +
                    '<td>' + action + '</td>' +
                '</tr>';
        }).join('');

        const hasBookings = bookings.length > 0;
        if (tableCard) tableCard.hidden = !hasBookings;
        if (emptyState) emptyState.hidden = hasBookings;
    }

    function renderOverview() {
        const tbody = document.getElementById('tbody-overview');
        if (!tbody) return;

        const active = bookings.filter(function (booking) {
            return booking.status !== 'Cancelled';
        });

        if (active.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No upcoming bookings. Open Fitness Classes to reserve a slot.</td></tr>';
        } else {
            tbody.innerHTML = active.map(function (booking) {
                return '' +
                    '<tr>' +
                        '<td>' + booking.name + '</td>' +
                        '<td>' + booking.schedule + '</td>' +
                        '<td><span class="badge ' + statusBadge(booking.status) + '">' + booking.status + '</span></td>' +
                    '</tr>';
            }).join('');
        }

        setText('stat-upcoming', active.length);
        setText('stat-confirmed', active.filter(function (booking) {
            return booking.status === 'Confirmed';
        }).length);
    }

    function renderAll() {
        renderClasses();
        renderBookings();
        renderOverview();
    }

    const classGrid = document.getElementById('class-grid');
    if (classGrid) {
        classGrid.addEventListener('click', function (event) {
            const button = event.target.closest('[data-book]');
            if (!button) return;

            const fitnessClass = classes.find(function (item) {
                return item.id === button.dataset.book;
            });

            if (!fitnessClass || fitnessClass.booked >= fitnessClass.capacity) {
                showNote('class-note', 'Sorry, that class is already full.', true);
                return;
            }

            fitnessClass.booked += 1;
            bookingCounter += 1;
            bookings.push({
                id: 'bk' + bookingCounter,
                classId: fitnessClass.id,
                name: fitnessClass.name,
                schedule: fitnessClass.schedule,
                status: 'Pending'
            });

            renderAll();
            showNote('booking-note', 'Booking request sent for ' + fitnessClass.name + '. Awaiting confirmation.');
            showView('bookings');
        });
    }

    const bookingsBody = document.getElementById('tbody-bookings');
    if (bookingsBody) {
        bookingsBody.addEventListener('click', function (event) {
            const button = event.target.closest('[data-cancel-booking]');
            if (!button) return;

            const booking = bookings.find(function (item) {
                return item.id === button.dataset.cancelBooking;
            });
            if (!booking) return;

            booking.status = 'Cancelled';

            const fitnessClass = classes.find(function (item) {
                return item.id === booking.classId;
            });
            if (fitnessClass) {
                fitnessClass.booked = Math.max(0, fitnessClass.booked - 1);
            }

            renderAll();
            showNote('booking-note', 'Your booking for ' + booking.name + ' was cancelled.', true);
        });
    }

    document.querySelectorAll('.plan-choose[data-choose]').forEach(function (button) {
        button.addEventListener('click', function () {
            const card = button.closest('.plan-card');
            if (!card) return;

            document.querySelectorAll('.plan-card').forEach(function (planCard) {
                const isCurrent = planCard === card;
                const tag = planCard.querySelector('.plan-tag');
                const choose = planCard.querySelector('.plan-choose');

                planCard.classList.toggle('is-current', isCurrent);
                if (tag) tag.hidden = !isCurrent;
                if (choose) choose.hidden = isCurrent;
            });

            setText('stat-plan', card.dataset.plan);
            setText('profile-plan', card.dataset.plan);
            showNote('plan-note', 'Your membership is now the ' + card.dataset.plan + '.', false);
        });
    });

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const message = document.getElementById('profile-message');
            if (message) {
                message.textContent = 'Profile updated successfully (demo only - not saved after refresh).';
                message.hidden = false;
            }
        });
    }

    renderAll();
});
