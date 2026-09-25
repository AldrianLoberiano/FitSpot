document.addEventListener('DOMContentLoaded', function () {
    const menuButtons = document.querySelectorAll('.sidebar-menu button[data-view]');
    const views = document.querySelectorAll('.admin-view');
    const pageTitle = document.getElementById('admin-page-title');

    menuButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            const view = button.dataset.view;

            menuButtons.forEach(function (item) {
                item.classList.toggle('is-active', item === button);
            });

            views.forEach(function (section) {
                section.classList.toggle('is-active', section.id === 'view-' + view);
            });

            if (pageTitle) pageTitle.textContent = button.textContent.trim();
        });
    });

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
        modalTitle.textContent = (row ? 'Edit ' : 'Add ') + config.label;
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
});
