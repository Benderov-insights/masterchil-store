/**
 * Masterchil Store runtime configuration.
 *
 * GitHub Pages serves static files, so analytics IDs live on the client by design.
 * Replace the placeholders, switch exactly ONE integration on, and commit the file.
 * See README.md for GA4/GTM setup and validation.
 */
window.MASTERCHIL_CONFIG = {
  site: {
    name: "Masterchil Store",
    version: "1.0.0",
    currency: "EUR",
    locale: "de-DE",
    country: "DE",
    vatRate: 0.19,
    deliveryPrice: 6,
    freeShippingThreshold: 200
  },

  analytics: {
    // Recommended: configure GA4 in Google Tag Manager and enable this block.
    gtm: {
      enabled: false,
      containerId: "GTM-XXXXXXX"
    },

    // Alternative: direct gtag.js connection. Do not enable together with GTM.
    ga4: {
      enabled: false,
      measurementId: "G-XXXXXXXXXX",
      debugMode: false,
      sendPageView: true
    },

    // Keeps the on-site Analytics Lab useful before real IDs are connected.
    localDebug: true,

    // Consent defaults are applied before either external analytics script loads.
    consentDefaults: {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500
    }
  }
};
