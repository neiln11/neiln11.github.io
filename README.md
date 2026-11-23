# Neil Nambissan: portfolio

A static one-page portfolio for backend, full-stack and applied AI roles. No build step, no
framework, no server: one HTML file, the design kit's CSS and ES modules, three photographs and an
inline SVG favicon.

## Run it locally

ES modules and the inline diagrams need a local server; opening `index.html` from the file system
leaves them empty.

```sh
cd neil-portfolio
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Publish on GitHub Pages

The page uses relative paths only, so it works at a user site (`https://<username>.github.io`) and
at a project site (`https://<username>.github.io/<repo>/`). `.gitignore` keeps the local
`.taste-skill/` check output, `shots/` and `node_modules/` out of the repository.

1. Create an empty repository on GitHub. Do not add a README or a licence there.
2. In this folder:

   ```sh
   git add .
   git commit -m "Build the portfolio"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```

3. On GitHub open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` runs on every push to `main`. Watch it under
   the **Actions** tab; the deployed URL appears in the workflow summary and under
   **Settings → Pages**.
5. For a user site, name the repository `<username>.github.io`. For a project site any name works
   and the site is served under that name.

No secrets or environment variables are needed.

## What is on the page

The sections are hero, work history, products, how I work, stack, about and the closing footer.
Every section is one screen at 1440 and at 390, so a wheel or a swipe moves one idea at a time.

- `index.html`: all copy, markup and the page's own polish CSS, including the refinement block at
  the foot of the `<style>` element.
- `assets/art/hero-sky.jpg`: the twilight sky used full-bleed behind the hero. The words sit on a
  graded scrim, not in a panel.
- `assets/art/neil-headshot.jpg` (640×825) and `neil-headshot-360.jpg` (360×464): the supplied
  studio portrait, uncropped, only graded. It is shown at about 306px on a desktop, 210px on a
  tablet and as a 100px inset beside the phone heading.
- `assets/art/`: `lofi-room.jpg`, `twilight-train.jpg` and `sky-source.jpg` are the supplied
  references kept for future art; the page does not load them.
- `assets/lofi.js`: mood presets, quick jump, copy-email, the single ambient audio bed and the
  product diagram notes. It broadcasts `lofi:audio-state` and listens for `lofi:audio-toggle` and
  `lofi:volume` so the contact widget and the quick-jump controls share one engine.
- `assets/ambient.js`: the contact section's desk-signal canvas. It draws a still wave while muted
  and reads the shared Web Audio analyser when playing. No audio starts on load; reduced motion
  draws one still frame.
- `assets/interactions.js`: the quiet scroll focus on the “How I work” rows, a few pixels of
  atmospheric depth and the desktop light trail (one lantern reticle plus seven periwinkle/amber
  sparks). Reduced motion skips all of it; the depth and trail also need a fine pointer and a
  viewport of 1024px or more.
- `assets/moments/picture-develops/`: the one dealt moment, a film-look develop of the hero sky on
  load. It runs on a phone too and shows the finished photograph under reduced motion.
- `assets/`: the design kit's system, layout, cards, icons, diagrams and motion modules.
- `tools/make-art.py`: rebuilds `hero-sky.jpg` and the two portrait sizes from the local source
  images with Pillow. The source paths at the top of the script are absolute; change them if the
  files move. The portrait is never cropped.

The palette is built from the supplied twilight street scene: dusk indigo and plum-slate grounds,
periwinkle light, lantern-gold actions and a thread of dusk rose. It lives in the `:root` tokens
and the refinement block in `index.html`, never in an inserted image card in the hero or About.
The footer closes the page with an interactive desk-signal panel, the Details/Elsewhere columns and
the line `UC Merced Undergraduate 2026`.

**Quick jump** (the search button in the nav, or **Cmd/Ctrl+K** or `/`) holds the section links,
**Copy email address**, the three mood presets and the ambient audio controls. There is no
separate Mood button. Audio is generated with the Web Audio API, starts off, and never fetches a
file; the volume slider scales a filtered noise bed and a quiet chord.

Work history is two editorial entries with a compact engineering summary opposite the full
portrait, so the heading, context, photo and role cards read as one composition. Clicking a node in
a product diagram highlights its path and shows a short note drawn from the card copy. All three
“How I work” steps share the same plum-slate surface; the middle-of-screen focus only lifts a warm
tint wash over that surface, and it is removed entirely under `prefers-reduced-motion`.

## Verification

The Taste Skill checks pass: layout finds nothing at 1440, 1024, 768 and 390; copy-lint reports
0 FAIL / 0 WARN; consistency leaves only the three waived `scroll-reveal` findings, and the gate
passes. The gate carries one waiver for each “How I work” row because the brief explicitly asks
for that scroll focus: all rows share a surface at rest, the focus is a 9% tint rather than a
content reveal, and it is skipped under reduced motion. A reduced-motion browser check confirms the
trail is hidden and the row focus never runs. Captures live in `.taste-skill/shots-refine/`
(`desktop.png` and `phone.png`, with per-section tiles); that folder is gitignored and is not
published.

## Editing notes

- The main action is **Email Neil** in the nav, the hero, About and the footer. The mailto address
  is in `href` attributes only and is never printed as page copy.
- GitHub and LinkedIn links are also `href`-only. No phone number and no résumé PDF are published;
  the footer offers the résumé on request instead.
- Project repository links are pending. There are six `TODO:` comments in `#work` (two for each
  product); replace the paired comment and disabled chip with a real `<a>` when a repository goes
  public. The chips read `GitHub repository pending` and never point at an invented URL.
- Colours, type and spacing come from the design kit's tokens and the page CSS in the `<style>`
  block at the top of `index.html`. Change those, not the kit files.
- If you change the portrait, regenerate both sizes with `python3 tools/make-art.py`; do not crop
  the frame.

## Credits

The sky and portrait are supplied photographs and illustrations for this site. Tool logos come
from the SVG Logos and Simple Icons sets (CC0) through the design kit; every mark remains its
owner's trademark. Typefaces are Red Hat Display and Red Hat Text (OFL), served by Google Fonts.
