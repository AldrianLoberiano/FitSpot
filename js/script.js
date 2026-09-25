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

    const carousel = document.getElementById('hero-carousel');

    if (carousel) {
        const slides = carousel.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.hero-dot');
        let currentSlide = 0;
        let autoplayTimer;

        function goToSlide(index) {
            currentSlide = (index + slides.length) % slides.length;

            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === currentSlide);
            });

            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === currentSlide);
            });
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        function startAutoplay() {
            autoplayTimer = setInterval(nextSlide, 4000);
        }

        function resetAutoplay() {
            clearInterval(autoplayTimer);
            startAutoplay();
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                goToSlide(parseInt(dot.dataset.slide, 10));
                resetAutoplay();
            });
        });

        carousel.addEventListener('mouseenter', function () {
            clearInterval(autoplayTimer);
        });

        carousel.addEventListener('mouseleave', startAutoplay);

        startAutoplay();
    }
});
