(function () {
  "use strict";

  var projects = window.PROJECTS || [];
  var contact = window.CONTACT || {};
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ================= Intro loader ================= */
  var loader = $("#loader");
  function ready() {
    document.body.classList.add("is-ready");
    if (!loader) return;
    loader.classList.add("is-done");
    setTimeout(function () { loader.classList.add("is-gone"); }, 800);
  }
  var seen = false;
  try { seen = sessionStorage.getItem("atg-intro") === "1"; sessionStorage.setItem("atg-intro", "1"); } catch (e) {}
  if (reduceMotion || seen || location.hash.indexOf("#work/") === 0) {
    if (loader) loader.classList.add("is-gone");
    requestAnimationFrame(function () { document.body.classList.add("is-ready"); });
  } else {
    var t = setTimeout(ready, 1900);
    loader.addEventListener("click", function () { clearTimeout(t); ready(); });
  }

  /* ================= Hero timeline ================= */
  var hero = $("#hero");
  var playhead = $("#playhead");
  var tc = $("#tc");
  var playBtn = $("#tlPlay");
  if (reduceMotion && hero) hero.classList.add("is-paused");
  playBtn && playBtn.addEventListener("click", function () {
    var paused = hero.classList.toggle("is-paused");
    playBtn.setAttribute("aria-pressed", paused ? "true" : "false");
    playBtn.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
  });
  // Timecode reads the playhead's own animation clock, so it stays in sync (and stops when paused)
  (function tick() {
    if (playhead && tc && playhead.getAnimations) {
      var a = playhead.getAnimations()[0];
      var ms = a && a.currentTime != null ? a.currentTime % 4000 : 0;
      tc.textContent = "0:00:" + pad(Math.floor(ms / 1000)) + ":" + pad(Math.floor((ms % 1000) / 1000 * 24));
    }
    requestAnimationFrame(tick);
  })();

  /* ================= Eyes follow the cursor ================= */
  var eyes = $$("[data-eyes]");
  var pending = false, px = 0, py = 0;
  if (!reduceMotion) {
    window.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        eyes.forEach(function (g) {
          var r = g.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          var dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
          var d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 200) * 3.2;
          $(".pupils", g).style.transform = "translate(" + (dx / d * k).toFixed(2) + "px," + (dy / d * k).toFixed(2) + "px)";
        });
      });
    }, { passive: true });
  }

  /* ================= Characters & thumbnails ================= */
  var RIBBON =
    '<svg class="thumb__char" viewBox="0 0 100 124" aria-hidden="true">' +
      '<path d="M50 8c-17 0-27 13-27 29 0 21 16 39 27 51 11-12 27-30 27-51 0-16-10-29-27-29Z" fill="none" stroke="#fff" stroke-width="13" stroke-linejoin="round"/>' +
      '<path d="M37 72 18 114l15-4 8 12 19-36M63 72l19 42-15-4-8 12-19-36" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="43" cy="36" r="3.6" fill="#0E1222"/><circle cx="57" cy="36" r="3.6" fill="#0E1222"/>' +
      '<path d="M45 44q5 5 10 0" fill="none" stroke="#0E1222" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="38" cy="42" r="2.6" fill="#FF4F96"/><circle cx="62" cy="42" r="2.6" fill="#FF4F96"/>' +
    "</svg>";
  var PLAY = '<span class="thumb__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg></span>';

  function hasVideo(item) {
    return !!(item.video || (item.episodes && item.episodes.some(function (e) { return e.video; })));
  }
  function thumbHTML(item, parent, bigText) {
    var src = item.thumbnail || "";
    var accent = item.accent || (parent && parent.accent) || "";
    var inner = src
      ? '<img src="' + esc(src) + '" alt="" loading="lazy">'
      : (accent === "pink" ? RIBBON : "") + (bigText ? '<span class="thumb__big">' + bigText + "</span>" : "");
    return '<span class="thumb' + (accent && !src ? " thumb--" + esc(accent) : "") + '">' +
      inner + PLAY + (hasVideo(item) ? "" : '<span class="thumb__soon">VIDEO SOON</span>') + "</span>";
  }

  /* ================= Work ================= */
  var featured = projects.filter(function (p) { return p.featured; })[0];

  if (featured) {
    var short = featured.title.split(":")[0];
    $("#featured").innerHTML =
      '<article class="feature-player reveal">' +
        '<button class="fp__media" type="button" data-open="' + esc(featured.slug) + '" aria-label="Play ' + esc(featured.title) + '">' +
          thumbHTML(featured, null, esc(short).replace(" ", "<br>")) +
          '<span class="fp__controls" aria-hidden="true"><span>▶</span><span class="fp__bar"><i></i></span><span>' +
          (featured.episodes ? featured.episodes.length + " EPISODES" : "PLAY") + "</span></span>" +
        "</button>" +
        '<div class="fp__body">' +
          '<span class="tag">' + esc(featured.category) + "</span>" +
          "<h3>" + esc(featured.title) + "</h3>" +
          '<p class="fp__client">CLIENT · ' + esc(featured.client).toUpperCase() + "</p>" +
          "<p>" + esc(featured.summary) + "</p>" +
          '<button class="btn" type="button" data-open="' + esc(featured.slug) + '">Watch the series <span class="tri" aria-hidden="true"></span></button>' +
        "</div>" +
      "</article>";

    if (featured.episodes && featured.episodes.length) {
      $("#filmWrap").innerHTML =
        '<div class="film reveal">' +
          '<div class="film__head"><span>' + esc(short).toUpperCase() + " · " + featured.episodes.length + " EPISODES</span>" +
          '<span class="film__nav"><button type="button" data-film="-1" aria-label="Previous episodes">←</button><button type="button" data-film="1" aria-label="Next episodes">→</button></span></div>' +
          '<div class="film__strip"><div class="film__scroll" id="filmScroll">' +
          featured.episodes.map(function (ep, i) {
            return '<button class="frame" type="button" data-open="' + esc(featured.slug) + '" data-ep="' + i + '">' +
              '<span class="frame__media">' + thumbHTML(ep, featured, "EP " + pad(i + 1)) + "</span>" +
              '<span class="frame__label"><b>' + esc(ep.title) + "</b><span>" + pad(i + 1) + "/" + pad(featured.episodes.length) + "</span></span>" +
            "</button>";
          }).join("") +
          "</div></div>" +
        "</div>";
      $$("[data-film]").forEach(function (b) {
        b.addEventListener("click", function () {
          var s = $("#filmScroll");
          s.scrollBy({ left: +b.getAttribute("data-film") * s.clientWidth * .8, behavior: reduceMotion ? "auto" : "smooth" });
        });
      });
    }
  }

  $("#grid").innerHTML = projects.filter(function (p) { return p !== featured; }).map(function (p) {
    return '<button class="card reveal" type="button" data-open="' + esc(p.slug) + '">' +
      '<span class="card__media">' + thumbHTML(p) + "</span>" +
      "<h3>" + esc(p.title) + "</h3><p>" + esc([p.category, p.client].filter(Boolean).join(" · ")) + "</p></button>";
  }).join("");

  /* ================= Modal / player ================= */
  var modal = $("#modal");
  var body = $("#modalBody");

  function embedUrl(url) {
    if (!url) return "";
    var m;
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/))) {
      return "https://player.vimeo.com/video/" + m[1] + (m[2] ? "?h=" + m[2] + "&" : "?") + "title=0&byline=0&portrait=0&autoplay=1";
    }
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/))) {
      return "https://www.youtube-nocookie.com/embed/" + m[1] + "?rel=0&modestbranding=1&autoplay=1";
    }
    if ((m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/))) {
      return "https://drive.google.com/file/d/" + m[1] + "/preview";
    }
    return url;
  }
  function playerHTML(url, accent) {
    var src = embedUrl(url);
    if (!src) {
      return '<div class="player"><div class="player__empty thumb' + (accent ? " thumb--" + esc(accent) : "") + '"><div>' + RIBBON + "<strong>Video coming soon</strong><p>This one is still rendering. Check back shortly.</p></div></div></div>";
    }
    return '<div class="player"><iframe src="' + esc(src) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Video player"></iframe></div>';
  }

  function openProject(slug, epIndex) {
    var p = projects.filter(function (x) { return x.slug === slug; })[0];
    if (!p) return;
    var eps = p.episodes || [];
    var ep = epIndex != null ? eps[epIndex] : null;
    var url = ep ? ep.video : (p.video || (eps[0] && eps[0].video) || "");
    var details = [["Client", p.client], ["Role", p.role], ["Tools", p.tools]].filter(function (d) { return d[1]; });

    body.innerHTML =
      '<div id="playerSlot">' + playerHTML(url, p.accent) + "</div>" +
      '<div class="modal__info">' +
        '<span class="tag">' + esc(p.category) + "</span>" +
        "<h2>" + esc(p.title) + "</h2>" +
        "<p>" + esc(p.summary) + "</p>" +
        (details.length ? "<dl>" + details.map(function (d) { return "<dt>" + d[0] + "</dt><dd>" + esc(d[1]) + "</dd>"; }).join("") + "</dl>" : "") +
        (eps.length ? '<div class="episodes">' + eps.map(function (e, i) {
          return '<button class="episode" type="button" data-ep-play="' + i + '"' + (ep === e || (!ep && i === 0) ? ' aria-current="true"' : "") + ">" +
            '<span class="frame__media">' + thumbHTML(e, p, "EP " + pad(i + 1)) + "</span>" +
            '<span class="ep-title">' + esc(e.title) + "</span></button>";
        }).join("") + "</div>" : "") +
      "</div>";

    $$("[data-ep-play]", body).forEach(function (b) {
      b.addEventListener("click", function () {
        var i = +b.getAttribute("data-ep-play");
        $("#playerSlot").innerHTML = playerHTML(eps[i].video, p.accent);
        $$("[data-ep-play]", body).forEach(function (x) { x.removeAttribute("aria-current"); });
        b.setAttribute("aria-current", "true");
        modal.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    if (!modal.open) modal.showModal();
    if (location.hash !== "#work/" + slug) history.replaceState(null, "", "#work/" + slug);
  }

  modal.addEventListener("close", function () {
    body.innerHTML = ""; // stops the video
    if (location.hash.indexOf("#work/") === 0) history.replaceState(null, "", location.pathname + location.search);
  });
  $(".modal__close", modal).addEventListener("click", function () { modal.close(); });
  modal.addEventListener("click", function (e) { if (e.target === modal) modal.close(); });

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open]");
    if (!t) return;
    e.preventDefault();
    var ep = t.getAttribute("data-ep");
    openProject(t.getAttribute("data-open"), ep != null ? +ep : null);
  });

  // Shareable links: yoursite.com/#work/pink-october opens that project directly
  function fromHash() {
    var m = location.hash.match(/^#work\/([\w-]+)/);
    if (m) openProject(m[1]);
  }
  window.addEventListener("hashchange", fromHash);
  fromHash();

  /* ================= Scroll reveal ================= */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: .15, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ================= Little delights ================= */
  var jelly = $(".jelly");
  jelly && jelly.addEventListener("click", function () {
    jelly.classList.remove("is-poked"); void jelly.offsetWidth; jelly.classList.add("is-poked");
  });
  if (reduceMotion) $$("animate.boil").forEach(function (a) { a.parentNode.removeChild(a); });

  /* ================= Contact ================= */
  var links = [
    ["Email", contact.email && "mailto:" + contact.email, contact.email],
    ["WhatsApp", contact.whatsapp, "Message me"],
    ["Instagram", contact.instagram, "Follow"],
    ["LinkedIn", contact.linkedin, "Connect"],
    ["Behance", contact.behance, "View"]
  ].filter(function (l) { return l[1]; });
  $("#contactLinks").innerHTML = links.map(function (l) {
    return '<li><a href="' + esc(l[1]) + '" target="_blank" rel="noopener"><span>' + l[0] + "</span>" + esc(l[2]) + " →</a></li>";
  }).join("");

  var form = $("#contactForm");
  var note = $("#formNote");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    if (contact.formEndpoint) {
      note.textContent = "Sending…";
      fetch(contact.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          note.textContent = "Thanks! Your brief is in. I'll reply with an idea soon.";
        })
        .catch(function () { note.textContent = "Something went wrong. Please email me directly instead."; });
    } else if (contact.email) {
      var subject = "Project brief from " + data.get("name") + (data.get("organisation") ? " (" + data.get("organisation") + ")" : "");
      var text = data.get("message") + "\n\n— " + data.get("name") + "\n" + data.get("email");
      location.href = "mailto:" + contact.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
    } else {
      note.textContent = "Contact form isn't connected yet. Add an email in js/projects.js.";
    }
  });

  $("#year").textContent = new Date().getFullYear();
  var nav = $(".nav");
  window.addEventListener("scroll", function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); }, { passive: true });
})();
