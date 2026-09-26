(function requireAdmin() {
    try {
        if (sessionStorage.getItem('fitspot-admin') !== '1') {
            window.location.replace('../../index.html');
        }
    } catch (error) {}
})();

document.addEventListener('DOMContentLoaded', function () {
    /* Navigation between admin pages is handled by the sidebar links
       (dashboard.html, memberships.html, classes.html, schedules.html,
       members.html, reservations.html). */

    const modal = document.getElementById('admin-form-modal');
    const modalTitle = document.getElementById('admin-modal-title');
    const form = document.getElementById('admin-form');
    const fieldsWrap = form.querySelector('.form-fields');

    const configs = {
        plan: {
            label: 'Membership Plan',
            tbody: 'tbody-plans',
            currency: '₱',
            fields: [
                { key: 'name', label: 'Plan Name', type: 'text', placeholder: 'e.g. Premium Plan' },
                { key: 'price', label: 'Price per Month', type: 'number', placeholder: 'e.g. 1499' },
                { key: 'inclusions', label: 'Inclusions', type: 'text', placeholder: 'e.g. Gym access plus selected classes' }
            ],
            columns: ['name', 'price', 'inclusions']
        },
        class: {
            label: 'Fitness Class',
            tbody: 'tbody-classes',
            fields: [
                { key: 'name', label: 'Class Name', type: 'text', placeholder: 'e.g. Pilates' },
                { key: 'schedule', label: 'Day & Time', type: 'text', placeholder: 'e.g. Thursday | 7:00 PM' },
                { key: 'slots', label: 'Available Slots', type: 'number', placeholder: 'e.g. 10' }
            ],
            columns: ['name', 'schedule', 'slots']
        },
        profile: {
            label: 'My Profile',
            formTitle: 'My Profile',
            fields: [
                { key: 'name', label: 'Full Name', type: 'text', value: 'Yzabelle Grace Cane' },
                { key: 'email', label: 'Email', type: 'email', value: 'admin@fitspot.com' },
                { key: 'phone', label: 'Contact Number', type: 'text', value: '+63 912 345 6789' }
            ],
            columns: []
        },
        settings: {
            label: 'Settings',
            formTitle: 'Settings',
            fields: [
                { key: 'gym', label: 'Gym Name', type: 'text', value: 'FitSpot' },
                { key: 'hours', label: 'Operating Hours', type: 'text', value: 'Monday - Saturday, 6:00 AM - 9:00 PM' },
                { key: 'slots', label: 'Max Slots per Class', type: 'number', value: '10' }
            ],
            columns: []
        }
    };

    let currentType = null;
    let currentRow = null;

    function openModal() {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        const firstInput = fieldsWrap.querySelector('input');
        if (firstInput) firstInput.focus();
    }

    function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        currentType = null;
        currentRow = null;
    }

    function openForm(type, row) {
        const config = configs[type];
        if (!config) return;

        currentType = type;
        currentRow = row || null;
        modalTitle.textContent = row
            ? 'Edit ' + config.label
            : (config.formTitle || 'Add ' + config.label);
        fieldsWrap.innerHTML = '';

        config.fields.forEach(function (field) {
            const inputId = 'admin-field-' + field.key;

            const label = document.createElement('label');
            label.setAttribute('for', inputId);
            label.textContent = field.label + ':';

            const input = document.createElement('input');
            input.type = field.type;
            input.id = inputId;
            input.name = field.key;
            input.placeholder = field.placeholder || '';
            input.required = true;
            if (field.type === 'number') input.min = '0';

            if (row) {
                const cell = row.querySelector('[data-field="' + field.key + '"]');
                if (cell) {
                    input.value = field.type === 'number'
                        ? cell.textContent.replace(/\D/g, '')
                        : cell.textContent;
                }
            } else if (field.value !== undefined) {
                input.value = field.value;
            }

            fieldsWrap.appendChild(label);
            fieldsWrap.appendChild(input);
        });

        openModal();
    }

    function buildRow(config, values) {
        const row = document.createElement('tr');

        config.columns.forEach(function (key) {
            const cell = document.createElement('td');
            cell.dataset.field = key;
            cell.textContent = values[key];
            row.appendChild(cell);
        });

        const actions = document.createElement('td');
        actions.innerHTML =
            '<button type="button" class="btn-sm btn-edit" data-edit>Edit</button>' +
            '<button type="button" class="btn-sm btn-delete" data-delete>Delete</button>';
        row.appendChild(actions);

        return row;
    }

    function saveForm() {
        const config = configs[currentType];
        if (!config) return;

        const values = {};
        let valid = true;

        config.fields.forEach(function (field) {
            const input = form.elements[field.key];
            values[field.key] = input.value.trim();
            if (!values[field.key]) valid = false;
        });

        if (!valid) return;

        if (config.currency && values.price && values.price.indexOf(config.currency) !== 0) {
            values.price = config.currency + values.price;
        }

        if (currentRow) {
            config.columns.forEach(function (key) {
                const cell = currentRow.querySelector('[data-field="' + key + '"]');
                if (cell) cell.textContent = values[key];
            });
        } else {
            const tbody = document.getElementById(config.tbody);
            if (tbody) tbody.appendChild(buildRow(config, values));
        }

        closeModal();
    }

    function setStatus(row, text, color) {
        const statusCell = row.querySelector('.status-cell');
        if (statusCell) {
            statusCell.innerHTML = '<span class="badge badge-' + color + '">' + text + '</span>';
        }

        row.querySelectorAll('[data-confirm], [data-cancel]').forEach(function (button) {
            button.disabled = true;
        });
    }

    document.addEventListener('click', function (event) {
        const formButton = event.target.closest('[data-open-form]');
        if (formButton) {
            closeDropdown();
            openForm(formButton.dataset.openForm, null);
            return;
        }

        const addButton = event.target.closest('[data-add]');
        if (addButton) {
            openForm(addButton.dataset.add, null);
            return;
        }

        const editButton = event.target.closest('[data-edit]');
        if (editButton) {
            const row = editButton.closest('tr');
            const table = row.closest('table');
            openForm(table.dataset.entity, row);
            return;
        }

        const deleteButton = event.target.closest('[data-delete]');
        if (deleteButton) {
            deleteButton.closest('tr').remove();
            return;
        }

        const confirmButton = event.target.closest('[data-confirm]');
        if (confirmButton) {
            setStatus(confirmButton.closest('tr'), 'Confirmed', 'green');
            return;
        }

        const cancelButton = event.target.closest('[data-cancel]');
        if (cancelButton) {
            setStatus(cancelButton.closest('tr'), 'Cancelled', 'red');
            return;
        }

        if (event.target.closest('[data-close]')) {
            closeModal();
        }
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        saveForm();
    });

    const avatar = document.getElementById('admin-avatar');
    const dropdown = document.getElementById('admin-dropdown');
    const logoutButton = document.getElementById('logout-btn');

    let closeDropdown = function () {};

    if (avatar && dropdown) {
        closeDropdown = function () {
            dropdown.hidden = true;
            avatar.setAttribute('aria-expanded', 'false');
        };

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

    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            try {
                sessionStorage.removeItem('fitspot-admin');
            } catch (error) {}
            window.location.replace('../../index.html');
        });
    }
});
