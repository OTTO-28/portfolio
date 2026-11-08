# Rohit Udaiwal's portfolio

A minimal, static Astro site for [rohit.udaiwal.com](https://rohit.udaiwal.com), with separate home, blog, and CV pages. MDX articles include SVG illustrations and small browser-native interactive examples. No React runtime, backend, analytics, or RSS feed.

## Run locally

Use Node 22.12 or later (`.nvmrc` selects Node 22).

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the local URL printed by Astro, normally `http://127.0.0.1:4321/`.

```sh
npm run verify   # Formatting, Astro/TypeScript checks, build, and tests
npm run preview  # Serve the production build
npm run format   # Apply repository formatting
```

`npm test` checks the existing `dist/` output; build first when running tests separately. No credentials or environment variables are needed.

## Organization

| Location                   | Responsibility                                                             |
| -------------------------- | -------------------------------------------------------------------------- |
| `src/pages/`               | Home, blog index/articles, CV, and the legacy `/resume/` redirect          |
| `src/layouts/Layout.astro` | Document metadata, first-paint theme initialization, and shared page shell |
| `src/components/`          | Navigation, theme toggle, post cards, illustrations, and article demos     |
| `src/scripts/theme.js`     | System theme, saved preference, cross-tab updates, and storage fallback    |
| `src/content.config.ts`    | Blog schema and Astro Content Layer loader                                 |
| `src/content/blog/`        | MDX articles and references                                                |
| `src/lib/posts.ts`         | Shared editorial ordering and artwork selection                            |
| `src/data/cv.json`         | Professional history used by the CV page and PDF generator                 |
| `src/styles/`              | Design tokens, shared styles, and home/blog/CV styles                      |
| `scripts/`                 | Build-output checks, interaction tests, and PDF generation                 |
| `public/`                  | Served assets, custom domain, and robots file                              |

Styles use semantic variables from `tokens.css` in both light and dark mode. The theme initializer is intentionally inlined in the document head to avoid a light flash on a dark preference. The page shell stays small; article interaction scripts load only where their components are used.

The homepage quote sits above the hello/contact section. Copyright and RSS footers are intentionally absent. The legacy website can be recovered from Git history rather than maintained as a second copy in this checkout.

## Writing an article

Add an `.mdx` file under `src/content/blog/`. Its filename becomes the URL; keep filenames stable to preserve links.

```yaml
---
title: 'Your article title'
description: 'A short, specific introduction.'
pubDate: '2026-11-08'
category: 'Engineering' # Engineering or Music
readTime: 8 # Positive integer, in minutes
order: 4 # Editorial position on the index and in next-article navigation
artwork: 'eligibility' # Optional: voice, music, or eligibility
---
```

Import Astro components directly into MDX for diagrams or interactive examples. Give diagrams accessible labels and controls keyboard support. Keep clinical examples explicitly fictional, cite factual references, and distinguish teaching values from production measurements.

## Updating the CV

Edit `src/data/cv.json`, then regenerate the PDF with Python 3.10 or later:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-cv.txt
.venv/bin/python scripts/build_cv.py
```

The generator writes `output/pdf/Rohit_Udaiwal_CV_2026.pdf` and updates the served `public/assets/resume.pdf`. It uses built-in PDF fonts and deterministic document metadata. Only the served copy is tracked. The website omits the milestones section; the downloadable CV retains its honors and awards.

After changing CV content, render the PDF and inspect every page for wrapping, overflow, and readability before committing. The original CV supplied in Downloads is not modified. Python dependencies are optional for ordinary site development.

## Verification and deployment

`npm run verify` is also run by GitHub Actions on pull requests. It checks:

- Formatting and Astro/TypeScript diagnostics.
- A production build and all generated local links, anchors, and page metadata.
- Navigation, article discovery, the CV download, the old resume redirect, and quote placement.
- Theme persistence, system changes, blocked storage, latency calculations, chord frequencies, scheduled playback, and audio failure handling.

Interaction tests execute the built JavaScript with DOM/audio test doubles. They do not replace visual checks at desktop/mobile widths, keyboard navigation, or listening to the chord demo in a browser.

Work on a feature branch and open a PR against `main`. The Pages workflow deploys only after a push to `main` or a manual dispatch, and runs the same verification first. A feature-branch push or PR does not deploy the site. The custom domain is retained in `public/CNAME` and `astro.config.mjs`.
