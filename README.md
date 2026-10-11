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
- **Laws** and **Behind the scenes** (the firms that sell pricing software).

No accounts or tracking. The only thing stored is your chosen state, in your own browser.

## Editing the content

| File | What's in it |
|---|---|
| `src/data.ts` | Companies, evidence, laws, pricing vendors. Update `REVIEWED` when you recheck sources. |
| `src/guide.ts` | Tips, "I'm about to…" scenarios, myths, states, Global Privacy Control states, where to report |

Rules the tests enforce (`npm test`): every claim has an https source, dates are valid and not in
the future, every tip points at a company in the database, every scenario uses real tips, and every
law names real states.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm test
npm run build      # type check + production build into dist/
```

## Publish

Every push to `main` runs the tests, builds, and publishes to GitHub Pages
(`.github/workflows/deploy.yml`). One-time setup: **Settings → Pages → Source: GitHub Actions**.
The site appears at https://deedubs531.github.io/anonymous-pricing/.
