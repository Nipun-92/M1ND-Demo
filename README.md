# M1ND Intelligence Briefing Demo

**Live URL:** https://demo.m1nd.in  
**Default passphrase:** `

---

## To change the passphrase

1. Pick a new passphrase
2. Generate its SHA-256 hash:
   ```
   python -c "import hashlib; print(hashlib.sha256(b'YOURNEWPASSPHRASE').hexdigest())"
   ```
3. Open `index.html`, find the line:
   ```
   const PASSPHRASE_HASH="22010565c8cf7994eed3d83f2b8b35448f1ca2da78f7f90082f59d179e1436fc";
   ```
4. Replace the hash value with your new hash
5. Push to GitHub — live in ~30 seconds

---

## To run locally (any laptop, no internet needed)

```bash
# From this folder:
python -m http.server 8000

# Then open: http://localhost:8000
```

Or with Node.js:
```bash
npx serve .
```

---

## GitHub Pages deployment (demo.m1nd.in)

1. Push all files in this folder to `github.com/Nipun-92/M1ND-Demo` (main branch, root /)
2. In GitHub: Settings → Pages → Deploy from branch: main, folder: / (root) → Save
3. The `CNAME` file tells GitHub Pages to serve from `demo.m1nd.in`
4. Cloudflare DNS already configured: `demo.m1nd.in` CNAME → `nipun-92.github.io`
5. SSL cert auto-provisions in ~10 min

---

## File structure

```
demo output/
├── index.html          ← Main demo (passphrase gate + full briefing prototype)
├── CNAME               ← GitHub Pages custom domain config
├── README.md           ← This file
└── assets/
    ├── brand.css       ← M1ND brand stylesheet
    ├── briefing-data.js← Live database snapshot (case counts, judge profiles)
    ├── briefing.js     ← SVG visualisation library
    ├── brand.js        ← Shared animations
    ├── logo-transparent.png
    ├── logo.png
    ├── ebs.png
    ├── nvidia-inception.svg
    ├── diagrams/       ← System architecture diagrams
    ├── img/            ← Demo screenshots
    └── reveal/         ← Reveal.js (used by presentation decks)
```

---

*M1ND · info@m1nd.in · www.m1nd.in · Confidential*
