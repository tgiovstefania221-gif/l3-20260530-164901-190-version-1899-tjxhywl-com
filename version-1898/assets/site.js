
(function () {
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function initMenu() {
    const btn = q('[data-menu-toggle]');
    const nav = q('[data-mobile-nav]');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      nav.classList.toggle('is-open');
      nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
    });
  }

  function initHeroSlider() {
    const slider = q('[data-hero-slider]');
    if (!slider) return;
    const slides = qa('[data-slide]', slider);
    const prev = q('[data-prev]', slider);
    const next = q('[data-next]', slider);
    const dotsWrap = q('[data-dots]', slider);
    if (!slides.length) return;

    let index = 0;
    let timer = null;

    function setActive(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, idx) => slide.classList.toggle('active', idx === index));
      if (dotsWrap) {
        qa('button', dotsWrap).forEach((dot, idx) => dot.classList.toggle('active', idx === index));
      }
    }

    if (dotsWrap && dotsWrap.children.length === 0) {
      slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.addEventListener('click', () => setActive(idx));
        dotsWrap.appendChild(dot);
      });
    }

    if (prev) prev.addEventListener('click', () => setActive(index - 1));
    if (next) next.addEventListener('click', () => setActive(index + 1));
    slider.addEventListener('mouseenter', () => { if (timer) clearInterval(timer); });
    slider.addEventListener('mouseleave', start);

    function start() {
      if (timer) clearInterval(timer);
      timer = setInterval(() => setActive(index + 1), 5500);
    }

    setActive(0);
    start();
  }

  function initCategoryFilters() {
    const input = q('[data-category-filter]');
    if (!input) return;
    const cards = qa('[data-filter-item]');
    const empty = q('[data-empty-state]');
    const update = () => {
      const term = input.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach(card => {
        const hay = (card.dataset.search || '').toLowerCase();
        const visible = !term || hay.includes(term);
        card.style.display = visible ? '' : 'none';
        if (visible) shown += 1;
      });
      if (empty) empty.style.display = shown ? 'none' : 'block';
    };
    input.addEventListener('input', update);
    update();
  }

  function initSearchPage() {
    const input = q('[data-search-input]');
    const region = q('[data-search-region]');
    const type = q('[data-search-type]');
    const container = q('[data-search-results]');
    const count = q('[data-search-count]');
    if (!input || !container || !window.MOVIES) return;

    const params = new URLSearchParams(location.search);
    if (params.get('q')) input.value = params.get('q');

    function score(movie, term) {
      const hay = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.one_line].join(' ').toLowerCase();
      if (!term) return 1;
      return hay.includes(term) ? 1 : 0;
    }

    function render(list, term) {
      container.innerHTML = '';
      if (!list.length) {
        container.innerHTML = '<div class="empty-state">没有找到匹配内容，请尝试别的关键词。</div>';
        if (count) count.textContent = '0 条结果';
        return;
      }
      const frag = document.createDocumentFragment();
      list.slice(0, 200).forEach((movie, idx) => {
        const a = document.createElement('a');
        a.className = 'movie-card';
        a.href = movie.href;
        a.style.setProperty('--hue', movie.hue);
        a.style.setProperty('--accent', movie.accent);
        a.innerHTML = `
          <div class="movie-card-link">
            <div class="movie-poster">
              <div class="poster-badge">${movie.year}</div>
              <div class="poster-shine"></div>
              <div class="poster-text"><span>${movie.region}</span><strong>${movie.type}</strong></div>
            </div>
            <div class="movie-body">
              <div class="movie-meta">${movie.genre}</div>
              <h3>${movie.title}</h3>
              <p>${movie.one_line}</p>
              <div class="movie-tags">${movie.tags.slice(0, 3).map(t => `<span>${t}</span>`).join('')}</div>
            </div>
          </div>`;
        frag.appendChild(a);
      });
      container.appendChild(frag);
      if (count) count.textContent = `${list.length} 条结果`;
    }

    function update() {
      const term = input.value.trim().toLowerCase();
      const r = region && region.value ? region.value : '';
      const t = type && type.value ? type.value : '';
      const filtered = window.MOVIES.filter(movie => {
        const matchTerm = score(movie, term);
        const matchRegion = !r || movie.region === r;
        const matchType = !t || movie.type === t;
        return matchTerm && matchRegion && matchType;
      });
      render(filtered, term);
    }

    input.addEventListener('input', update);
    if (region) region.addEventListener('change', update);
    if (type) type.addEventListener('change', update);
    update();
  }

  function initMoviePlayer() {
    const player = q('[data-player]');
    if (!player) return;
    const video = q('video', player);
    const overlay = q('[data-play-overlay]', player);
    const sourceButtons = qa('[data-source-btn]');
    const mp4 = player.dataset.src;
    const hlsSrc = player.dataset.hls;
    let hls = null;

    function activateButton(name) {
      sourceButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.sourceBtn === name));
    }

    function loadMp4() {
      if (hls) { try { hls.destroy(); } catch (e) {} hls = null; }
      if (video.src !== mp4) video.src = mp4;
      video.load();
      activateButton('mp4');
    }

    function loadHls() {
      if (!hlsSrc) return loadMp4();
      if (window.Hls && window.Hls.isSupported()) {
        if (hls) { try { hls.destroy(); } catch (e) {} }
        hls = new window.Hls();
        hls.loadSource(hlsSrc);
        hls.attachMedia(video);
        activateButton('hls');
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsSrc;
        activateButton('hls');
      } else {
        loadMp4();
        alert('当前浏览器未直接支持 HLS 播放，已切回 MP4。');
      }
    }

    sourceButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.sourceBtn === 'hls') loadHls();
        else loadMp4();
      });
    });

    video.addEventListener('play', () => player.classList.add('playing'));
    video.addEventListener('pause', () => player.classList.remove('playing'));
    video.addEventListener('ended', () => player.classList.remove('playing'));
    overlay.addEventListener('click', () => video.play());
    player.addEventListener('click', (e) => {
      if (e.target === player) video.play();
    });

    loadMp4();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initHeroSlider();
    initCategoryFilters();
    initSearchPage();
    initMoviePlayer();
  });
})();
