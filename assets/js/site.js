(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var toggle = qs('.menu-toggle');
    var nav = qs('.mobile-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function setupHero() {
    var hero = qs('[data-hero]');
    if (!hero) return;
    var slides = qsa('.hero-slide', hero);
    var dots = qsa('.hero-dot', hero);
    var prev = qs('.hero-prev', hero);
    var next = qs('.hero-next', hero);
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupForms() {
    qsa('.global-search').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = qs('input[name="q"]', form);
        if (!input || !input.value.trim()) {
          event.preventDefault();
          window.location.href = './search.html';
        }
      });
    });
  }

  function setupLocalFilters() {
    var input = qs('.local-search');
    var year = qs('.year-filter');
    var genre = qs('.genre-filter');
    var cards = qsa('.movie-card');
    if (!cards.length || (!input && !year && !genre)) return;

    function normalize(value) {
      return String(value || '').toLowerCase().trim();
    }

    function apply() {
      var keyword = normalize(input ? input.value : '');
      var selectedYear = normalize(year ? year.value : '');
      var selectedGenre = normalize(genre ? genre.value : '');
      cards.forEach(function (card) {
        var text = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-genre'),
          card.textContent
        ].join(' '));
        var cardYear = normalize(card.getAttribute('data-year'));
        var cardGenre = normalize(card.getAttribute('data-genre'));
        var okKeyword = !keyword || text.indexOf(keyword) !== -1;
        var okYear = !selectedYear || cardYear === selectedYear;
        var okGenre = !selectedGenre || cardGenre.indexOf(selectedGenre) !== -1 || text.indexOf(selectedGenre) !== -1;
        card.hidden = !(okKeyword && okYear && okGenre);
      });
    }

    [input, year, genre].forEach(function (el) {
      if (el) el.addEventListener('input', apply);
      if (el) el.addEventListener('change', apply);
    });
    apply();
  }

  function movieCard(item) {
    var tags = (item.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return [
      '<article class="movie-card">',
      '<a class="movie-cover" href="' + escapeHtml(item.url) + '" aria-label="' + escapeHtml(item.title) + '">',
      '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
      '<span class="movie-score">' + escapeHtml(item.score) + '</span>',
      '</a>',
      '<div class="movie-card-body">',
      '<div class="movie-meta-line"><span>' + escapeHtml(item.year) + '</span><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>',
      '<h3><a href="' + escapeHtml(item.url) + '">' + escapeHtml(item.title) + '</a></h3>',
      '<p>' + escapeHtml(item.desc) + '</p>',
      '<div class="tag-row">' + tags + '</div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setupSearchPage() {
    var grid = qs('.search-results');
    var status = qs('.search-status');
    var input = qs('.search-page-input');
    if (!grid || !status || !input || !window.movieIndex) return;
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    input.value = query;

    function run(value) {
      var keyword = String(value || '').toLowerCase().trim();
      var pool = window.movieIndex || [];
      var results = keyword
        ? pool.filter(function (item) {
            return [item.title, item.year, item.region, item.type, item.genre, (item.tags || []).join(' '), item.desc]
              .join(' ')
              .toLowerCase()
              .indexOf(keyword) !== -1;
          })
        : pool.slice(0, 40);
      grid.innerHTML = results.slice(0, 120).map(movieCard).join('');
      status.textContent = keyword ? '搜索结果：' + results.length + ' 部相关内容' : '热门推荐';
    }

    input.addEventListener('input', function () {
      run(input.value);
    });
    run(query);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupForms();
    setupLocalFilters();
    setupSearchPage();
  });
})();
