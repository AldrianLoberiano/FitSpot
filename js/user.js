document.addEventListener('DOMContentLoaded', async function () {
    const API = '../../api/';
    const SERVER_HINT = ' Could not reach the server - start it with: php -S localhost:8000';

    /* ===== helpers ===== */

    async function apiCall(method, file, body) {
        const options = { method: method, headers: {} };
        if (body !== undefined) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        const res = await fetch(API + file, options);
        let data = null;
        try { data = await res.json(); } catch (error) {}
        if (!res.ok) {
            throw new Error((data && data.error) || 'Could not reach the server.');
        }
        return data;
    }

    function esc(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function peso(amount) {
        return '\u20B1' + Number(amount).toLocaleString('en-PH', { maximumFractionDigits: 0 });
    }

    function formatDate(value) {
        if (!value) return '—';
        return new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });
    }

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

    function showBanner(text) {
        let banner = document.getElementById('api-error-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'api-error-banner';
            banner.className = 'api-error-banner';
            banner.setAttribute('role', 'alert');
            document.body.appendChild(banner);
        }
        banner.textContent = text;
        banner.hidden = false;
    }

    function initials(fullName) {
        return String(fullName || '')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(function (word) { return word[0].toUpperCase(); })
            .join('') || '?';
    }

    /* ===== auth guard ===== */

    let currentUser = null;

    try {
        currentUser = await apiCall('GET', 'me.php');
    } catch (error) {
        if (error.message === 'Please log in first.') {
            window.location.replace('../../index.html');
            return;
        }
        showBanner('Not connected to the backend.' + SERVER_HINT);
        return;
    }

    if (currentUser.role !== 'member') {
        window.location.replace('../../index.html');
        return;
    }

    const avatar = document.getElementById('user-avatar');
    if (avatar) avatar.textContent = initials(currentUser.full_name);

    /* ===== dropdown + logout ===== */

    const dropdown = document.getElementById('user-dropdown');
    const logoutButton = document.getElementById('user-logout');

    if (avatar && dropdown) {
        avatar.addEventListener('click', function (event) {
            event.stopPropagation();
            const isOpen = dropdown.hidden;
            dropdown.hidden = !isOpen;
            avatar.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', function (event) {
            if (!dropdown.hidden && !dropdown.contains(event.target)) {
                dropdown.hidden = true;
                avatar.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async function () {
            try { await apiCall('POST', 'logout.php'); } catch (error) {}
            window.location.replace('../../index.html');
        });
    }

    /* ===== data loaders ===== */

    let profile = null;
    let myBookings = [];

    async function loadProfile() {
        profile = await apiCall('GET', 'profile.php');
        return profile;
    }

    function applyPlan() {
        const planName = profile && profile.membership ? profile.membership.plan : null;

        document.querySelectorAll('.plan-card').forEach(function (card) {
            const isCurrent = Boolean(planName)
                && card.dataset.plan === planName
                && profile.membership.status === 'active';
            const tag = card.querySelector('.plan-tag');
            const choose = card.querySelector('.plan-choose');

            card.classList.toggle('is-current', isCurrent);
            if (tag) tag.hidden = !isCurrent;
            if (choose) choose.hidden = isCurrent;
        });

        setText('stat-plan', planName || 'No plan');
        setText('profile-plan', planName || 'No plan');
    }

    async function loadOverview() {
        const tbody = document.getElementById('tbody-overview');
        if (!tbody) return;

        try {
            const [bookingData] = await Promise.all([
                apiCall('GET', 'bookings.php'),
                loadProfile()
            ]);
            myBookings = bookingData.bookings;

            const upcoming = myBookings.filter(function (booking) { return booking.is_upcoming; });

            const welcome = document.getElementById('welcome-heading');
            if (welcome) {
                const first = String(currentUser.full_name || '').split(/\s+/)[0];
                welcome.textContent = 'Welcome back, ' + first + '!';
            }

            if (!upcoming.length) {
                tbody.innerHTML = '<tr><td colspan="3">No upcoming bookings. Open Fitness Classes to reserve a slot.</td></tr>';
            } else {
                tbody.innerHTML = upcoming.slice(0, 5).map(function (booking) {
                    return '<tr>' +
                        '<td>' + esc(booking.class_name) + '</td>' +
                        '<td>' + esc(booking.schedule) + '</td>' +
                        '<td><span class="badge ' + booking.status_color + '">' + esc(booking.status_label) + '</span></td>' +
                        '</tr>';
                }).join('');
            }

            setText('stat-upcoming', upcoming.length);
            setText('stat-confirmed', upcoming.filter(function (booking) {
                return booking.status === 'confirmed';
            }).length);
            setText('stat-days', profile.membership ? profile.membership.days_left : '—');
            applyPlan();
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="3">' + esc('Bookings could not be loaded.' + SERVER_HINT) + '</td></tr>';
        }
    }

    async function loadClassesPage() {
        const grid = document.getElementById('class-grid');
        if (!grid) return;

        try {
            const data = await apiCall('GET', 'classes.php?upcoming=1');
            if (!data.schedules.length) {
                grid.innerHTML = '<p class="empty-state">No upcoming classes are scheduled right now.</p>';
                return;
            }

            grid.innerHTML = data.schedules.map(function (slot) {
                const isBooked = slot.my_status !== null;
                const isFull = slot.remaining <= 0;
                const percent = slot.capacity > 0
                    ? Math.round((slot.booked / slot.capacity) * 100) : 0;

                let button;
                if (isBooked) {
                    button = '<button type="button" class="btn-book" disabled>' +
                        (slot.my_status === 'confirmed' ? 'Booked' : 'Booked') + '</button>';
                } else if (isFull) {
                    button = '<button type="button" class="btn-book" disabled>Class Full</button>';
                } else {
                    button = '<button type="button" class="btn-book" data-book="' + slot.schedule_id +
                        '" data-name="' + esc(slot.name) + '">Book Class</button>';
                }

                return '' +
                    '<article class="class-card">' +
                        '<div class="class-card-head">' +
                            '<h3>' + esc(slot.name) + '</h3>' +
                            '<span class="badge ' + slot.badge_color + '">' + esc(slot.badge_label) + '</span>' +
                        '</div>' +
                        '<p class="class-desc">' + esc(slot.description || '') + '</p>' +
                        '<p class="class-schedule">' + esc(slot.schedule) + '</p>' +
                        '<div class="slot-cell">' +
                            '<span class="slot-text">' + slot.booked + ' of ' + slot.capacity + ' slots booked</span>' +
                            '<div class="slot-bar' + (isFull ? ' is-full' : '') + '"><span style="width: ' + percent + '%;"></span></div>' +
                        '</div>' +
                        button +
                    '</article>';
            }).join('');
        } catch (error) {
            showNote('class-note', 'Classes could not be loaded.' + SERVER_HINT, true);
        }
    }

    async function loadBookingsPage() {
        const tbody = document.getElementById('tbody-bookings');
        if (!tbody) return;

        const params = new URLSearchParams(window.location.search);
        const bookedNote = params.get('booked');
        if (bookedNote) {
            showNote('booking-note', 'Booking request sent for ' + bookedNote + '. Awaiting confirmation.', false);
            history.replaceState({}, '', window.location.pathname);
        }

        try {
            const data = await apiCall('GET', 'bookings.php');
            myBookings = data.bookings;

            const tableCard = document.getElementById('bookings-table');
            const emptyState = document.getElementById('bookings-empty');
            const hasBookings = myBookings.length > 0;
            if (tableCard) tableCard.hidden = !hasBookings;
            if (emptyState) emptyState.hidden = hasBookings;

            tbody.innerHTML = myBookings.map(function (booking) {
                const action = booking.status === 'cancelled'
                    ? ''
                    : '<button type="button" class="btn-sm btn-delete" data-cancel-booking="' + booking.id + '">Cancel</button>';

                return '' +
                    '<tr>' +
                        '<td>' + esc(booking.class_name) + '</td>' +
                        '<td>' + esc(booking.schedule) + '</td>' +
                        '<td class="status-cell"><span class="badge ' + booking.status_color + '">' + esc(booking.status_label) + '</span></td>' +
                        '<td>' + action + '</td>' +
                    '</tr>';
            }).join('');
        } catch (error) {
            showNote('booking-note', 'Bookings could not be loaded.' + SERVER_HINT, true);
        }
    }

    async function loadPlansPage() {
        const grid = document.getElementById('plans-grid');
        if (!grid) return;

        try {
            const [plansData] = await Promise.all([
                apiCall('GET', 'plans.php'),
                loadProfile()
            ]);

            grid.innerHTML = plansData.plans.map(function (plan) {
                const bullets = String(plan.inclusions).split(';')
                    .map(function (line) { return line.trim(); })
                    .filter(Boolean)
                    .map(function (line) { return '<li>' + esc(line) + '</li>'; })
                    .join('');

                return '' +
                    '<article class="plan-card" data-plan="' + esc(plan.name) + '">' +
                        '<h3>' + esc(plan.name) + '</h3>' +
                        '<p class="plan-price">' + peso(plan.price) + '<span> / month</span></p>' +
                        '<ul>' + bullets + '</ul>' +
                        '<div class="plan-footer">' +
                            '<span class="badge badge-orange plan-tag" hidden>Current Plan</span>' +
                            '<button type="button" class="plan-choose" data-choose data-plan-id="' + plan.id + '">Choose Plan</button>' +
                        '</div>' +
                    '</article>';
            }).join('');

            applyPlan();
        } catch (error) {
            showNote('plan-note', 'Plans could not be loaded.' + SERVER_HINT, true);
        }
    }

    async function loadProfilePage() {
        const profileForm = document.getElementById('profile-form');
        if (!profileForm) return;

        try {
            if (!profile) await loadProfile();

            const nameInput = document.getElementById('profile-name');
            const emailInput = document.getElementById('profile-email');
            const phoneInput = document.getElementById('profile-phone');
            const addressInput = document.getElementById('profile-address');

            if (nameInput) nameInput.value = profile.full_name || '';
            if (emailInput) emailInput.value = profile.email || '';
            if (phoneInput) phoneInput.value = profile.phone || '';
            if (addressInput) addressInput.value = profile.address || '';

            const membership = profile.membership;
            const statusWrap = document.getElementById('profile-status');
            if (statusWrap) {
                if (!membership) {
                    statusWrap.innerHTML = '<span class="badge badge-gray">No Membership</span>';
                } else if (membership.status === 'active') {
                    statusWrap.innerHTML = '<span class="badge badge-green">Active</span>';
                } else {
                    statusWrap.innerHTML = '<span class="badge badge-gray">Expired</span>';
                }
            }

            setText('profile-since', membership ? formatDate(membership.start_date) : formatDate(String(profile.created_at).slice(0, 10)));
            setText('profile-expires', membership ? formatDate(membership.end_date) : '—');
            applyPlan();
        } catch (error) {
            const message = document.getElementById('profile-message');
            if (message) {
                message.textContent = 'Profile could not be loaded.' + SERVER_HINT;
                message.classList.remove('is-success');
                message.hidden = false;
            }
        }
    }

    /* ===== actions ===== */

    const classGrid = document.getElementById('class-grid');
    if (classGrid) {
        classGrid.addEventListener('click', async function (event) {
            const button = event.target.closest('[data-book]');
            if (!button) return;

            button.disabled = true;

            try {
                await apiCall('POST', 'bookings.php', {
                    schedule_id: Number(button.dataset.book)
                });
            } catch (error) {
                button.disabled = false;
                showNote('class-note', error.message, true);
                return;
            }

            window.location.href = 'bookings.html?booked=' + encodeURIComponent(button.dataset.name);
        });
    }

    const bookingsBody = document.getElementById('tbody-bookings');
    if (bookingsBody) {
        bookingsBody.addEventListener('click', async function (event) {
            const button = event.target.closest('[data-cancel-booking]');
            if (!button) return;

            const bookingId = Number(button.dataset.cancelBooking);
            const booking = myBookings.find(function (item) { return item.id === bookingId; });

            try {
                await apiCall('POST', 'bookings.php', { id: bookingId, action: 'cancel' });
            } catch (error) {
                showNote('booking-note', error.message, true);
                return;
            }

            showNote('booking-note',
                'Your booking for ' + (booking ? booking.class_name : 'the class') + ' was cancelled.', true);
            loadBookingsPage();
        });
    }

    const plansGrid = document.getElementById('plans-grid');
    if (plansGrid) {
        plansGrid.addEventListener('click', async function (event) {
            const button = event.target.closest('[data-choose]');
            if (!button) return;

            const card = button.closest('.plan-card');
            if (!card) return;

            button.disabled = true;

            try {
                const result = await apiCall('POST', 'membership.php', {
                    plan_id: Number(button.dataset.planId)
                });
                showNote('plan-note', 'Your membership is now the ' + result.plan + '.', false);
                await loadPlansPage();
            } catch (error) {
                button.disabled = false;
                showNote('plan-note', error.message, true);
            }
        });
    }

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const message = document.getElementById('profile-message');
            const fullName = document.getElementById('profile-name').value.trim();
            const email = document.getElementById('profile-email').value.trim();
            const phone = document.getElementById('profile-phone').value.trim();
            const address = document.getElementById('profile-address').value.trim();

            try {
                await apiCall('POST', 'profile.php', {
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    address: address
                });
            } catch (error) {
                if (message) {
                    message.textContent = error.message;
                    message.classList.remove('is-success');
                    message.hidden = false;
                }
                return;
            }

            currentUser.full_name = fullName;
            currentUser.email = email;
            currentUser.phone = phone;
            currentUser.address = address;
            if (avatar) avatar.textContent = initials(currentUser.full_name);

            if (message) {
                message.textContent = 'Profile updated successfully.';
                message.classList.add('is-success');
                message.hidden = false;
            }
        });
    }

    /* ===== boot ===== */

    await Promise.all([
        loadOverview(),
        loadClassesPage(),
        loadBookingsPage(),
        loadPlansPage(),
        loadProfilePage()
    ]);
});
