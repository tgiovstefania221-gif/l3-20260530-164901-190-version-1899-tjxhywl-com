
(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-main-nav]');

    if (menuButton && nav) {
        menuButton.addEventListener('click', function () {
            nav.classList.toggle('open');
        });
    }

    var hero = document.querySelector('[data-hero]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var current = 0;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
            });
        });

        window.setInterval(function () {
            showSlide(current + 1);
        }, 5200);
    }

    var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));

    scopes.forEach(function (scope) {
        var input = scope.querySelector('[data-filter-input]');
        var list = document.querySelector('[data-card-list]');
        var cards = list ? Array.prototype.slice.call(list.querySelectorAll('.movie-card')) : [];
        var buttons = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-value]'));
        var sortButton = scope.querySelector('[data-sort-year]');
        var activeValue = '';

        function applyFilter() {
            var keyword = input ? input.value.trim().toLowerCase() : '';

            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute('data-title'),
                    card.getAttribute('data-tags'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-region')
                ].join(' ').toLowerCase();

                var typeValue = (card.getAttribute('data-type') || '').toLowerCase();
                var keywordMatched = !keyword || haystack.indexOf(keyword) !== -1;
                var typeMatched = !activeValue || typeValue.indexOf(activeValue.toLowerCase()) !== -1;

                card.classList.toggle('is-hidden', !(keywordMatched && typeMatched));
            });
        }

        if (input) {
            input.addEventListener('input', applyFilter);
        }

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                activeValue = button.getAttribute('data-filter-value') || '';
                buttons.forEach(function (item) {
                    item.classList.toggle('active', item === button);
                });
                applyFilter();
            });
        });

        if (sortButton && list) {
            sortButton.addEventListener('click', function () {
                cards.sort(function (a, b) {
                    var ay = parseInt(a.getAttribute('data-year') || '0', 10) || 0;
                    var by = parseInt(b.getAttribute('data-year') || '0', 10) || 0;
                    return by - ay;
                });

                cards.forEach(function (card) {
                    list.appendChild(card);
                });
            });
        }
    });
})();
