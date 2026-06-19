
(function () {
    function loadHls(callback) {
        if (window.Hls) {
            callback(window.Hls);
            return;
        }

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
        script.onload = function () {
            callback(window.Hls || null);
        };
        script.onerror = function () {
            callback(null);
        };
        document.head.appendChild(script);
    }

    function setupPlayer(panel) {
        var video = panel.querySelector('video');
        var button = panel.querySelector('[data-player-start]');
        var source = panel.getAttribute('data-video-url');
        var started = false;
        var hlsInstance = null;

        if (!video || !button || !source) {
            return;
        }

        function attachAndPlay() {
            if (started) {
                video.play();
                panel.classList.add('is-playing');
                return;
            }

            started = true;

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                video.addEventListener('loadedmetadata', function () {
                    video.play();
                }, { once: true });
                panel.classList.add('is-playing');
                return;
            }

            loadHls(function (Hls) {
                if (Hls && Hls.isSupported()) {
                    hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
                        video.play();
                    });
                    hlsInstance.on(Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal && hlsInstance) {
                            hlsInstance.destroy();
                            hlsInstance = null;
                            video.src = source;
                        }
                    });
                    panel.classList.add('is-playing');
                } else {
                    video.src = source;
                    video.play();
                    panel.classList.add('is-playing');
                }
            });
        }

        button.addEventListener('click', attachAndPlay);
        video.addEventListener('click', function () {
            if (video.paused) {
                attachAndPlay();
            }
        });
        video.addEventListener('play', function () {
            panel.classList.add('is-playing');
        });
        video.addEventListener('pause', function () {
            if (!video.ended) {
                panel.classList.remove('is-playing');
            }
        });
    }

    Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(setupPlayer);
})();
