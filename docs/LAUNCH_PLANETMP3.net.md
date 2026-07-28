# Launch Planet MP3 on planetmp3.net

Your app is already built for **Cloudflare Pages** (`crate-app` → https://crate-app.pages.dev).  
The domain on **Namecheap** connects to that project; **Firebase** must allow the new hostname for sign-in.

---

## Overview

| Piece | Where |
|--------|--------|
| Hosting | Cloudflare Pages project `crate-app` |
| API / auth / data | Firebase `crate-app-58494` (unchanged) |
| DNS | Namecheap → point at Cloudflare (recommended) |

---

## Step 1 — Cloudflare Pages custom domain

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → project **crate-app** (or whatever owns `crate-app.pages.dev`).
2. **Custom domains** → **Set up a custom domain**.
3. Add:
   - `planetmp3.net`
   - `www.planetmp3.net`
4. Cloudflare shows **DNS records** to create. Keep that tab open for Step 2.

SPA routing is already in `public/_redirects` (`/* → /index.html`).

---

## Step 2 — Namecheap DNS (pick one path)

### Option A — Recommended: use Cloudflare DNS (free SSL, apex + www easy)

1. In Cloudflare: **Add site** → `planetmp3.net` → Free plan.
2. Cloudflare gives **two nameservers** (e.g. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
3. Namecheap: **Domain List** → **Manage** → **Nameservers** → **Custom DNS** → paste Cloudflare nameservers → save.
4. Wait until Cloudflare shows the zone **Active** (often 15 minutes–24 hours).
5. In Cloudflare **DNS** for `planetmp3.net`, confirm Pages added the records (or add what Pages asked for).
6. In Pages **Custom domains**, status should become **Active** with SSL **Issued**.

### Option B — Keep Namecheap DNS only

1. **www**: **CNAME** `www` → `crate-app.pages.dev` (or the exact target Pages shows).
2. **Root (@)**: Namecheap often needs **URL Redirect** `planetmp3.net` → `https://www.planetmp3.net` *or* **ALIAS/ANAME** to `crate-app.pages.dev` if your panel supports it.
3. Follow whatever hostnames Cloudflare Pages lists for verification.

---

## Step 3 — Firebase Auth (required for login)

1. [Firebase Console](https://console.firebase.google.com) → project **crate-app-58494**.
2. **Authentication** → **Settings** → **Authorized domains**.
3. **Add domain**:
   - `planetmp3.net`
   - `www.planetmp3.net`
4. Leave `localhost` and `crate-app.pages.dev` if you still use them.

Without this, email/Google/phone sign-in shows **unauthorized-domain**.

---

## Step 4 — Google / Apple sign-in (if you use them)

**Google Cloud Console** (OAuth client used by Firebase):

- **Authorized JavaScript origins**: `https://planetmp3.net`, `https://www.planetmp3.net`
- **Authorized redirect URIs**: keep Firebase defaults, e.g.  
  `https://crate-app-58494.firebaseapp.com/__/auth/handler`

**Apple** (if enabled): same pattern in Apple Developer → Services ID → domains / return URLs per Firebase docs.

---

## Step 5 — Ship the build you want live

Production today is the committed **`build/`** folder (Pages `pages_build_output_dir` in `wrangler.toml`).

Before pointing the domain at a new release:

```bash
git checkout main
git pull
npm ci
npm run build
git add build
git commit -m "Production build for planetmp3.net"
git push
```

(Or configure Pages **Build command** `npm run build`, **Output** `build`, Node 22, `CI=false` — then you can stop committing `build/`.)

Merge open PRs first if you want taxonomy/upload docs on production.

---

## Step 6 — Verify

- [ ] https://planetmp3.net loads the app (not parking page).
- [ ] https://www.planetmp3.net works (or redirects to apex — pick one canonical URL in Cloudflare **Bulk Redirects** if you want).
- [ ] Deep link works, e.g. `https://planetmp3.net/home` (refresh does not 404).
- [ ] Sign up / sign in on the custom domain.
- [ ] Playback and catalog load (Firestore rules deployed: `firebase deploy --only firestore:rules,storage`).

---

## Optional polish

| Task | Why |
|------|-----|
| Canonical host | Redirect `www` ↔ apex in Cloudflare so one URL for sharing |
| `robots.txt` / SEO | Already minimal in `public/`; add `og:url` later if you want |
| Firebase Hosting | You have `firebase.json` hosting config; **production is Pages**, not Firebase Hosting, unless you switch |

---

## Quick links

| Resource | URL |
|----------|-----|
| Current Pages URL | https://crate-app.pages.dev |
| Cloudflare Pages | https://dash.cloudflare.com → Workers & Pages |
| Firebase project | https://console.firebase.google.com/project/crate-app-58494 |
| Namecheap DNS | https://ap.www.namecheap.com/domains/list |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Namecheap parking page | DNS not pointed at Cloudflare/Pages yet; check nameservers or CNAME |
| SSL pending | Wait; ensure orange-cloud/proxy on if using Cloudflare DNS |
| Auth works on `.pages.dev` but not `.net` | Authorized domains (Step 3) |
| Refresh on `/search` → 404 | Redeploy; confirm `build/_redirects` contains `/* /index.html 200` |
