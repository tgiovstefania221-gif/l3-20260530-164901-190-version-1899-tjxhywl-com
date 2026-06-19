(function () {
    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setupMobileMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        function restart() {
            if (timer) {
                clearInterval(timer);
            }
            timer = setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                restart();
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                restart();
            });
        });

        show(0);
        restart();
    }

    function setupFilters() {
        var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));
        scopes.forEach(function (scope) {
            var search = scope.querySelector("[data-search]");
            var year = scope.querySelector("[data-year-filter]");
            var region = scope.querySelector("[data-region-filter]");
            var genre = scope.querySelector("[data-genre-filter]");
            var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));
            var empty = scope.querySelector("[data-empty]");

            function normalize(value) {
                return String(value || "").trim().toLowerCase();
            }

            function matches(card) {
                var query = normalize(search && search.value);
                var selectedYear = normalize(year && year.value);
                var selectedRegion = normalize(region && region.value);
                var selectedGenre = normalize(genre && genre.value);
                var text = normalize([
                    card.getAttribute("data-title"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-genre"),
                    card.getAttribute("data-tags")
                ].join(" "));
                var cardYear = normalize(card.getAttribute("data-year"));
                var cardRegion = normalize(card.getAttribute("data-region"));
                var cardGenre = normalize(card.getAttribute("data-genre"));
                return (!query || text.indexOf(query) !== -1) &&
                    (!selectedYear || cardYear === selectedYear) &&
                    (!selectedRegion || cardRegion === selectedRegion) &&
                    (!selectedGenre || cardGenre.indexOf(selectedGenre) !== -1);
            }

            function apply() {
                var visible = 0;
                cards.forEach(function (card) {
                    var ok = matches(card);
                    card.hidden = !ok;
                    if (ok) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.hidden = visible !== 0;
                }
            }

            [search, year, region, genre].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });
        });
    }

    window.initMoviePlayer = function (videoUrl) {
        var root = document.querySelector("[data-player]");
        if (!root) {
            return;
        }
        var video = root.querySelector("video");
        var overlay = root.querySelector(".player-overlay");
        var message = root.querySelector("[data-player-message]");
        var hls = null;
        var attached = false;

        function showMessage(text) {
            if (!message) {
                return;
            }
            message.textContent = text;
            message.hidden = !text;
        }

        function beginPlayback() {
            if (!video) {
                return;
            }
            video.controls = true;
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {
                    if (video.readyState > 0) {
                        if (overlay) {
                            overlay.classList.remove("is-hidden");
                        }
                    }
                });
            }
        }

        function attach() {
            if (!video || attached) {
                return;
            }
            attached = true;
            showMessage("");
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = videoUrl;
                video.load();
                beginPlayback();
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({ enableWorker: true });
                hls.loadSource(videoUrl);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    beginPlayback();
                });
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (!data || !data.fatal) {
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                        return;
                    }
                    showMessage("暂时无法播放，请稍后再试");
                });
                beginPlayback();
                return;
            }
            showMessage("暂时无法播放，请稍后再试");
        }

        function start() {
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
            if (!attached) {
                attach();
            } else {
                beginPlayback();
            }
        }

        if (overlay) {
            overlay.addEventListener("click", start);
        }

        if (video) {
            video.addEventListener("click", function () {
                if (video.paused) {
                    start();
                }
            });
            video.addEventListener("play", function () {
                if (overlay) {
                    overlay.classList.add("is-hidden");
                }
            });
        }

        window.addEventListener("pagehide", function () {
            if (hls) {
                hls.destroy();
            }
        });
    };

    onReady(function () {
        setupMobileMenu();
        setupHero();
        setupFilters();
    });
})();
