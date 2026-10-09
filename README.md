# Kino XII

A cinema network web app built for the Redberry Bootcamp XII assignment. Visitors browse films, pick a session in one of four venues, choose seats and buy tickets. The app talks to the [Kino XII API](https://api.kinoxii.redberryinternship.ge/docs).

**Live:** https://nikoloz-tsikaridze-redberry.vercel.app (mirror: https://ntsik0.github.io/Kino-XII/)

## Features

- **Auth** – Log in and Sign up modals with on-blur validation, valid/invalid field states, avatar upload with preview and per-field API errors. Any protected action (choosing seats, Notify Me, My Tickets…) opens the login modal and **continues automatically** after sign in. A `401` from any protected request opens the modal and replays the request.
- **Home** – Animated hero rotating the featured films, Recently viewed (stored locally, visible to guests too), Now Playing and Coming Soon rows. Coming soon titles offer Notify Me instead of seat selection.
- **Search** – Debounced header typeahead with prompt, results and no-results states.
- **Sessions** – Sticky filter sidebar (venue, date, format, language, time of day), sort, title search and pagination. The format list narrows to what the selected venues can show. **All state lives in the URL** (`/sessions?venue=galleria,vake&date=2026-10-12&format=max&sort=price_asc&page=2`), so copied links, refresh and Back/Forward restore the exact view. Changing a filter or the sort returns to page 1.
- **Movie details** – Backdrop, poster, synopsis, rating with explanation, cast, director, formats; 7 day picker that disables days without sessions; sessions grouped by venue and hall. 16+/18+ films are disabled for underage accounts with an explanation.
- **Booking modal** – Hall map drawn from the API (sections → rows → seats, gaps and aisles included), up to 3 seats, per-seat ticket type (Adult/Child/Student, ratios from the API, child blocked on 16+/18+), live subtotal. Seats are held for 8 minutes with a countdown driven by `expiresAt`. `409` names the lost seats, marks them sold, keeps the rest and refetches the map. On expiry the modal resets to step 1 and explains why. Checkout is prefilled from the profile, guards against double submits and maps `422` errors onto fields. The confirmation is rendered from the order the API returned. Closing the modal releases the hold.
- **Profile** – Personal information with the exact validation messages from the brief, complete/incomplete status (yellow/green dot in the navbar), age eligibility notice. My Tickets with Upcoming/Past tabs and refunds driven by `isRefundable`, re-read from the server afterwards.
- **States everywhere** – Skeletons on lists (no full-page spinners on Sessions), empty states with a way out, error states with Retry, disabled buttons while requests are in flight.

## Tech

React 18, React Router 6, Vite 5 and plain CSS. No UI or form libraries; validation, modals and data fetching are small hand-written hooks/components.

```
src/
  api/          fetch client (token, error shapes, 401 replay) and endpoint wrappers
  context/      auth, booking gate, filter options (fetched once), toasts
  hooks/        useAsync, useForm, useSessionFilters (URL state), useCountdown
  components/   layout, modal, form field, cards, session tiles, booking/, profile/
  pages/        Home, Sessions, Movie, Profile, NotFound
  utils/        formatting, validators, eligibility, recently viewed
```

Nothing that the API exposes is hardcoded: venues, formats, languages, time bands, sorts, ticket ratios, age ratings, the seat cap and the hold length all come from `GET /filter-options`.

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

A seeded account with a complete profile and tickets in both tabs: `jane@kinoxii.test` / `password`. Payments are simulated; `4242 4242 4242 4242` with any future expiry works.

## Deployment

**Vercel:** the repo is imported as a Vercel project; every push to `main` deploys it. `vercel.json` rewrites all paths to `index.html` so deep links like `/sessions?...` work.

**GitHub Pages:** every push to `main` runs `.github/workflows/deploy.yml`, which builds with `VITE_BASE=/<repo>/` and publishes `dist/` to the `gh-pages` branch. The build also copies `index.html` to `404.html` so deep links like `/sessions?...` load the app on GitHub Pages.
