function qs(selector, root) {
  return (root || document).querySelector(selector);
}

function qsa(selector, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(selector));
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function initMobileMenu() {
  var toggle = qs(".mobile-toggle");
  var nav = qs(".mobile-nav");
  if (!toggle || !nav) {
    return;
  }
  toggle.addEventListener("click", function () {
    nav.classList.toggle("open");
  });
}

function initHeroCarousel() {
  var root = qs(".hero-carousel");
  if (!root) {
    return;
  }
  var slides = qsa(".hero-slide", root);
  var dots = qsa(".carousel-dots button", root);
  if (!slides.length) {
    return;
  }
  var current = 0;
  var timer = null;
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("active", i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("active", i === current);
    });
  }
  function start() {
    stop();
    timer = window.setInterval(function () {
      show(current + 1);
    }, 4800);
  }
  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }
  dots.forEach(function (dot, index) {
    dot.addEventListener("click", function () {
      show(index);
      start();
    });
  });
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  show(0);
  start();
}

function initCardFilters() {
  var panel = qs(".filter-panel");
  if (!panel) {
    return;
  }
  var input = qs("[data-filter-text]", panel);
  var region = qs("[data-filter-region]", panel);
  var year = qs("[data-filter-year]", panel);
  var cards = qsa(".movie-card[data-title]");
  var empty = qs(".no-results");
  function apply() {
    var text = normalizeText(input && input.value);
    var selectedRegion = normalizeText(region && region.value);
    var selectedYear = normalizeText(year && year.value);
    var visible = 0;
    cards.forEach(function (card) {
      var haystack = normalizeText([
        card.getAttribute("data-title"),
        card.getAttribute("data-region"),
        card.getAttribute("data-year"),
        card.getAttribute("data-tags")
      ].join(" "));
      var okText = !text || haystack.indexOf(text) !== -1;
      var okRegion = !selectedRegion || normalizeText(card.getAttribute("data-region")).indexOf(selectedRegion) !== -1;
      var okYear = !selectedYear || normalizeText(card.getAttribute("data-year")) === selectedYear;
      var ok = okText && okRegion && okYear;
      card.style.display = ok ? "block" : "none";
      if (ok) {
        visible += 1;
      }
    });
    if (empty) {
      empty.classList.toggle("visible", visible === 0);
    }
  }
  [input, region, year].forEach(function (item) {
    if (item) {
      item.addEventListener("input", apply);
      item.addEventListener("change", apply);
    }
  });
  apply();
}

function setupMoviePlayer(playerId, sourceUrl) {
  var root = document.getElementById(playerId);
  if (!root) {
    return;
  }
  var video = qs("video", root);
  var overlay = qs(".player-overlay", root);
  if (!video || !overlay || !sourceUrl) {
    return;
  }
  var hasStarted = false;
  var hlsInstance = null;
  function showOverlay() {
    overlay.classList.remove("is-hidden");
    hasStarted = false;
  }
  function tryPlay() {
    var promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {
        showOverlay();
      });
    }
  }
  function start() {
    if (hasStarted) {
      tryPlay();
      return;
    }
    hasStarted = true;
    overlay.classList.add("is-hidden");
    video.controls = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
      video.load();
      tryPlay();
      return;
    }
    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.MEDIA_ATTACHED, function () {
        hlsInstance.loadSource(sourceUrl);
      });
      hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
        tryPlay();
      });
      hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          hlsInstance.destroy();
          hlsInstance = null;
          video.src = sourceUrl;
          video.load();
          tryPlay();
        }
      });
      return;
    }
    video.src = sourceUrl;
    video.load();
    tryPlay();
  }
  overlay.addEventListener("click", start);
  video.addEventListener("click", function () {
    if (!hasStarted) {
      start();
    }
  });
}

function renderSearchResults() {
  var mount = qs("[data-search-results]");
  if (!mount || !window.MOVIE_INDEX) {
    return;
  }
  var params = new URLSearchParams(window.location.search);
  var query = normalizeText(params.get("q"));
  var input = qs("[data-search-input]");
  if (input) {
    input.value = params.get("q") || "";
  }
  var results = window.MOVIE_INDEX.filter(function (movie) {
    if (!query) {
      return true;
    }
    return normalizeText([
      movie.title,
      movie.region,
      movie.type,
      movie.year,
      movie.genre,
      movie.tags,
      movie.oneLine
    ].join(" ")).indexOf(query) !== -1;
  }).slice(0, 120);
  if (!results.length) {
    mount.innerHTML = '<div class="no-results visible">没有找到相关影片</div>';
    return;
  }
  mount.innerHTML = results.map(function (movie) {
    return '' +
      '<a class="movie-card" href="' + movie.url + '" data-title="' + escapeHtml(movie.title) + '" data-region="' + escapeHtml(movie.region) + '" data-year="' + escapeHtml(movie.year) + '" data-tags="' + escapeHtml(movie.tags) + '">' +
      '<div class="poster-frame">' +
      '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '">' +
      '<span class="year-pill">' + escapeHtml(movie.year) + '</span>' +
      '<span class="play-hover"><span>▶</span></span>' +
      '</div>' +
      '<div class="card-body">' +
      '<div class="movie-badges"><span class="badge">' + escapeHtml(movie.region) + '</span><span class="badge green">' + escapeHtml(movie.type) + '</span></div>' +
      '<h3 class="card-title">' + escapeHtml(movie.title) + '</h3>' +
      '<p class="card-desc">' + escapeHtml(movie.oneLine) + '</p>' +
      '</div>' +
      '</a>';
  }).join("");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
  initMobileMenu();
  initHeroCarousel();
  initCardFilters();
  renderSearchResults();
});
