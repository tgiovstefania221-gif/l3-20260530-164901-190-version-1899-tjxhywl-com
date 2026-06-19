(function () {
  window.initMoviePlayer = function (streamUrl, videoId, overlayId) {
    var video = document.getElementById(videoId || 'moviePlayer');
    var overlay = document.getElementById(overlayId || 'playerOverlay');
    var attached = false;
    var hls = null;

    function attach() {
      if (!video || attached) return;
      attached = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function start() {
      if (!video) return;
      attach();
      if (overlay) overlay.hidden = true;
      var playTask = video.play();
      if (playTask && typeof playTask.catch === 'function') {
        playTask.catch(function () {
          video.setAttribute('controls', 'controls');
        });
      }
    }

    if (overlay) {
      overlay.addEventListener('click', start);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          start();
        }
      });
      video.addEventListener('play', function () {
        if (overlay) overlay.hidden = true;
      });
      window.addEventListener('beforeunload', function () {
        if (hls && typeof hls.destroy === 'function') {
          hls.destroy();
        }
      });
    }
  };
})();
