document.addEventListener('DOMContentLoaded', function () {
    const overlays = document.querySelectorAll('.modal-overlay');

    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal || !modal.classList.contains('modal-overlay')) return;

        overlays.forEach(function (overlay) {
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
        });

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');

        const firstInput = modal.querySelector('input');
        if (firstInput) firstInput.focus();
    }

    function closeModals() {
        overlays.forEach(function (overlay) {
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
        });
    }

    document.querySelectorAll('a[href^="#"][href$="-popup"]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            openModal(link.getAttribute('href').slice(1));
        });
    });

    document.querySelectorAll('.modal-close').forEach(function (button) {
        button.addEventListener('click', closeModals);
    });

    overlays.forEach(function (overlay) {
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) closeModals();
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeModals();
    });

    document.querySelectorAll('.modal form').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
        });
    });
});
