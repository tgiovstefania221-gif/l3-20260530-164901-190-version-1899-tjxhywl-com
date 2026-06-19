
(function () {
  const doc = document;
  const navToggle = doc.querySelector('[data-nav-toggle]');
  const navPanel = doc.querySelector('[data-nav-panel]');
  const navSearch = doc.querySelector('.nav-search');
  navToggle?.addEventListener('click', () => {
    navPanel?.classList.toggle('is-open');
    navSearch?.classList.toggle('is-open');
  });

  const backTop = doc.querySelector('[data-back-top]');
  const updateBack = () => {
    if (!backTop) return;
    backTop.classList.toggle('is-visible', window.scrollY > 480);
  };
  window.addEventListener('scroll', updateBack, { passive: true });
  updateBack();
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const carousel = doc.querySelector('[data-hero-carousel]');
  const prev = doc.querySelector('[data-carousel-prev]');
  const next = doc.querySelector('[data-carousel-next]');
  if (carousel && prev && next) {
    const move = (dir) => carousel.scrollBy({ left: dir * Math.max(280, carousel.clientWidth * 0.8), behavior: 'smooth' });
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
  }

  doc.querySelectorAll('[data-filter-input]').forEach((input) => {
    const container = input.closest('section, .library-wrap, .category-overview, .ranking-layout, .search-results')?.querySelector('[data-filter-container]');
    if (!container) return;
    const apply = () => {
      const q = input.value.trim().toLowerCase();
      let visible = 0;
      container.querySelectorAll('[data-search-item]').forEach((card) => {
        const text = (card.dataset.keywords || card.textContent || '').toLowerCase();
        const ok = !q || text.includes(q);
        card.style.display = ok ? '' : 'none';
        if (ok) visible += 1;
      });
      const title = container.closest('section, main')?.querySelector('#search-result-title');
      if (title) title.textContent = q ? `找到 ${visible} 条结果` : '请输入关键词';
      const oldEmpty = container.querySelector('.no-results');
      if (visible === 0 && q) {
        if (!oldEmpty) {
          const empty = document.createElement('div');
          empty.className = 'no-results';
          empty.textContent = '没有找到匹配结果';
          container.appendChild(empty);
        }
      } else {
        oldEmpty?.remove();
      }
    };
    input.addEventListener('input', apply);
    apply();
  });

  const searchCatalogEl = doc.getElementById('movie-catalog-data');
  const resultsEl = doc.getElementById('search-results');
  if (searchCatalogEl && resultsEl) {
    let catalog = [];
    try { catalog = JSON.parse(searchCatalogEl.textContent || '[]'); } catch (e) {}
    const params = new URLSearchParams(location.search);
    const q = (params.get('q') || '').trim();
    const input = doc.querySelector('.search-page-form input[type="search"]');
    if (input) input.value = q;
    const keywords = q.toLowerCase();
    const filtered = !keywords ? catalog.slice(0, 48) : catalog.filter((m) => {
      const text = [m.title, m.year, m.region, m.genre, m.tags, m.summary, m.one_line].join(' ').toLowerCase();
      return text.includes(keywords);
    }).slice(0, 80);
    const title = doc.getElementById('search-result-title');
    if (title) title.textContent = q ? `找到 ${filtered.length} 部影片` : '推荐浏览';
    resultsEl.innerHTML = filtered.map((m) => {
      const hash = Array.from((m.title + m.genre)).reduce((a, c) => a + c.charCodeAt(0), 0);
      const palette = [
        ['#ff835c', '#102a43'], ['#f59e0b', '#1d4ed8'], ['#8b5cf6', '#0f172a'], ['#06b6d4', '#1e293b'],
        ['#ef4444', '#111827'], ['#22c55e', '#0f172a'], ['#ec4899', '#312e81'], ['#14b8a6', '#0f172a']
      ][hash % 8];
      return `
<a class="movie-card compact" href="movie/${m.filename}" data-search-item data-keywords="${[m.title,m.region,m.genre,m.tags,m.summary,m.one_line].join(' ').replace(/"/g,'&quot;')}">
  <div class="movie-cover" style="--accent-a:${palette[0]};--accent-b:${palette[1]}">
    <div class="cover-badge">${m.year || ''}</div>
    <div class="cover-face">HD</div>
    <div class="cover-title">${m.title}</div>
    <div class="cover-meta">${m.genre || ''}</div>
  </div>
  <div class="movie-body">
    <div class="movie-topline"><span>${m.title}</span><em>${m.year || ''}</em></div>
    <p>${(m.one_line || m.summary || '').slice(0, 72)}</p>
    <div class="movie-tags"><span>${m.region || ''}</span><span>${(m.genre || '').split('/')[0] || ''}</span></div>
  </div>
</a>`;
    }).join('');
  }

  const player = doc.querySelector('[data-player-video]');
  const overlay = doc.querySelector('[data-player-overlay]');
  const playBtn = doc.querySelector('[data-player-play]');
  const lineButtons = [...doc.querySelectorAll('[data-player-line]')];
  if (player && (playBtn || overlay || lineButtons.length)) {
    let hls = null;
    let currentSrc = player.dataset.source;

    const destroyHls = () => {
      if (hls) {
        try { hls.destroy(); } catch (e) {}
        hls = null;
      }
    };

    const bindSource = (src) => {
      if (!src) return;
      currentSrc = src;
      destroyHls();
      player.removeAttribute('src');
      player.load();
      if (window.Hls && Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90 });
        hls.loadSource(src);
        hls.attachMedia(player);
        hls.on(Hls.Events.ERROR, (_, data) => { console.warn('HLS error', data); });
      } else {
        player.src = src;
      }
      lineButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.src === src));
    };

    const startPlay = async () => {
      try {
        overlay?.classList.add('is-hidden');
        if (!player.getAttribute('src') && !hls) bindSource(currentSrc);
        await player.play();
      } catch (e) {
        console.warn('play failed', e);
      }
    };

    playBtn?.addEventListener('click', startPlay);
    overlay?.addEventListener('click', startPlay);
    lineButtons.forEach((btn) => btn.addEventListener('click', () => {
      bindSource(btn.dataset.src);
      startPlay();
    }));
    bindSource(currentSrc);
  }
})();
