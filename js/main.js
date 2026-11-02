(function () {
  "use strict";

  var projects = window.PROJECTS || [];
  var contact = window.CONTACT || {};

  var PLAY = '<span class="thumb__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg></span>';
  var RIBBON = '<svg class="thumb__ribbon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c-2.4 0-3.8 1.9-3.8 4.2 0 2.9 2.4 5.7 3.8 7.6 1.4-1.9 3.8-4.7 3.8-7.6 0-2.3-1.4-4.2-3.8-4.2Z"/><path d="M9.7 11.6 6 20.5l2.9-.8 1.4 2.3 3.5-7.6"/><path d="M14.3 11.6 18 20.5l-2.9-.8-1.4 2.3"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Turn a Vimeo / YouTube / Google Drive link into an embeddable player URL */
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

  function thumbHTML(item, parent) {
    var src = item.thumbnail || (parent && !item.video && parent.thumbnail) || "";
    var accent = item.accent || (parent && parent.accent) || "";
    var hasVideo = !!(item.video || (item.episodes && item.episodes.some(function (e) { return e.video; })));
    var inner = src
      ? '<img src="' + esc(src) + '" alt="" loading="lazy">'
      : (accent === "pink" ? RIBBON : "");
    return '<span class="thumb' + (accent && !src ? " thumb--" + esc(accent) : "") + '">' +
      inner + PLAY + (hasVideo ? "" : '<span class="thumb__soon">Video coming soon</span>') + "</span>";
  }

  /* ---------- Render work ---------- */
  var featured = projects.filter(function (p) { return p.featured; })[0];
  var featuredEl = document.getElementById("featured");
  var gridEl = document.getElementById("grid");

  if (featured) {
    featuredEl.innerHTML =
      '<article class="featured">' +
        '<button class="featured__media card" type="button" data-open="' + esc(featured.slug) + '" aria-label="Play ' + esc(featured.title) + '">' + thumbHTML(featured) + "</button>" +
        '<div class="featured__body">' +
          '<span class="tag">' + esc(featured.category) + "</span>" +
          "<h3 style=\"font-size:1.6rem\">" + esc(featured.title) + "</h3>" +
          '<p class="meta">' + esc(featured.client) + "</p>" +
          "<p>" + esc(featured.summary) + "</p>" +
          '<button class="btn" type="button" data-open="' + esc(featured.slug) + '">Watch the series</button>' +
        "</div>" +
      "</article>";
  }

  var gridItems = [];
  // Episodes of the featured series appear as cards, followed by other projects
  if (featured && featured.episodes) {
    featured.episodes.forEach(function (ep, i) {
      gridItems.push({ open: featured.slug, ep: i, title: ep.title, sub: featured.title.split(":")[0], html: thumbHTML(ep, featured) });
    });
  }
  projects.forEach(function (p) {
    if (p === featured) return;
    gridItems.push({ open: p.slug, title: p.title, sub: [p.category, p.client].filter(Boolean).join(" · "), html: thumbHTML(p) });
  });
  gridEl.innerHTML = gridItems.map(function (g) {
    return '<button class="card" type="button" data-open="' + esc(g.open) + '"' + (g.ep != null ? ' data-ep="' + g.ep + '"' : "") + ">" +
      '<span class="card__media">' + g.html + "</span>" +
      "<h3>" + esc(g.title) + "</h3><p>" + esc(g.sub) + "</p></button>";
  }).join("");

  /* ---------- Modal ---------- */
  var modal = document.getElementById("modal");
  var body = document.getElementById("modalBody");

  function playerHTML(url) {
    var src = embedUrl(url);
    if (!src) {
      return '<div class="player"><div class="player__empty"><div><strong>Video coming soon</strong><p>This one is being uploaded. Check back shortly.</p></div></div></div>';
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
      '<div id="playerSlot">' + playerHTML(url) + "</div>" +
      '<div class="modal__info">' +
        '<span class="tag">' + esc(p.category) + "</span>" +
        "<h2>" + esc(p.title) + "</h2>" +
        "<p>" + esc(p.summary) + "</p>" +
        (details.length ? "<dl>" + details.map(function (d) { return "<dt>" + d[0] + "</dt><dd>" + esc(d[1]) + "</dd>"; }).join("") + "</dl>" : "") +
        (eps.length ? '<div class="episodes">' + eps.map(function (e, i) {
          return '<button class="episode" type="button" data-ep-play="' + i + '"' + (ep === e ? ' aria-current="true"' : "") + ">" +
            '<span class="card__media">' + thumbHTML(e, p) + "</span>" +
            '<span class="ep-title">' + esc(e.title) + "</span></button>";
        }).join("") + "</div>" : "") +
      "</div>";

    body.querySelectorAll("[data-ep-play]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = +b.getAttribute("data-ep-play");
        document.getElementById("playerSlot").innerHTML = playerHTML(eps[i].video);
        body.querySelectorAll("[data-ep-play]").forEach(function (x) { x.removeAttribute("aria-current"); });
        b.setAttribute("aria-current", "true");
        modal.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    if (!modal.open) modal.showModal();
    if (location.hash !== "#work/" + slug) history.replaceState(null, "", "#work/" + slug);
  }

  function closeModal() {
    if (modal.open) modal.close();
  }
  modal.addEventListener("close", function () {
    body.innerHTML = ""; // stops the video
    if (location.hash.indexOf("#work/") === 0) history.replaceState(null, "", location.pathname + location.search);
  });
  modal.querySelector(".modal__close").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

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

  /* ---------- Contact ---------- */
  var links = [
    ["Email", contact.email && "mailto:" + contact.email, contact.email],
    ["WhatsApp", contact.whatsapp, "Message me"],
    ["Instagram", contact.instagram, "Follow"],
    ["LinkedIn", contact.linkedin, "Connect"],
    ["Behance", contact.behance, "View"]
  ].filter(function (l) { return l[1]; });
  document.getElementById("contactLinks").innerHTML = links.map(function (l) {
    return '<li><a href="' + esc(l[1]) + '" target="_blank" rel="noopener"><span>' + l[0] + "</span>" + esc(l[2]) + " →</a></li>";
  }).join("");

  var form = document.getElementById("contactForm");
  var note = document.getElementById("formNote");
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

  /* ---------- Misc ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
  var nav = document.querySelector(".nav");
  window.addEventListener("scroll", function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); }, { passive: true });
})();
