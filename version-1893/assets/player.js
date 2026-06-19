(function () {
  function mount(player) {
    if (!player) {
      return;
    }

    var video = player.querySelector('video');
    var layer = player.querySelector('.play-layer');
    var src = player.getAttribute('data-stream');
    var started = false;
    var hlsInstance = null;

    function start() {
      if (!video || !src) {
        return;
      }

      if (!started) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true });
          hlsInstance.loadSource(src);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else {
          video.src = src;
        }

        started = true;
      }

      if (layer) {
        layer.classList.add('is-hidden');
      }

      video.controls = true;
      video.play().catch(function () {
        if (layer) {
          layer.classList.remove('is-hidden');
        }
      });
    }

    if (layer) {
      layer.addEventListener('click', start);
    }

    player.addEventListener('click', function (event) {
      if (event.target === player) {
        start();
      }
    });

    video.addEventListener('play', function () {
      if (layer) {
        layer.classList.add('is-hidden');
      }
    });

    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('.watch-player')).forEach(mount);
  });
})();
