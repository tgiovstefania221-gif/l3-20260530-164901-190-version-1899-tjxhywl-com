
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navLinks = document.querySelector('[data-nav-links]');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  document.querySelectorAll('[data-live-search]').forEach((input) => {
    const scope = input.closest('[data-search-scope]') || document;
    const cards = Array.from(scope.querySelectorAll('[data-card]'));
    const counter = scope.querySelector('[data-result-count]');
    const update = () => {
      const q = input.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const text = [card.dataset.title, card.dataset.genre, card.dataset.region, card.dataset.tags, card.textContent]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const show = !q || text.includes(q);
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (counter) counter.textContent = String(visible);
    };
    input.addEventListener('input', update);
    update();
  });

  document.querySelectorAll('[data-hero-slider]').forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll('[data-slide]'));
    const dots = Array.from(slider.querySelectorAll('[data-dot]'));
    let index = slides.findIndex((s) => s.classList.contains('active'));
    if (index < 0) index = 0;
    let timer;
    const show = (next) => {
      slides.forEach((s, i) => s.classList.toggle('active', i === next));
      dots.forEach((d, i) => d.classList.toggle('active', i === next));
      index = next;
    };
    const next = () => show((index + 1) % slides.length);
    const start = () => { timer = window.setInterval(next, 5000); };
    const stop = () => { if (timer) window.clearInterval(timer); };
    dots.forEach((dot, i) => dot.addEventListener('click', () => { stop(); show(i); start(); }));
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    start();
  });

  const backTop = document.querySelector('[data-backtop]');
  if (backTop) {
    const toggle = () => backTop.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  document.querySelectorAll('[data-hls-player]').forEach((wrap) => {
    const video = wrap.querySelector('video');
    const btn = wrap.querySelector('[data-play]');
    const src = wrap.dataset.hls || '';
    const fallback = wrap.dataset.fallback || '';
    if (!video) return;
    let current = 'none';

    const loadFallback = () => {
      if (current === 'fallback') return;
      current = 'fallback';
      video.removeAttribute('src');
      video.src = fallback || src;
      video.load();
    };

    const loadHls = () => {
      if (current === 'hls') return;
      current = 'hls';
      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data && data.fatal) loadFallback();
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        loadFallback();
      }
    };

    loadHls();
    if (btn) {
      btn.addEventListener('click', async () => {
        try {
          await video.play();
        } catch (err) {
          loadFallback();
          try { await video.play(); } catch (e) {}
        }
      });
    }
    video.addEventListener('play', () => btn && btn.classList.add('hidden'));
    video.addEventListener('pause', () => btn && btn.classList.remove('hidden'));
    video.addEventListener('error', () => loadFallback());
  });
});
