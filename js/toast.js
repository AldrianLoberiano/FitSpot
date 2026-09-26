/* FitSpot toast notifications - small, non-blocking messages that auto-dismiss. */
(function () {
    'use strict';

    const MAX_VISIBLE = 3;
    const DEFAULT_DURATION = 4000;
    const LEAVE_MS = 250;

    function ensureHost() {
        let host = document.querySelector('.toast-container');
        if (!host) {
            host = document.createElement('div');
            host.className = 'toast-container';
            host.setAttribute('role', 'status');
            host.setAttribute('aria-live', 'polite');
            document.body.appendChild(host);
        }
        return host;
    }

    function dismiss(toast) {
        if (!toast || toast.dataset.leaving) return;
        toast.dataset.leaving = '1';
        toast.classList.add('is-leaving');
        window.setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, LEAVE_MS);
    }

    function show(type, message, duration) {
        if (!document.body) return null;
        const host = ensureHost();

        const toast = document.createElement('div');
        toast.className = 'toast toast--' + type;
        toast.textContent = message;
        toast.tabIndex = -1;
        host.appendChild(toast);

        while (host.children.length > MAX_VISIBLE) {
            dismiss(host.firstElementChild);
        }

        let timer = window.setTimeout(function () {
            dismiss(toast);
        }, duration || DEFAULT_DURATION);

        toast.addEventListener('mouseenter', function () {
            window.clearTimeout(timer);
        });
        toast.addEventListener('mouseleave', function () {
            timer = window.setTimeout(function () {
                dismiss(toast);
            }, 1500);
        });
        toast.addEventListener('click', function () {
            window.clearTimeout(timer);
            dismiss(toast);
        });

        return toast;
    }

    window.toast = {
        show: show,
        success: function (message) { return show('success', message); },
        error: function (message) { return show('error', message); },
        warning: function (message) { return show('warning', message); }
    };
})();
