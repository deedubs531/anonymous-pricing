# Who Pays More

_Repository: anonymous-pricing. Live site: https://deedubs531.github.io/anonymous-pricing/ (after Pages is turned on)._

Some apps and stores charge different people different prices for the same thing. This site is an
educational resource on it:

- **What you can do:** a checklist for the moment you're about to order groceries, book a ride, shop
  online, use a store's app or book travel. Every tip links to the case that shows why it matters and
  says where it stops working.
- **Your rights:** pick your state to see which pricing laws apply, whether websites must honor
  Global Privacy Control, and where to report.
- **Companies:** Instacart, Uber, Lyft, DoorDash, Target, Kroger, JetBlue, Tinder and others, tagged **Tested**
  (independent testers saw different prices), **Admitted** (the company disclosed or confirmed it) or
  **Investigated** (a regulator, lawmaker or lawsuit), with the company's response and sources.
- **Two-account check** (`/app-check/`): for apps like Uber, Lyft, Instacart and DoorDash. You price the
  same ride or cart on your own account and on a clean second account (in a private tab) at the same
  time, add both screenshots, and it reads the prices on the phone, shows the difference, and keeps a
  log with the pattern and a report you can share. Screenshots never leave the phone.
- **Check a website:** a free tool that loads the product page you're on again as a signed-out visitor
  (same device and connection, no login or cookies) and tells you if your price is higher, lower, the
  same, or changing on its own. Installs as a userscript (iPhone Safari via the Userscripts app,
  Tampermonkey or Violentmonkey on a computer) or a bookmarklet in any browser. Nothing is sent
  anywhere except the one extra request to the store.
- **Laws** and **Behind the scenes** (the firms that sell pricing software).

No accounts or tracking. The only thing stored is your chosen state, in your own browser.

## Editing the content

| File | What's in it |
|---|---|
| `src/data.ts` | Companies, evidence, laws, pricing vendors. Update `REVIEWED` when you recheck sources. |
| `src/guide.ts` | Tips, "I'm about to…" scenarios, myths, states, Global Privacy Control states, where to report |
| `checker/` | Price check: reading prices from structured data (`extract.ts`), the signed-out fetch (`check.ts`), verdicts (`compare.ts`), the on-page card (`ui.ts`) |
| `src/appcheck/` | Two-account check: apps (`apps.ts`), reading prices from screenshot text (`prices.ts`), on-device OCR (`ocr.ts`), saved checks (`store.ts`, `log.ts`), the page (`main.ts`) |
| `scripts/copy-ocr.mjs` | Copies the OCR engine and English data into `dist/ocr/`, so screenshots are read without any outside server |
| `scripts/build-checker.mjs` | Builds `price-check.js` (bookmarklet) and `price-check.user.js` (userscript) into `dist/` |

Price check reads prices from the schema.org, microdata and Open Graph data stores publish for
search engines, so it works on many retail and travel sites but not on ones that hide prices until
you sign in. It checks twice signed out: if those two disagree, it reports that the price is
changing on its own instead of blaming your data.

Rules the tests enforce (`npm test`): every claim has an https source, dates are valid and not in
the future, every tip points at a company in the database, every scenario uses real tips, and every
law names real states.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173 (screenshot reading needs a build: npm run build && npm run preview)
npm test
npm run build      # type check + production build into dist/
```

## Publish

Every push to `main` runs the tests, builds, and publishes to GitHub Pages
(`.github/workflows/deploy.yml`). One-time setup: **Settings → Pages → Source: GitHub Actions**.
The site appears at https://deedubs531.github.io/anonymous-pricing/.
