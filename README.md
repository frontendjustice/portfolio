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
For the form to deliver briefs straight to your inbox, create a free form at formspree.io and paste its URL into `formEndpoint`. Until then, the form opens the visitor's email app addressed to you.

## Publishing (free)

**GitHub Pages:** repo → Settings → Pages → Source: "Deploy from a branch" → choose `main` and `/ (root)`.
The site goes live at `https://frontendjustice.github.io/portfolio/`. A custom domain such as `atganimations.com` can be added on the same settings page.

**Netlify** (alternative): drag the folder onto app.netlify.com/drop, or connect the repo.

## Files

```
index.html            page structure and copy
css/style.css         design (brand colours are at the top)
js/projects.js        ← your projects and contact details
js/main.js            renders projects, video player, contact form
assets/brand/         logos and icon
assets/work/          thumbnails (add your own)
```
