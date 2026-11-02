(function () {
  "use strict";

  var projects = window.PROJECTS || [];
  var contact = window.CONTACT || {};
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ================= The reel ================= */
  var RIBBON =
    '<svg class="poster__char" viewBox="0 0 100 124" aria-hidden="true">' +
      '<path d="M50 8c-17 0-27 13-27 29 0 21 16 39 27 51 11-12 27-30 27-51 0-16-10-29-27-29Z" fill="none" stroke="#fff" stroke-width="13" stroke-linejoin="round"/>' +
      '<path d="M37 72 18 114l15-4 8 12 19-36M63 72l19 42-15-4-8 12-19-36" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="43" cy="36" r="3.6" fill="#0E1222"/><circle cx="57" cy="36" r="3.6" fill="#0E1222"/>' +
      '<path d="M45 44q5 5 10 0" fill="none" stroke="#0E1222" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="38" cy="42" r="2.6" fill="#FF4F96"/><circle cx="62" cy="42" r="2.6" fill="#FF4F96"/>' +
    "</svg>";
  var PLAY = '<span class="poster__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg></span>';

  // Each project becomes a track; each episode (or the project itself) is a clip
  var tracks = projects.map(function (p) {
    var clips = (p.episodes && p.episodes.length) ? p.episodes : [{ title: p.title, video: p.video, thumbnail: p.thumbnail }];
    return { project: p, clips: clips };
  });
  var cur = { t: 0, c: 0 };

  function embedUrl(url) {
    if (!url) return "";
    var m;
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/))) {
      return "https://player.vimeo.com/video/" + m[1] + (m[2] ? "?h=" + m[2] + "&" : "?") + "badge=0&autopause=0&title=0&byline=0&portrait=0&autoplay=1";
    }
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/))) {
      return "https://www.youtube-nocookie.com/embed/" + m[1] + "?rel=0&modestbranding=1&autoplay=1";
    }
    if ((m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/))) {
      return "https://drive.google.com/file/d/" + m[1] + "/preview";
    }
    return url;
  }

  // Vimeo cover images are fetched automatically, so no thumbnail files are needed
  var thumbCache = {};
  function vimeoThumb(clip, done) {
    var m = (clip.video || "").match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (!m || clip.thumbnail || !window.fetch) return;
    var id = m[1];
    if (!thumbCache[id]) {
      thumbCache[id] = fetch("https://vimeo.com/api/oembed.json?width=960&url=" + encodeURIComponent("https://vimeo.com/" + id))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return d && d.thumbnail_url ? d.thumbnail_url : null; })
        .catch(function () { return null; });
    }
    thumbCache[id].then(function (url) { if (url) { clip._thumb = url; done(url); } });
  }

  /* ---------- Player ----------
     For speed, the Vimeo player for the selected video loads quietly in the
     background (after the page has painted), behind our branded poster. When it is
     ready the poster fades away, so pressing play starts instantly and uses Vimeo's
     own play button (no autoplay blocking on Safari / phones). */
  var player = $("#player");
  var frame = null, frameReady = false, wantPlay = false, frameTimer = null;
  var VIMEO = "https://player.vimeo.com";
  var saveData = navigator.connection && navigator.connection.saveData;

  function vimeoId(url) { var m = (url || "").match(/vimeo\.com\/(?:video\/)?(\d+)/); return m ? m[1] : ""; }

  function showPoster(intent) {
    var tr = tracks[cur.t]; if (!tr) return;
    var p = tr.project, clip = tr.clips[cur.c], multi = tr.clips.length > 1;
    var accent = p.accent || "";
    var img = clip.thumbnail || clip._thumb || (!multi && p.thumbnail);
    if (!img) {
      var want = clip;
      vimeoThumb(clip, function (url) {
        var pi = $("#poster");
        if (tracks[cur.t].clips[cur.c] !== want || !pi) return;
        // swap in the real cover frame without rebuilding the player
        $$(".poster__char, .poster__title", pi).forEach(function (n) { n.remove(); });
        pi.classList.remove("poster--" + accent);
        pi.insertAdjacentHTML("afterbegin", '<img src="' + esc(url) + '" alt="">');
      });
    }
    clearTimeout(frameTimer);
    frame = null; frameReady = false; wantPlay = !!intent;
    player.classList.remove("is-live");
    player.innerHTML =
      '<button class="poster' + (accent && !img ? " poster--" + esc(accent) : "") + (intent && clip.video ? " is-loading" : "") + '" type="button" id="poster" aria-label="Play ' + esc(clip.title) + '">' +
        (img ? '<img src="' + esc(img) + '" alt="">' : (accent === "pink" ? RIBBON : "")) +
        (img ? "" : '<span class="poster__title"><small>' + esc(multi ? shortName(p) : (p.client || p.category || "")).toUpperCase() + "</small>" + (multi ? "EP " + pad(cur.c + 1) : esc(shortName(p))) + "</span>") +
        PLAY + (clip.video ? "" : '<span class="poster__soon">VIDEO SOON</span>') +
      "</button>";
    $("#poster").addEventListener("click", play);

    // Warm up the Vimeo player: right away if the visitor asked to play,
    // otherwise once the page is idle (skipped on "data saver" connections)
    if (vimeoId(clip.video)) {
      if (intent) loadFrame();
      else if (!saveData) frameTimer = setTimeout(function () {
        (window.requestIdleCallback || setTimeout)(loadFrame);
      }, document.readyState === "complete" ? 300 : 1200);
    }
  }

  function loadFrame() {
    clearTimeout(frameTimer);
    if (frame) return;
    var clip = tracks[cur.t].clips[cur.c];
    var id = vimeoId(clip.video); if (!id) return;
    var h = (clip.video.match(/vimeo\.com\/\d+\/([a-zA-Z0-9]+)/) || [])[1];
    frame = document.createElement("iframe");
    frame.src = VIMEO + "/video/" + id + "?" + (h ? "h=" + h + "&" : "") + "badge=0&autopause=0&title=0&byline=0&portrait=0&dnt=1";
    frame.title = clip.title;
    frame.setAttribute("allow", "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.setAttribute("allowfullscreen", "");
    var f = frame;
    // Fallback in case Vimeo never says "ready" (e.g. a privacy error page): show it anyway
    frame.addEventListener("load", function () { setTimeout(function () { if (f === frame) onReady(); }, 1500); });
    player.appendChild(frame);
  }

  function onReady() {
    if (frameReady || !frame) return;
    frameReady = true;
    player.classList.add("is-live");
    if (wantPlay) sendPlay();
  }
  function sendPlay() {
    try { frame.contentWindow.postMessage(JSON.stringify({ method: "play" }), VIMEO); } catch (e) {}
  }
  window.addEventListener("message", function (e) {
    if (e.origin !== VIMEO || !frame || e.source !== frame.contentWindow) return;
    var d = e.data;
    try { if (typeof d === "string") d = JSON.parse(d); } catch (err) { return; }
    if (d && d.event === "ready") onReady();
  });

  function play() {
    var clip = tracks[cur.t].clips[cur.c];
    if (!clip.video) { // nothing uploaded yet: give the poster a little shake instead
      var b = $("#poster .poster__play");
      if (b && b.animate && !reduceMotion) b.animate([{ transform: "rotate(0)" }, { transform: "rotate(-14deg)" }, { transform: "rotate(10deg)" }, { transform: "rotate(0)" }], { duration: 400 });
      return;
    }
    if (vimeoId(clip.video)) {
      wantPlay = true;
      if (frameReady) sendPlay();
      else { var pi = $("#poster"); if (pi) pi.classList.add("is-loading"); loadFrame(); }
      return;
    }
    // YouTube / Google Drive: load the player on click
    player.classList.add("is-live");
    player.innerHTML = '<iframe src="' + esc(embedUrl(clip.video)) + '" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="' + esc(clip.title) + '"></iframe>';
  }

  function renderTracks() {
    $("#tracks").innerHTML = tracks.map(function (tr, ti) {
      var p = tr.project;
      var c = { pink: "#FF5FA2", violet: "#6D4AFF" }[p.accent] || "#22D3EE";
      return '<div class="track"><span class="track__name" title="' + esc(p.title) + '"><i style="--c:' + c + '"></i>' + esc(shortName(p).toLowerCase()) + "</span>" +
        '<span class="track__clips">' +
          tr.clips.map(function (clip, ci) {
            var label = tr.clips.length > 1 ? "EP " + pad(ci + 1) : shortName(p);
            return '<button class="clip' + (p.accent ? " clip--" + esc(p.accent) : "") + (clip.video ? "" : " clip--empty") + '" type="button" data-t="' + ti + '" data-c="' + ci + '" title="' + esc(clip.title) + (clip.video ? "" : " (coming soon)") + '"><span>' + esc(label) + "</span></button>";
          }).join("") +
        "</span></div>";
    }).join("");
    // show each clip's cover frame on the timeline, like an editor's thumbnail track
    tracks.forEach(function (tr, ti) {
      tr.clips.forEach(function (clip, ci) {
        function paint(url) {
          var b = $('.clip[data-t="' + ti + '"][data-c="' + ci + '"]');
          if (b) { b.style.backgroundImage = "linear-gradient(rgba(14,18,34,.25), rgba(14,18,34,.6)), url(\"" + url.replace(/"/g, "") + "\")"; b.classList.add("clip--thumb"); }
        }
        if (clip.thumbnail) paint(clip.thumbnail); else vimeoThumb(clip, paint);
      });
    });
    $$(".clip").forEach(function (b) {
      b.addEventListener("click", function () {
        select(+b.getAttribute("data-t"), +b.getAttribute("data-c"), true);
      });
    });
  }

  // move the playhead to the chosen clip
  function movePlayhead() {
    var active = $('.clip[aria-current="true"]'); if (!active) return;
    var head = $(".playhead") || document.createElement("i");
    head.className = "playhead";
    if (head.parentNode !== active.parentNode) active.parentNode.appendChild(head);
    head.style.left = (active.offsetLeft + active.offsetWidth / 2) + "px";
  }

  function select(t, c, intent) {
    if (!tracks[t] || !tracks[t].clips[c]) return;
    cur = { t: t, c: c };
    var tr = tracks[t], p = tr.project, clip = tr.clips[c], multi = tr.clips.length > 1;

    $$(".clip").forEach(function (b) {
      b.setAttribute("aria-current", (+b.getAttribute("data-t") === t && +b.getAttribute("data-c") === c) ? "true" : "false");
    });
    movePlayhead();

    $("#tc").textContent = multi ? "EP " + pad(c + 1) + " / " + pad(tr.clips.length) : pad(t + 1) + " / " + pad(tracks.length);
    $("#reelScene").textContent = "SC." + pad(t + 1) + (multi ? " · EP " + pad(c + 1) : "");
    $("#now").innerHTML = "<b>" + esc(multi ? shortName(p) + " · " + clip.title : p.title) + "</b><span>" +
      esc([p.category, p.client].filter(Boolean).join(" · ")).toUpperCase() + "</span>" +
      (vimeoId(clip.video) ? '<a class="now__alt" href="https://vimeo.com/' + vimeoId(clip.video) + '" target="_blank" rel="noopener">Watch on Vimeo ↗</a>' : "");
    showPoster(intent);

    var hash = "#work/" + p.slug + (multi ? "/" + (c + 1) : "");
    if (location.hash.indexOf("#work/") === 0 || t || c) history.replaceState(null, "", hash);
  }

  if (tracks.length) {
    renderTracks();
    // Shareable links: yoursite.com/#work/pink-october/3 opens episode 3
    var m = location.hash.match(/^#work\/([\w-]+)(?:\/(\d+))?/);
    var start = { t: 0, c: 0 };
    if (m) {
      tracks.forEach(function (tr, i) { if (tr.project.slug === m[1]) start = { t: i, c: m[2] ? Math.max(0, +m[2] - 1) : 0 }; });
    } else {
      tracks.forEach(function (tr, i) { if (tr.project.featured && !start.t) start.t = i; });
    }
    select(start.t, start.c);
    window.addEventListener("resize", movePlayhead);
  }

  $("#watchBtn").addEventListener("click", function (e) {
    var r = $("#reel").getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= innerHeight) { e.preventDefault(); play(); }
  });

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
