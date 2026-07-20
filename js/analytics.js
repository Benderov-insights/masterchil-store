(function () {
  "use strict";

  const config = window.MASTERCHIL_CONFIG?.analytics || {};
  const site = window.MASTERCHIL_CONFIG?.site || {};
  const storedConsent = localStorage.getItem("masterchil_consent") || "unset";
  const eventHistory = [];
  const maxHistory = 250;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

  const hasRealId = (value, prefix) => Boolean(value && value.startsWith(prefix) && !value.includes("XXXX"));
  const gtmReady = Boolean(config.gtm?.enabled && hasRealId(config.gtm.containerId, "GTM-"));
  const gaReady = Boolean(config.ga4?.enabled && hasRealId(config.ga4.measurementId, "G-"));

  if (gtmReady && gaReady) {
    console.warn("[Masterchil Analytics] GTM and direct GA4 are both enabled. Disable one to avoid duplicate events.");
  }

  // Consent Mode v2 defaults must be set before loading GTM or gtag.js.
  window.gtag("consent", "default", config.consentDefaults || {
    analytics_storage: "denied",
    ad_storage: "denied"
  });

  if (storedConsent === "all") {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted"
    });
  }

  function injectScript(src, id) {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.async = true;
    script.id = id;
    script.src = src;
    document.head.appendChild(script);
  }

  if (gtmReady) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtm.containerId)}`, "nova-gtm");
  } else if (gaReady) {
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4.measurementId)}`, "nova-ga4");
    window.gtag("js", new Date());
    window.gtag("config", config.ga4.measurementId, {
      send_page_view: config.ga4.sendPageView !== false,
      debug_mode: Boolean(config.ga4.debugMode)
    });
  }

  function clean(value) {
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value)
        .filter(([, child]) => child !== undefined && child !== null && child !== "")
        .map(([key, child]) => [key, clean(child)]));
    }
    return value;
  }

  function record(eventName, payload) {
    const recordItem = {
      event: eventName,
      timestamp: new Date().toISOString(),
      payload: clean(payload)
    };
    eventHistory.push(recordItem);
    if (eventHistory.length > maxHistory) eventHistory.shift();
    window.dispatchEvent(new CustomEvent("nova:analytics", { detail: recordItem }));
    if (config.localDebug) console.debug(`[Masterchil Analytics] ${eventName}`, recordItem.payload);
  }

  function track(eventName, parameters = {}, options = {}) {
    const payload = clean({
      ...parameters,
      ...(options.ecommerce ? { ecommerce: options.ecommerce } : {})
    });

    if (options.ecommerce) window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({ event: eventName, ...payload });

    // In direct GA4 mode there is no GTM trigger to translate dataLayer objects.
    if (gaReady && !gtmReady) {
      window.gtag("event", eventName, payload);
    }

    record(eventName, payload);
  }

  function updateConsent(level) {
    const all = level === "all";
    const consent = {
      analytics_storage: all ? "granted" : "denied",
      ad_storage: all ? "granted" : "denied",
      ad_user_data: all ? "granted" : "denied",
      ad_personalization: all ? "granted" : "denied"
    };
    localStorage.setItem("masterchil_consent", all ? "all" : "essential");
    window.gtag("consent", "update", consent);
    window.dataLayer.push({ event: "consent_update", consent_level: all ? "all" : "essential", ...consent });
    record("consent_update", { consent_level: all ? "all" : "essential", ...consent });
  }

  function setUser(userId, properties = {}) {
    const safeProperties = clean(properties);
    window.dataLayer.push({ event: "user_context", user_id: userId || undefined, user_properties: safeProperties });
    if (gaReady && !gtmReady) {
      window.gtag("config", config.ga4.measurementId, { user_id: userId || null });
      window.gtag("set", "user_properties", safeProperties);
    }
    record("user_context", { user_id: userId || null, user_properties: safeProperties });
  }

  window.MASTERCHIL_ANALYTICS = Object.freeze({
    track,
    consent: updateConsent,
    setUser,
    events: eventHistory,
    status: {
      mode: gtmReady ? "GTM" : gaReady ? "GA4" : "DEMO",
      configured: gtmReady || gaReady,
      consent: () => localStorage.getItem("masterchil_consent") || "unset",
      currency: site.currency || "EUR"
    }
  });

  record("analytics_ready", {
    mode: gtmReady ? "GTM" : gaReady ? "GA4" : "DEMO",
    consent: storedConsent,
    site_version: site.version || "unknown"
  });
})();
