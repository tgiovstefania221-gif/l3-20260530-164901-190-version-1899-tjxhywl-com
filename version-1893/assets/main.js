(function () {
  var navButton = document.querySelector('[data-nav-toggle]');
  var navLinks = document.querySelector('[data-nav-links]');

  if (navButton && navLinks) {
    navButton.addEventListener('click', function () {
      navLinks.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;

    function show(index) {
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

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
      });
    });

    setInterval(function () {
      show(current + 1);
    }, 5200);
  }

  var searchInput = document.querySelector('[data-search-input]');
  var regionSelect = document.querySelector('[data-filter-region]');
  var yearSelect = document.querySelector('[data-filter-year]');
  var typeSelect = document.querySelector('[data-filter-type]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-card]'));

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function cardText(card) {
    return normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-region'),
      card.getAttribute('data-type'),
      card.getAttribute('data-year'),
      card.getAttribute('data-genre'),
      card.getAttribute('data-tags'),
      card.textContent
    ].join(' '));
  }

  function filterCards() {
    if (!cards.length) {
      return;
    }

    var query = normalize(searchInput && searchInput.value);
    var region = normalize(regionSelect && regionSelect.value);
    var year = normalize(yearSelect && yearSelect.value);
    var type = normalize(typeSelect && typeSelect.value);

    cards.forEach(function (card) {
      var text = cardText(card);
      var matchesQuery = !query || text.indexOf(query) !== -1;
      var matchesRegion = !region || normalize(card.getAttribute('data-region')).indexOf(region) !== -1;
      var matchesYear = !year || normalize(card.getAttribute('data-year')).indexOf(year) !== -1;
      var matchesType = !type || normalize(card.getAttribute('data-type')).indexOf(type) !== -1;
      card.hidden = !(matchesQuery && matchesRegion && matchesYear && matchesType);
    });
  }

  var params = new URLSearchParams(window.location.search);

  if (searchInput && params.get('q')) {
    searchInput.value = params.get('q');
  }

  if (yearSelect && params.get('year')) {
    yearSelect.value = params.get('year');
  }

  [searchInput, regionSelect, yearSelect, typeSelect].forEach(function (control) {
    if (control) {
      control.addEventListener('input', filterCards);
      control.addEventListener('change', filterCards);
    }
  });

  filterCards();
})();
