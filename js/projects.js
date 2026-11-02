/*
  ============================================================
  YOUR PROJECTS — this is the only file you need to edit
  ============================================================

  To add a project, copy one { ... } block, paste it into the list,
  and fill in the details. Order here = order on the site.

  Fields:
    slug       short id used in the shareable link, e.g. "pink-october"
               (lowercase, dashes, no spaces) -> yoursite.com/#work/pink-october
    title      project name
    client     who it was for
    category   shown on the card, e.g. "Campaign series", "Explainer", "Social campaign"
    summary    1–3 sentences: the message, the audience, the result
    role       what you did (optional)
    tools      software used (optional)
    video      a Vimeo or YouTube link, e.g. "https://vimeo.com/123456789"
               or "https://youtu.be/abc123". Leave "" until it's uploaded.
    thumbnail  an image in assets/work/, e.g. "assets/work/pink-1.jpg" (optional —
               a branded placeholder is shown if empty)
    accent     card colour if there's no thumbnail (optional)
    episodes   for a series: a list of { title, video, thumbnail } (optional)
    featured   true = shown as the big highlight at the top of the Work section
*/

window.PROJECTS = [
  {
    slug: "pink-october",
    title: "Pink October: Breast Cancer Awareness Series",
    client: "Medical Scholar Board (US NGO)",
    category: "Campaign series · 6 episodes",
    summary:
      "A six-part animated series for Medical Scholar Board's Pink October campaign: short, medically accurate explainers that make breast cancer awareness clear, hopeful and easy to share.",
    role: "",   // e.g. "Script, design & animation"
    tools: "",  // e.g. "After Effects, Illustrator"
    video: "",  // link to the full series or episode 1
    thumbnail: "",
    accent: "pink",
    featured: true,
    episodes: [
      { title: "What is Breast Cancer?", video: "https://vimeo.com/1242547249", thumbnail: "" },
      { title: "Episode 2", video: "https://vimeo.com/1242550627", thumbnail: "" },
      { title: "Episode 3", video: "", thumbnail: "" },
      { title: "Episode 4", video: "", thumbnail: "" },
      { title: "Episode 5", video: "", thumbnail: "" },
      { title: "Episode 6", video: "", thumbnail: "" }
    ]
  }

  /* ---- Example of another project (remove the slashes-star to use) ----
  ,{
    slug: "antibiotic-resistance",
    title: "Finish the Course",
    client: "City Pharmacy",
    category: "Explainer",
    summary: "A 60-second explainer on why patients should finish their antibiotics.",
    role: "Script, design & animation",
    tools: "After Effects",
    video: "https://vimeo.com/000000000",
    thumbnail: "assets/work/finish-the-course.jpg",
    accent: "violet"
  }
  ---------------------------------------------------------------------- */
];

/* Your contact details — shown in the Contact section and footer */
window.CONTACT = {
  email: "",          // e.g. "hello@atganimations.com"
  whatsapp: "",       // e.g. "https://wa.me/2348000000000"
  instagram: "",      // full profile link
  linkedin: "",
  behance: "",
  formEndpoint: ""    // optional: Formspree URL, e.g. "https://formspree.io/f/abcd1234"
};
