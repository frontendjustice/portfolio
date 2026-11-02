(function () {
  "use strict";

  var projects = window.PROJECTS || [];
  var contact = window.CONTACT || {};
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function shortName(p) { return p.short || p.title.split(":")[0]; }

  /* ================= Intro loader (once per visit) ================= */
  var loader = $("#loader");
  function ready() {
    document.body.classList.add("is-ready");
    loader.classList.add("is-done");
    setTimeout(function () { loader.classList.add("is-gone"); }, 800);
  }
  var seen = false;
  try { seen = sessionStorage.getItem("atg-intro") === "1"; sessionStorage.setItem("atg-intro", "1"); } catch (e) {}
  if (reduceMotion || seen || location.hash.indexOf("#work/") === 0) {
    loader.classList.add("is-gone");
    requestAnimationFrame(function () { document.body.classList.add("is-ready"); });
  } else {
    var t = setTimeout(ready, 1150);
    loader.addEventListener("click", function () { clearTimeout(t); ready(); });
  }

  /* ================= Shared bits ================= */
  var RIBBON =
    '<svg class="poster__char" viewBox="0 0 100 124" aria-hidden="true">' +
      '<path d="M50 8c-17 0-27 13-27 29 0 21 16 39 27 51 11-12 27-30 27-51 0-16-10-29-27-29Z" fill="none" stroke="#fff" stroke-width="13" stroke-linejoin="round"/>' +
      '<path d="M37 72 18 114l15-4 8 12 19-36M63 72l19 42-15-4-8 12-19-36" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="43" cy="36" r="3.6" fill="#0E1222"/><circle cx="57" cy="36" r="3.6" fill="#0E1222"/>' +
      '<path d="M45 44q5 5 10 0" fill="none" stroke="#0E1222" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="38" cy="42" r="2.6" fill="#FF4F96"/><circle cx="62" cy="42" r="2.6" fill="#FF4F96"/>' +
    "</svg>";
  var PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>';
  var VIMEO = "https://player.vimeo.com";
  var ACCENT = { pink: "#FF5FA2", violet: "#6D4AFF", blue: "#3B8BFF", navy: "#22D3EE" };

  function vimeoId(url) { var m = (url || "").match(/vimeo\.com\/(?:video\/)?(\d+)/); return m ? m[1] : ""; }
  function embedUrl(url) {
    var m;
    if ((m = (url || "").match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/))) {
      return "https://www.youtube-nocookie.com/embed/" + m[1] + "?rel=0&modestbranding=1&autoplay=1";
    }
    if ((m = (url || "").match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/))) {
      return "https://drive.google.com/file/d/" + m[1] + "/preview";
    }
    return url || "";
  }

  // Vimeo cover images are fetched automatically, so no thumbnail files are needed
  var thumbCache = {};
  function vimeoThumb(clip, done) {
    var id = vimeoId(clip.video);
    if (!id || clip.thumbnail || !window.fetch) return;
    if (!thumbCache[id]) {
      thumbCache[id] = fetch("https://vimeo.com/api/oembed.json?width=960&url=" + encodeURIComponent("https://vimeo.com/" + id))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return d && d.thumbnail_url ? d.thumbnail_url : null; })
        .catch(function () { return null; });
    }
    thumbCache[id].then(function (url) { if (url) { clip._thumb = url; done(url); } });
  }

  /* ================= One card per project ================= */
  var players = [];

  function cardHTML(p, i) {
    var multi = p.episodes && p.episodes.length > 0;
    var n = multi ? p.episodes.length : 1;
    return '<article class="pcard reveal" id="work-' + esc(p.slug) + '" style="--acc:' + (ACCENT[p.accent] || "#6D4AFF") + '">' +
      '<div class="pcard__media">' +
        '<div class="pcard__screen">' +
          '<span class="pcard__label pcard__label--l" data-scene>SC.' + pad(i + 1) + "</span>" +
          '<span class="pcard__label pcard__label--r">24 FPS</span>' +
          '<div class="player" data-player></div>' +
        "</div>" +
        (multi ?
          '<div class="tl">' +
            '<div class="tl__bar"><span class="tl__tc" data-tc>EP 01 / ' + pad(n) + '</span><span class="tl__comp">' + esc(p.slug.replace(/-/g, "_")) + ".aep</span></div>" +
            '<div class="tl__clips" data-clips>' +
              p.episodes.map(function (ep, ci) {
                return '<button class="clip' + (ep.video ? "" : " clip--empty") + '" type="button" data-c="' + ci + '" title="' + esc(ep.title) + (ep.video ? "" : " (coming soon)") + '"><span>EP ' + pad(ci + 1) + "</span></button>";
              }).join("") +
            "</div>" +
          "</div>" : "") +
      "</div>" +
      '<div class="pcard__body">' +
        '<span class="pcard__num">' + pad(i + 1) + " / " + pad(projects.length) + "</span>" +
        (p.category ? '<span class="tag">' + esc(p.category) + "</span>" : "") +
        "<h3>" + esc(p.title) + "</h3>" +
        (p.client ? '<p class="pcard__client">CLIENT · ' + esc(p.client).toUpperCase() + "</p>" : "") +
        (p.summary ? '<p class="pcard__sum">' + esc(p.summary) + "</p>" : "") +
        (p.role || p.tools ? '<dl class="pcard__meta">' + (p.role ? "<dt>Role</dt><dd>" + esc(p.role) + "</dd>" : "") + (p.tools ? "<dt>Tools</dt><dd>" + esc(p.tools) + "</dd>" : "") + "</dl>" : "") +
        (multi ? '<p class="pcard__now" data-now></p>' : "") +
        '<div class="pcard__actions">' +
          '<button class="btn" type="button" data-play>' + PLAY_ICON + "Play</button>" +
          '<a class="pcard__alt" data-alt target="_blank" rel="noopener" hidden>Watch on Vimeo ↗</a>' +
        "</div>" +
      "</div>" +
    "</article>";
  }

  function Player(card, project, index) {
    var self = this;
    var clips = (project.episodes && project.episodes.length) ? project.episodes : [{ title: project.title, video: project.video, thumbnail: project.thumbnail }];
    var multi = clips.length > 1 || !!(project.episodes && project.episodes.length);
    var box = $("[data-player]", card);
    var cur = 0, frame = null, frameReady = false, wantPlay = false, timer = null, warm = false;
    self.card = card; self.project = project;

    function clip() { return clips[cur]; }

    function showPoster(intent) {
      var c = clip(), accent = project.accent || "";
      var img = c.thumbnail || c._thumb || (!multi && project.thumbnail);
      clearTimeout(timer);
      frame = null; frameReady = false; wantPlay = !!intent;
      box.classList.remove("is-live");
      box.innerHTML =
        '<button class="poster' + (accent && !img ? " poster--" + esc(accent) : "") + (intent && c.video ? " is-loading" : "") + '" type="button" aria-label="Play ' + esc(c.title) + '">' +
          (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : (accent === "pink" ? RIBBON : "")) +
          (img ? "" : '<span class="poster__title"><small>' + esc(multi ? shortName(project) : (project.client || project.category || "")).toUpperCase() + "</small>" + (multi ? "EP " + pad(cur + 1) : esc(shortName(project))) + "</span>") +
          '<span class="poster__play" aria-hidden="true">' + PLAY_ICON + "</span>" +
          (c.video ? "" : '<span class="poster__soon">VIDEO SOON</span>') +
        "</button>";
      $(".poster", box).addEventListener("click", self.play);
      if (!img) {
        var want = c;
        vimeoThumb(c, function (url) {
          var pi = $(".poster", box);
          if (clip() !== want || !pi) return;
          $$(".poster__char, .poster__title", pi).forEach(function (n) { n.remove(); });
          pi.classList.remove("poster--" + accent);
          pi.insertAdjacentHTML("afterbegin", '<img src="' + esc(url) + '" alt="">');
        });
      }
      if (vimeoId(c.video) && (intent || warm)) {
        if (intent) loadFrame(); else if (!saveData) timer = setTimeout(function () { (window.requestIdleCallback || setTimeout)(loadFrame); }, 250);
      }
    }

    function loadFrame() {
      clearTimeout(timer);
      if (frame) return;
      var c = clip(), id = vimeoId(c.video); if (!id) return;
      var h = (c.video.match(/vimeo\.com\/\d+\/([a-zA-Z0-9]+)/) || [])[1];
      frame = document.createElement("iframe");
      frame.src = VIMEO + "/video/" + id + "?" + (h ? "h=" + h + "&" : "") + "badge=0&autopause=0&title=0&byline=0&portrait=0&dnt=1";
      frame.title = c.title;
      frame.setAttribute("allow", "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share");
      frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      frame.setAttribute("allowfullscreen", "");
      var f = frame;
      // Fallback in case Vimeo never says "ready" (e.g. a privacy error page): show it anyway
      frame.addEventListener("load", function () { setTimeout(function () { if (f === frame) self.onReady(); }, 1500); });
      box.appendChild(frame);
    }

    self.ownsWindow = function (w) { return frame && frame.contentWindow === w; };
    self.onReady = function () {
      if (frameReady || !frame) return;
      frameReady = true;
      box.classList.add("is-live");
      if (wantPlay) send("play");
    };
    function send(method) {
      try { frame && frame.contentWindow.postMessage(JSON.stringify({ method: method }), VIMEO); } catch (e) {}
    }
    self.pause = function () { wantPlay = false; if (frameReady) send("pause"); };

    // Warm up the player once the card scrolls into view
    self.warm = function () {
      if (warm) return; warm = true;
      if (vimeoId(clip().video) && !frame && !saveData) timer = setTimeout(function () { (window.requestIdleCallback || setTimeout)(loadFrame); }, 250);
    };

    self.play = function () {
      var c = clip();
      if (!c.video) { // nothing uploaded yet: give the play button a little shake instead
        var b = $(".poster__play", box);
        if (b && b.animate && !reduceMotion) b.animate([{ transform: "rotate(0)" }, { transform: "rotate(-14deg)" }, { transform: "rotate(10deg)" }, { transform: "rotate(0)" }], { duration: 400 });
        return;
      }
      players.forEach(function (o) { if (o !== self) o.pause(); });
      if (vimeoId(c.video)) {
        wantPlay = true;
        if (frameReady) send("play");
        else { var pi = $(".poster", box); if (pi) pi.classList.add("is-loading"); loadFrame(); }
        return;
      }
      // YouTube / Google Drive: load the player on click
      box.classList.add("is-live");
      box.innerHTML = '<iframe src="' + esc(embedUrl(c.video)) + '" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="' + esc(c.title) + '"></iframe>';
    };

    self.select = function (c, intent, keepHash) {
      if (!clips[c]) return;
      cur = c;
      var x = clip();
      $$(".clip", card).forEach(function (b) { b.setAttribute("aria-current", +b.getAttribute("data-c") === c ? "true" : "false"); });
      self.movePlayhead();
      var tc = $("[data-tc]", card); if (tc) tc.textContent = "EP " + pad(c + 1) + " / " + pad(clips.length);
      $("[data-scene]", card).textContent = "SC." + pad(index + 1) + (multi ? " · EP " + pad(c + 1) : "");
      var now = $("[data-now]", card);
      if (now) now.innerHTML = "<span>Now showing</span><b>EP " + pad(c + 1) + " · " + esc(x.title) + "</b>";
      var alt = $("[data-alt]", card), id = vimeoId(x.video);
      alt.hidden = !id; if (id) alt.href = "https://vimeo.com/" + id;
      $("[data-play]", card).disabled = !x.video;
      showPoster(intent);
      if (!keepHash) history.replaceState(null, "", "#work/" + project.slug + (multi ? "/" + (c + 1) : ""));
    };

    self.movePlayhead = function () {
      var wrap = $("[data-clips]", card); if (!wrap) return;
      var active = $('.clip[aria-current="true"]', wrap); if (!active) return;
      var head = $(".playhead", wrap) || wrap.appendChild(document.createElement("i"));
      head.className = "playhead";
      head.style.left = (active.offsetLeft + active.offsetWidth / 2) + "px";
    };

    // wire up controls
    $$(".clip", card).forEach(function (b) {
      b.addEventListener("click", function () { self.select(+b.getAttribute("data-c"), true); });
      if (clips[+b.getAttribute("data-c")].thumbnail) paintClip(b, clips[+b.getAttribute("data-c")].thumbnail);
      else vimeoThumb(clips[+b.getAttribute("data-c")], function (url) { paintClip(b, url); });
    });
    $("[data-play]", card).addEventListener("click", self.play);
    self.select(0, false, true);
  }
  function paintClip(b, url) {
    b.style.backgroundImage = "linear-gradient(rgba(14,18,34,.25), rgba(14,18,34,.6)), url(\"" + url.replace(/"/g, "") + "\")";
    b.classList.add("clip--thumb");
  }

  var cardsEl = $("#cards");
  cardsEl.innerHTML = projects.map(cardHTML).join("");
  $("#workCount").textContent = pad(projects.length) + (projects.length === 1 ? " PROJECT" : " PROJECTS");
  $$(".pcard", cardsEl).forEach(function (card, i) { players.push(new Player(card, projects[i], i)); });

  // Messages from Vimeo players ("ready") go to the card that owns them
  window.addEventListener("message", function (e) {
    if (e.origin !== VIMEO) return;
    var d = e.data;
    try { if (typeof d === "string") d = JSON.parse(d); } catch (err) { return; }
    if (!d || d.event !== "ready") return;
    players.forEach(function (pl) { if (pl.ownsWindow(e.source)) pl.onReady(); });
  });
  window.addEventListener("resize", function () { players.forEach(function (pl) { pl.movePlayhead(); }); });

  // Cards pop in as you scroll, and their players warm up just before they're needed
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        players.forEach(function (pl) { if (pl.card === en.target) pl.warm(); });
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px 120px 0px", threshold: .12 });
    players.forEach(function (pl) { io.observe(pl.card); });
  } else {
    players.forEach(function (pl) { pl.card.classList.add("in"); pl.warm(); });
  }

  // Shareable links: yoursite.com/#work/pink-october/3 scrolls to that card and selects episode 3
  (function () {
    var m = location.hash.match(/^#work\/([\w-]+)(?:\/(\d+))?/);
    if (!m) return;
    players.forEach(function (pl) {
      if (pl.project.slug !== m[1]) return;
      pl.select(m[2] ? Math.max(0, +m[2] - 1) : 0, false, true);
      pl.card.classList.add("in");
      pl.warm();
      requestAnimationFrame(function () { pl.card.scrollIntoView({ block: "center" }); });
    });
  })();

  /* ================= Eyes follow the cursor ================= */
  if (!reduceMotion) {
    var eyes = $$("[data-eyes]"), pending = false, px = 0, py = 0;
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

  /* ================= Contact ================= */
  var links = [
    ["✉", "Email", contact.email && "mailto:" + contact.email],
    ["✆", "WhatsApp", contact.whatsapp],
    ["◎", "Instagram", contact.instagram],
    ["in", "LinkedIn", contact.linkedin],
    ["Bē", "Behance", contact.behance]
  ].filter(function (l) { return l[2]; });
  $("#contactLinks").innerHTML = links.map(function (l) {
    return '<li><a href="' + esc(l[2]) + '" target="_blank" rel="noopener"><span aria-hidden="true">' + l[0] + "</span>" + l[1] + "</a></li>";
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
      var subject = "Project brief from " + data.get("name");
      var text = data.get("message") + "\n\n— " + data.get("name") + "\n" + data.get("email");
      location.href = "mailto:" + contact.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
    } else {
      note.textContent = "Contact form isn't connected yet. Add an email in js/projects.js.";
    }
  });

  $("#year").textContent = new Date().getFullYear();
})();
