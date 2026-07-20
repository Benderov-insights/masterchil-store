# Masterchil Store

A polished static e-commerce storefront built for GitHub Pages. It includes a premium responsive interface, local product imagery, catalog search and filters, favorites, a persistent cart, promo codes, demo authentication and checkout, plus a complete GA4/GTM-ready analytics layer.

The storefront is designed for the German market: English-language UI, EUR pricing, VAT-inclusive totals, German phone formatting, and complimentary delivery over €200.

## Live demo

[Open Masterchil Store](https://benderov-insights.github.io/masterchil-store/)

Use promo code `MASTER10` during checkout. To inspect analytics events, add `?debug_analytics=1` to the URL or select **Analytics Lab** in the footer.

## Run locally

No build step or dependencies are required. Open `index.html` directly or start a local server:

```bash
python -m http.server 4173
```

Then visit `http://localhost:4173`.

## Features

- responsive product catalog with filters and sorting;
- search by product name, category, and description;
- quick view with product variant selection;
- favorites and cart state persisted in `localStorage`;
- delivery, discount, VAT, and order-total calculations in EUR;
- three-step demo checkout with a `purchase` event;
- demo registration and sign-in flows;
- Consent Mode v2 with full or essential-only consent;
- `dataLayer` and recommended GA4 e-commerce events;
- Analytics Lab with event inspection and JSON export;
- reveal, parallax, marquee, spotlight, and reduced-motion experiences;
- optimized local WebP artwork with no external image CDN.

## Analytics setup

Open `js/config.js`, choose one integration method, and enable only that method.

### Recommended: Google Tag Manager

```js
gtm: {
  enabled: true,
  containerId: "GTM-ABC1234"
},
ga4: {
  enabled: false,
  measurementId: "G-XXXXXXXXXX"
}
```

### Alternative: direct GA4 installation

```js
gtm: {
  enabled: false,
  containerId: "GTM-XXXXXXX"
},
ga4: {
  enabled: true,
  measurementId: "G-ABC1234567",
  debugMode: false,
  sendPageView: true
}
```

Do not enable GTM and direct GA4 at the same time, because that would duplicate events. The complete tag map, event parameters, funnels, and QA checklist are documented in [ANALYTICS.md](ANALYTICS.md).

## Authentication and payments

This project targets static hosting, so registration, sign-in, and checkout are safe demonstration flows:

- passwords are never stored;
- account and cart data remain in the visitor's browser;
- card details are never requested;
- demo orders are created locally and never charge a payment method.

For production, replace the `#auth-form` handler in `js/app.js` with Firebase Auth, Supabase Auth, Auth0, or your own API. Orders and payments must be created on a trusted backend. Never expose secret keys in the repository or client-side JavaScript.

## Project structure

```text
masterchil-store/
├── index.html          # semantic markup and interface flows
├── styles.css          # visual system, responsive layout, and animation
├── js/
│   ├── config.js       # store and GA4/GTM configuration
│   ├── analytics.js    # consent, dataLayer, and unified event API
│   └── app.js          # catalog, cart, auth, checkout, and UI behavior
├── assets/             # local WebP artwork and favicon
├── ANALYTICS.md        # detailed GA4/GTM implementation guide
└── .nojekyll           # disables Jekyll processing on GitHub Pages
```

## Production checklist

Before a real launch, replace demo prices, contact details, social links, delivery and returns terms, privacy policy, and seller legal information. Add a backend for inventory, accounts, orders, and payments.

## Deployment

GitHub Pages deploys the `main` branch from `/(root)`. All paths are relative, so the storefront works correctly at the project URL. The included `.nojekyll` file keeps deployment fully static.
