# LSU VIS Site

Static informational website for the LSU VIS (Visualization, Interactivity & Simulation) Group, served at [https://vis.lsu.edu](https://vis.lsu.edu).

## Overview

The site is a single-page, static splash page (plain HTML/CSS/JS, no build step, no backend). It introduces the LSU VIS Group and links out to related LSU programs and facilities (DMAE, XR Studio, Digital Art, the Digital Twin Core Facility, and CCT).

## Structure

- `index.html` — page markup and content
- `styles.css` — page styling
- `script.js` — client-side interactive/visual effects (background canvas field)
- `lsu-vis-logo.png` — site logo, referenced directly by `index.html`
- `sitemap.xml` — sitemap listing the production homepage for search engines
- `robots.txt` — crawler access rules and sitemap location
- `.github/workflows/deploy.yml` — CI/CD deployment workflow

## Deployment

Deployment is automated via GitHub Actions (`.github/workflows/deploy.yml`):

- Triggers on every push to `main` (or manually via `workflow_dispatch`).
- Runs on a self-hosted runner (label: `vis-deploy`) on the production host.
- Copies the homepage, assets, sitemap, crawler rules, and tracked Google verification files to `/var/www/vis`, preserving other hosted projects and the `.well-known` challenge directory.
- Applies standard file permissions (`644`) and a best-effort SELinux relabel (`restorecon`) only to the deployed files.
- Verifies that the homepage, sitemap, and crawler rules respond successfully over HTTPS.
- Keeps a timestamped backup of the replaced site files under `/var/www/vis-backups`.

No manual deployment steps are required — merging to `main` publishes the site.

## Hosting

The production host (`vis.lsu.edu`) runs Apache HTTP Server (RHEL) with hardened TLS. This configuration lives on the host, not in this repository.

## Local development

Since this is a static site with no build step, you can preview it locally with any static file server, e.g.:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
