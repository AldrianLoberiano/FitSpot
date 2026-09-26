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

    /* Turns low-level errors into consistent, user-friendly messages.
       - sessionExpired  -> "Your session has expired..."
       - safe 4xx        -> show the curated backend message (e.g. "That class is already full.")
       - anything else   -> the contextual fallback supplied by the caller
       - network errors   -> fallback + optional developer hint appended */
    window.friendlyMessage = function (error, fallback, hint) {
        let text;
        if (error && error.sessionExpired) {
            text = 'Your session has expired. Please log in again.';
        } else if (error && error.status >= 400 && error.status < 500 && error.apiMessage) {
            text = error.apiMessage;
        } else {
            text = fallback;
        }
        if (error && error.kind === 'network' && hint) {
            text += hint;
        }
        return text;
    };

    /* Designed confirmation popup (replaces native confirm()). Resolves true/false. */
    window.confirmDialog = function (title, message, confirmLabel) {
        return new Promise(function (resolve) {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay is-open';
            overlay.id = 'confirm-modal';
            overlay.setAttribute('aria-hidden', 'false');
            overlay.innerHTML =
                '<div class="modal auth-card" role="alertdialog" aria-modal="true"' +
                ' aria-labelledby="confirm-title" aria-describedby="confirm-text">' +
                    '<div class="modal-body">' +
                        '<h2 id="confirm-title"></h2>' +
                        '<p class="confirm-text" id="confirm-text"></p>' +
                        '<div class="form-actions">' +
                            '<button type="button" class="btn-cancel" data-confirm-no>Cancel</button>' +
                            '<button type="button" class="btn-delete" data-confirm-yes></button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            overlay.querySelector('#confirm-title').textContent = title;
            overlay.querySelector('#confirm-text').textContent = message;
            overlay.querySelector('[data-confirm-yes]').textContent = confirmLabel;
            document.body.appendChild(overlay);

            function finish(result) {
                document.removeEventListener('keydown', onKeydown, true);
                overlay.remove();
                resolve(result);
            }

            function onKeydown(event) {
                if (event.key === 'Escape') finish(false);
            }

            overlay.addEventListener('click', function (event) {
                if (event.target === overlay || event.target.closest('[data-confirm-no]')) {
                    finish(false);
                } else if (event.target.closest('[data-confirm-yes]')) {
                    finish(true);
                }
            });
            document.addEventListener('keydown', onKeydown, true);
            overlay.querySelector('[data-confirm-no]').focus();
        });
    };

    window.toast = {
        show: show,
        success: function (message) { return show('success', message); },
        error: function (message) { return show('error', message); },
        warning: function (message) { return show('warning', message); }
    };
})();
