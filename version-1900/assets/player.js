(function () {
  function initVideo(video, shell) {
    var url = video.getAttribute('data-video');

    if (!url) {
      return;
    }

    if (video.getAttribute('data-ready') === '1') {
      video.play().catch(function () {});
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', function () {
        video.play().catch(function () {});
      }, { once: true });
    } else if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      video._hlsInstance = hls;
      video.addEventListener('canplay', function () {
        video.play().catch(function () {});
      }, { once: true });
    } else {
      video.src = url;
      video.play().catch(function () {});
    }

    video.setAttribute('data-ready', '1');

    if (shell) {
      shell.classList.add('is-playing');
    }
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(function (shell) {
    var video = shell.querySelector('video[data-video]');
    var button = shell.querySelector('[data-play-button]');

    if (!video) {
      return;
    }

    if (button) {
      button.addEventListener('click', function () {
        initVideo(video, shell);
      });
    }

    video.addEventListener('play', function () {
      shell.classList.add('is-playing');
    });

    video.addEventListener('pause', function () {
      if (video.currentTime === 0 || video.ended) {
        shell.classList.remove('is-playing');
      }
    });

    video.addEventListener('click', function () {
      if (video.getAttribute('data-ready') !== '1') {
        initVideo(video, shell);
      }
    });
  });
})();
