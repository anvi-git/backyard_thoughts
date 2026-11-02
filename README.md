# Backyard Publications Platform

A high-performance, content-driven editorial platform hosting the *From Backyard* family of publications:
- **Heralding Time**: Long-form essays on cosmology, philosophy, and the history of science.
- **Space of Sound**: Sound orbits, record explorations, and acoustic chronicles.
- **Last Scattering Surface**: Astrophysics and stellar evolution dispatches.
- **The Blog**: Concise field notes, poetry, and editorial observations.

---

## 1. Quick Start & Development Commands

This project runs standard Node.js without heavy frameworks or build-step overhead:

```bash
# Install dependencies (Express for local serving)
npm install

# Start local development server (serves on http://localhost:3000)
npm run dev

# Run content integrity & route validator
npm run check
# or
npm run lint

# Build (creates static deployment bundle)
npm run build
```

---

## 2. Centralized Styling System

All design tokens are centralized in `tokens.css`. To change the site-wide appearance, modify variables in `:root`:

### Common Style Updates in `tokens.css`:
- **Palette**:
  ```css
  --ht-black: #0d0d0d;      /* Ink & heading color */
  --ht-white: #ffffff;      /* Background / paper */
  --ht-accent: #d98f55;     /* Warm copper editorial accent */
  --ht-accent-hover: #b86b32;
  --ht-gray-border: #e4e1db;/* Card and section dividers */
  ```
- **Typography**:
  ```css
  --ht-font-title: 'Bebas Neue', sans-serif;
  --ht-font-mono: 'JetBrains Mono', monospace;
  --ht-font-body: var(--ht-font-mono);
  ```
- **Article Container Dimensions**:
  ```css
  --ht-article-width: 50%;       /* 50% width centered editorial column */
  --ht-article-max-width: 740px;
  ```

`style.css` imports `tokens.css` and defines shared components (header, footer, card grids, drop caps, and media facades). `ht.css` imports `style.css` for 100% backward compatibility.

---

## 3. How to Add a New Article

Every article consists of:
1. A post body file (HTML or Markdown) in `posts/<publication>/`.
2. A metadata entry in the publication's data registry file.

### Step-by-Step Example (Adding to Heralding Time):

1. **Create the post file**:
   Save your post in `posts/heralding_time/ht_post_my_new_essay.html` or `.md`:
   ```html
   <p>First paragraph of the essay begins here with an automatic editorial drop cap.</p>
   <p>Second paragraph continues the thoughts on the subject...</p>
   ```

2. **Register in `ht_data.js`**:
   Add a new entry with an incremental numeric ID:
   ```javascript
   window.HT_ARTICLES["47"] = {
     "title": "My New Essay Title",
     "date": "2026-04-01",
     "excerpt": "A short summary of the essay displayed on the card and deck.",
     "markdownFile": "posts/heralding_time/ht_post_my_new_essay.html",
     "image": "images/ht/posts/cover.png",
     "language": "eng"
   };
   ```

3. **Verify with the automated checker**:
   ```bash
   npm run check
   ```

### Publication File Locations & Registries:
| Publication | Post Folder | Registry File | Single Viewer URL |
| :--- | :--- | :--- | :--- |
| **Heralding Time** | `posts/heralding_time/` | `ht_data.js` | `ht_article.html?article=<slug>` |
| **Space of Sound** | `posts/space_of_sound/` | `spacesound_data.js` | `spacesound_article.html?article=<slug>` |
| **Last Scattering Surface** | `posts/lss/` | `lss_data.js` | `lss_article.html?article=<slug>` |
| **The Blog** | `posts/blog/` | `blog_data.js` | `blog_article.html?id=<id>` |

---

## 4. Images and Videos

### Image Guidelines
- **Formats**: Prefer `.webp` or `.png`/`.jpg`. Avoid `.heic` files directly in web markup (convert to `.webp` using ImageMagick `convert`).
- **Responsive Attributes**: The `media-embeds.js` and `article-engine.js` automatically set `loading="lazy"` and `decoding="async"` on all in-body images, while above-the-fold hero images use `loading="eager"`.
- **Dimensions**: Card thumbnails should ideally be 16:10 or 1:1, max 1600px width.

### Video & Audio Embeds (Click-to-Load Facades)
To preserve loading performance and user privacy, external `<iframe>` players (YouTube, Apple Music) are converted into lightweight click-to-load facades by `media-embeds.js`:
- YouTube embeds load a static poster preview with a high-contrast play button and privacy disclosure.
- The external player is only downloaded and instantiated when the user clicks or presses Enter/Space on the facade.
- You can place standard iframe markup in any post file; `BackyardMedia.enhanceContainerMedia()` upgrades it automatically.

---

## 5. Site Settings & Navigation

Global navigation and branding are rendered consistently across all pages:
- **Header & Footer**: Injected by `layout.js` into `<div id="site-header"></div>` and `<div id="site-footer"></div>`.
- **Top Bar**: Fixed header featuring the *Backyard* logo icon, title link, and publication links.
- **Substack Integrations**: Free subscription forms point directly to the respective Substack publications:
  - Heralding Time: `https://heraldingtime.substack.com`
  - Space of Sound: `https://spaceofsound.substack.com`
  - Last Scattering Surface: `https://lastscatteringsurface.substack.com`
  - The Blog: `https://substack.com/@backyardmagazine`

---

## 6. Zero-Cost Hosting Workflows

Because this project is built with standard static assets (HTML/CSS/JS) and a lightweight fallback Express server, it can be hosted permanently for **free** on multiple modern platforms:

### Option A: Cloudflare Pages (Recommended - 100% Free, Global Edge CDN)
- **Framework Preset**: None (Static HTML)
- **Build Command**: `npm run check` (or leave empty)
- **Build Output Directory**: `.` (Root directory)
- **Free Tier Limits**: Unlimited requests, 500 builds/month, 100 custom domains.

### Option B: GitHub Pages (100% Free for Public Repos)
- **Source**: Deploy from branch (`main` root `/`)
- **Custom Domain**: Supported with automatic free SSL/TLS.
- **Free Tier Limits**: 1 GB repository size, 100 GB monthly bandwidth.

### Option C: Netlify / Vercel (100% Free Tier)
- **Publish Directory**: `.`
- **Build Command**: `npm run check`
- **Redirects / Rewrites**: Create a `_redirects` file with `/*  /index.html  200` if custom SPA routing is needed.

### Option D: Container / Cloud Run (Current Setup)
- Runs `server.js` using Node.js/Express with automatic `.html` fallback routing on port 3000.
