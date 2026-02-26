# AGENTS.md

## Cursor Cloud specific instructions

This is a static HTML prototype (no build tools, package manager, tests, or linting).

### Running the application

Serve the files with any static HTTP server from the workspace root:

```
python3 -m http.server 8000
```

Then open pages at `http://localhost:8000/首页.html` (URL-encode Chinese filenames if needed).

### Key caveats

- **CDN dependency**: Tailwind CSS and Font Awesome load from external CDNs (`cdn.tailwindcss.com`, `unpkg.com`). Pages will render unstyled without network access.
- **Chinese filenames**: All HTML files use Chinese names. When referencing via URL, percent-encode them (e.g., `%E9%A6%96%E9%A1%B5.html` for `首页.html`).
- **No build/lint/test**: There is no `package.json`, no bundler, no linter, and no test framework. The project is pure static HTML.
- **Images**: Reference external Tencent Cloud object storage URLs (public placeholder images).

### Pages

| Page | File | Description |
|------|------|-------------|
| Homepage | `首页.html` | Trending destinations, seasonal picks, inspiration feed |
| Destinations | `目的地.html` | Destination browsing and filtering |
| AI Trip Planner | `AI旅行规划.html` | AI-based trip planning UI |
| Trip Assistant | `旅行助手.html` | Countdown, weather, timeline, tools |
| Profile | `个人中心.html` | User profile, trips, favorites, orders |
