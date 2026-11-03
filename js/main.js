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
      // The branded poster (colour, character, title) is always drawn underneath; a cover
      // image covers it once it has loaded, and is dropped if it fails to load.
      box.innerHTML =
        '<button class="poster' + (accent ? " poster--" + esc(accent) : "") + (intent && c.video ? " is-loading" : "") + '" type="button" aria-label="Play ' + esc(c.title) + '">' +
          (accent === "pink" ? RIBBON : "") +
          '<span class="poster__title"><small>' + esc(multi ? shortName(project) : (project.category || "")).toUpperCase() + "</small>" + (multi ? "EP " + pad(cur + 1) : esc(shortName(project))) + "</span>" +
          '<span class="poster__play" aria-hidden="true">' + PLAY_ICON + "</span>" +
          (c.video ? "" : '<span class="poster__soon">VIDEO SOON</span>') +
        "</button>";
      var poster = $(".poster", box);
      poster.addEventListener("click", self.play);
      if (img) addCover(poster, img);
      else {
        var want = c;
        vimeoThumb(c, function (url) { var pi = $(".poster", box); if (clip() === want && pi) addCover(pi, url); });
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
  function addCover(poster, url) {
    var im = new Image();
    im.alt = "";
    im.onload = function () { poster.classList.add("has-img"); };
    im.onerror = function () { im.remove(); };
    im.src = url;
    poster.insertBefore(im, poster.firstChild);
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
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
  function openFromHash() {
    var m = location.hash.match(/^#work\/([\w-]+)(?:\/(\d+))?/);
    if (!m) return;
    players.forEach(function (pl) {
      if (pl.project.slug !== m[1]) return;
      pl.select(m[2] ? Math.max(0, +m[2] - 1) : 0, false, true);
      pl.card.classList.add("in");
      pl.warm();
      requestAnimationFrame(function () { pl.card.scrollIntoView({ block: "center" }); });
    });
  }

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
  var ICON_WA = '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico ico--wa"><path class="ico__bubble" d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Z"/><path class="ico__phone" d="M8.7 7.4c.2-.4.5-.5.8-.5h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .5-.1.7l-.6.7c-.1.2-.1.4 0 .6.6 1.1 1.5 2 2.6 2.6.2.1.4.1.6 0l.7-.6c.2-.2.5-.2.7-.1l1.9.8c.3.1.4.3.4.5v.6c0 .3-.1.6-.5.8-.6.4-1.4.6-2.1.4-2.9-.7-5.2-3-5.9-5.9-.2-.7 0-1.5.4-2.1Z"/></svg>';
  var ICON_IG = '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico ico--ig"><rect x="3" y="3" width="18" height="18" rx="5.2"/><circle cx="12" cy="12" r="4.2"/><circle class="ico__dot" cx="17.4" cy="6.6" r="1.2"/></svg>';
  var ICON_MAIL = '<svg viewBox="0 0 24 24" aria-hidden="true" class="ico ico--mail"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>';
  var igHandle = contact.instagram ? "@" + contact.instagram.replace(/\/+$/, "").split("/").pop() : "";
  var waNumber = (contact.whatsappNumber || "").replace(/\D/g, "");

  function waLink(text) {
    if (waNumber) return "https://wa.me/" + waNumber + (text ? "?text=" + encodeURIComponent(text) : "");
    return contact.whatsapp || "";
  }

  $("#contactLinks").innerHTML =
    (contact.whatsapp || waNumber ?
      '<a class="social__btn social__btn--wa" href="' + esc(waLink("Hi Justice! I found you through your portfolio.")) + '" target="_blank" rel="noopener">' +
        '<span class="social__icon">' + ICON_WA + "</span>" +
        '<span class="social__text"><b>Chat on WhatsApp</b><small>Quick question? Let\'s talk</small></span>' +
        '<span class="social__arrow" aria-hidden="true">→</span></a>' : "") +
    (contact.instagram ?
      '<a class="social__btn social__btn--ig" href="' + esc(contact.instagram) + '" target="_blank" rel="noopener">' +
        '<span class="social__icon">' + ICON_IG + "</span>" +
        '<span class="social__text"><b>Follow ' + esc(igHandle) + "</b><small>See more of my work</small></span>" +
        '<span class="social__arrow" aria-hidden="true">→</span></a>' : "") +
    (contact.email ?
      '<a class="social__mail" href="mailto:' + esc(contact.email) + '">' + ICON_MAIL + esc(contact.email) + "</a>" : "");

  /* ---------- WhatsApp chat window ----------
     A floating chat button opens a small WhatsApp-style chat on the page. The visitor
     types their message here, and "Send" carries it over to WhatsApp to deliver. */
  if (contact.whatsapp || waNumber) {
    document.body.insertAdjacentHTML("beforeend",
      '<div class="wa" id="wa">' +
        '<div class="wa__panel" id="waPanel" role="dialog" aria-label="Chat with Justice on WhatsApp" hidden>' +
          '<div class="wa__head">' +
            '<img src="assets/brand/profile.svg" alt="" width="40" height="40">' +
            "<div><b>Justice · ATG Animations</b><small>Replies on WhatsApp</small></div>" +
            '<button type="button" class="wa__close" id="waClose" aria-label="Close chat">×</button>' +
          "</div>" +
          '<div class="wa__body" id="waBody">' +
            '<div class="wa__msg">Hi there 👋 I\'m Justice.<br>Got a health topic you\'d like animated? Tell me a little about it.<span class="wa__time">ATG Animations</span></div>' +
            '<div class="wa__chips" id="waChips">' +
              '<button type="button">I have a project in mind</button>' +
              "<button type=\"button\">I'd like a quote</button>" +
              '<button type="button">Just saying hi</button>' +
            "</div>" +
          "</div>" +
          '<form class="wa__form" id="waForm">' +
            '<textarea id="waText" rows="1" placeholder="Type a message…" aria-label="Your message"></textarea>' +
            '<button type="submit" class="wa__send" aria-label="Send on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.2 15 12 3.4 13.8Z"/></svg></button>' +
          "</form>" +
          '<p class="wa__note" id="waNote">Opens WhatsApp to send</p>' +
        "</div>" +
        '<span class="wa__teaser" id="waTeaser" hidden>Got a project? Let\'s chat <button type="button" id="waTeaserX" aria-label="Dismiss">×</button></span>' +
        '<button type="button" class="wa__fab" id="waFab" aria-label="Chat on WhatsApp" aria-expanded="false" aria-controls="waPanel">' + ICON_WA + "</button>" +
      "</div>");

    var waPanel = $("#waPanel"), waFab = $("#waFab"), waText = $("#waText"), waTeaser = $("#waTeaser");
    var teaserSeen = false;
    try { teaserSeen = sessionStorage.getItem("atg-wa-teaser") === "1"; } catch (e) {}

    function setOpen(open) {
      waPanel.hidden = !open;
      waFab.setAttribute("aria-expanded", open ? "true" : "false");
      $("#wa").classList.toggle("is-open", open);
      if (open) { hideTeaser(); setTimeout(function () { waText.focus({ preventScroll: true }); }, 50); }
    }
    function hideTeaser() {
      waTeaser.hidden = true;
      try { sessionStorage.setItem("atg-wa-teaser", "1"); } catch (e) {}
    }
    waFab.addEventListener("click", function () { setOpen(waPanel.hidden); });
    $("#waClose").addEventListener("click", function () { setOpen(false); waFab.focus(); });
    $("#waTeaserX").addEventListener("click", function (e) { e.stopPropagation(); hideTeaser(); });
    waTeaser.addEventListener("click", function () { setOpen(true); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !waPanel.hidden) setOpen(false); });
    $$("#waChips button").forEach(function (c) {
      c.addEventListener("click", function () { waText.value = c.textContent + (c.textContent === "Just saying hi" ? " 👋" : ": "); waText.focus(); });
    });
    function grow() { waText.style.height = "auto"; waText.style.height = Math.min(waText.scrollHeight, 110) + "px"; }
    waText.addEventListener("input", grow);
    $$("#waChips button").forEach(function (c) { c.addEventListener("click", grow); });
    waText.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#waForm").requestSubmit ? $("#waForm").requestSubmit() : $("#waForm").dispatchEvent(new Event("submit")); }
    });
    $("#waForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var text = waText.value.trim() || "Hi Justice! I found you through your portfolio.";
      if (!waNumber && navigator.clipboard) {
        // The message link can't carry text, so copy it for the visitor to paste
        navigator.clipboard.writeText(text).then(function () {
          $("#waNote").textContent = "Message copied. Just paste it in WhatsApp";
        }).catch(function () {});
      }
      window.open(waLink(text), "_blank", "noopener");
    });

    // A gentle nudge after a little while (once per visit)
    if (!teaserSeen && !reduceMotion) setTimeout(function () { if (waPanel.hidden) waTeaser.hidden = false; }, 9000);
  }

  var form = $("#contactForm");
  var note = $("#formNote");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    if (contact.formEndpoint) {
      var btn = $("button[type=submit]", form);
      data.append("_subject", "New brief from " + data.get("name"));
      btn.disabled = true;
      note.textContent = "Sending…";
      fetch(contact.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          note.textContent = "Thanks! Your brief is in. I'll get back to you soon.";
        })
        .catch(function () {
          note.innerHTML = "Sorry, that didn't send." + (contact.email ? ' Please email me at <a href="mailto:' + esc(contact.email) + '">' + esc(contact.email) + "</a>." : "");
        })
        .then(function () { btn.disabled = false; });
    } else if (contact.email) {
      var subject = "Project brief from " + data.get("name");
      var text = data.get("message") + "\n\n— " + data.get("name") + "\n" + data.get("email");
      location.href = "mailto:" + contact.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
      note.innerHTML = 'Opening your email app… If nothing opens, email me at <a href="mailto:' + esc(contact.email) + '">' + esc(contact.email) + "</a>.";
    } else {
      note.textContent = "Contact form isn't connected yet. Add an email in js/projects.js.";
    }
  });

  $("#year").textContent = new Date().getFullYear();
})();
