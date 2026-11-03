# ATG Animations: portfolio site

A short landing page for ATG Animations: what I do, a card for each project with its video, and a call to action. It's plain HTML, CSS and JS with no build step, so you can open `index.html` in a browser to preview it.

## Adding or updating work

Edit **`js/projects.js`**. It's the only file you need to touch.

1. Upload the video to **Vimeo** or **YouTube** (unlisted is fine). Google Drive links also work if the file is shared as "Anyone with the link".
2. Paste the link into the `video` field of the project or episode.
3. Optional: add a thumbnail image to `assets/work/` and set `thumbnail: "assets/work/your-image.jpg"`. Without one, a branded placeholder card is shown.
4. Commit and push. The live site updates automatically.

Each project gets its own card (in the order listed in `js/projects.js`) with its own player. A series (with `episodes`) gets an episode picker inside its card.
Every video has its own shareable link, e.g. `https://<your-site>/#work/pink-october/3` opens episode 3.

## Contact details

Fill in `window.CONTACT` at the bottom of `js/projects.js` (email, WhatsApp, Instagram, LinkedIn).
The contact form sends briefs straight to your inbox through Formspree (`formEndpoint`). If sending fails, visitors are shown your email address instead.

## Publishing (free)

**Cloudflare Pages (recommended):** fast worldwide, unlimited bandwidth, works with a private repo.
1. dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git → pick `frontendjustice/portfolio`.
2. Framework preset: **None**. Build command: *(leave empty)*. Output directory: `/`.
3. Choose the branch to publish, then Deploy. You get `https://<name>.pages.dev`; every push updates it.
4. Optional: Custom domains → add e.g. `atganimations.com`.

**GitHub Pages (simplest):** repo → Settings → Pages → Source: "Deploy from a branch" → pick the branch and `/ (root)`.
Live at `https://frontendjustice.github.io/portfolio/`. On the free GitHub plan the repo must be public.

After going live, add your site address under Formspree → your form → Settings → Restrict to domain, so spam bots can't use the form from elsewhere.

## Files

```
index.html            page structure and copy
css/style.css         design (brand colours are at the top)
js/projects.js        ← your projects and contact details
js/main.js            renders projects, video player, contact form
assets/brand/         logos and icon
assets/work/          thumbnails (add your own)
```
