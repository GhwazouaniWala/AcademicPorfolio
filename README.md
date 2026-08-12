# Portfolio — Wala Eddine Ghazouani

Personal portfolio site. React + Vite + Tailwind CSS v4, deployed on Vercel.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On vercel.com → **Add New… → Project** → import the repo.
3. Vercel auto-detects Vite. Leave the defaults:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy.

Or from the CLI:

```bash
npm i -g vercel
vercel
```

## Editing content

All text — projects, experience, skills, certifications, contact links — lives in
**`src/data/content.js`**. Nothing else needs to be touched to update the site.

- `featuredProjects` → large instrument-panel cards
- `secondaryProjects` → compact cards under "Additional work"
- `certifications` → glass cards

## Replacing the CV

Drop a new PDF at `public/Wala_Eddine_Ghazouani_CV.pdf` (same filename), or change the
`href` in `src/components/Contact.jsx`.

## Design tokens

Colors and fonts are defined once in the `@theme` block at the top of `src/index.css`.
Change `--color-signal` to re-tint the entire site.
