(function () {
  "use strict";

  const products = [
    { id: "orbit-one", name: "Orbit One", category: "sound", categoryLabel: "Personal audio", price: 329, oldPrice: 379, badge: "Bestseller", image: "assets/orbit.webp", description: "Over-ear headphones with spatial sound, gentle noise cancellation, and up to 48 hours of battery life.", colors: ["#262825", "#dedbd1", "#a8b732"], newness: 5 },
    { id: "echo-mini", name: "Echo Mini", category: "sound", categoryLabel: "Portable sound", price: 149, badge: "New", image: "assets/echo.webp", description: "A compact speaker with room-filling sound, a protected enclosure, and a tactile carry loop made for movement.", colors: ["#e4e0d6", "#5063b6", "#b66a43"], newness: 6 },
    { id: "arc-light", name: "Arc Light", category: "light", categoryLabel: "Task lighting", price: 139, badge: "Editor’s pick", image: "assets/arc.webp", description: "Precise, flicker-free directional light with fluid color temperature, touch controls, and scene memory.", colors: ["#aba9a3", "#68291d", "#20221f"], newness: 4 },
    { id: "studio-set", name: "Studio Set 01", category: "sets", categoryLabel: "Space set", price: 429, oldPrice: 497, badge: "Set −14%", image: "assets/hero.webp", description: "The three defining objects of our first collection: room sound, personal audio, and light in one considered set.", colors: ["#d6d2c8", "#232522", "#b2c52c"], newness: 3 },
    { id: "beam-light", name: "Beam Portable", category: "light", categoryLabel: "Ambient lighting", price: 99, badge: "Limited", image: "assets/arc.webp", description: "A compact cordless light for evening rituals, delivering up to 16 hours of calm illumination on one charge.", colors: ["#aaa9a4", "#8a3322"], newness: 2 },
    { id: "echo-pocket", name: "Echo Pocket", category: "sound", categoryLabel: "Mobile sound", price: 79, badge: "Essential", image: "assets/echo.webp", description: "The lightest Masterchil object: clear sound, a protected enclosure, and only the gestures you need.", colors: ["#e2ded3", "#586bbd"], newness: 1 }
  ];

  const analytics = window.MASTERCHIL_ANALYTICS;
  const config = window.MASTERCHIL_CONFIG.site;
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const money = (value) => new Intl.NumberFormat(config.locale, { style: "currency", currency: config.currency, maximumFractionDigits: 0 }).format(value);
  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  };

  let cart = store.get("masterchil_cart", []);
  let favorites = new Set(store.get("masterchil_favorites", []));
  let currentProduct = null;
  let activeLayer = null;
  let lastFocus = null;
  let promoApplied = store.get("masterchil_promo", false);
  let checkoutStage = 1;
  let selectedDelivery = "courier";
  let toastTimer;

  function gaItem(product, quantity = 1, index = 0) {
    return {
      item_id: product.id,
      item_name: product.name,
      item_brand: "Masterchil Store",
      item_category: product.categoryLabel,
      item_list_id: "main_catalog",
      item_list_name: "Main collection",
      index,
      price: product.price,
      quantity
    };
  }

  function getProduct(id) { return products.find((product) => product.id === id); }
  function cartEntries() {
    return cart.map((entry) => ({ ...entry, product: getProduct(entry.id) })).filter((entry) => entry.product);
  }
  function totals(deliveryType = "courier") {
    const subtotal = cartEntries().reduce((sum, entry) => sum + entry.product.price * entry.qty, 0);
    const discount = promoApplied ? Math.round(subtotal * .1) : 0;
    const delivery = deliveryType === "pickup" || subtotal === 0 || subtotal >= config.freeShippingThreshold ? 0 : config.deliveryPrice;
    return { subtotal, discount, delivery, total: subtotal - discount + delivery };
  }

  function saveCart() { store.set("masterchil_cart", cart); renderCart(); }
  function toast(message) {
    const element = $(".toast");
    $("p", element).textContent = message;
    element.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove("is-visible"), 2600);
  }

  function productCard(product, index) {
    const oldPrice = product.oldPrice ? `<s>${money(product.oldPrice)}</s> ` : "";
    return `<article class="product-card is-entering" data-product-id="${product.id}" style="transition-delay:${Math.min(index * 45, 180)}ms">
      <div class="product-card__media" role="button" tabindex="0" aria-label="Quick view: ${product.name}">
        <img src="${product.image}" alt="${product.name}" width="900" height="900" loading="lazy">
        <span class="product-card__badge">${product.badge}</span>
        <button class="wishlist ${favorites.has(product.id) ? "is-active" : ""}" aria-label="${favorites.has(product.id) ? "Remove from favorites" : "Add to favorites"}"><svg><use href="#i-heart"></use></svg></button>
      </div>
      <div class="product-card__info">
        <div class="product-card__top"><div><h3>${product.name}</h3><p class="product-card__sub">${product.categoryLabel}</p></div><div class="product-card__price">${oldPrice}${money(product.price)}</div></div>
        <div class="product-card__colors">${product.colors.map((color) => `<i style="--swatch:${color}"></i>`).join("")}</div>
        <button class="card-add" aria-label="Add ${product.name} to cart"><svg><use href="#i-plus"></use></svg></button>
      </div>
    </article>`;
  }

  function renderProducts(category = $(".filter.is-active")?.dataset.category || "all", sort = $("#sort-products")?.value || "featured") {
    let list = category === "all" ? [...products] : products.filter((product) => product.category === category);
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "new") list.sort((a, b) => b.newness - a.newness);
    const grid = $("#product-grid");
    grid.innerHTML = list.map(productCard).join("");
    requestAnimationFrame(() => $$(".product-card", grid).forEach((card) => card.classList.remove("is-entering")));
    analytics.track("view_item_list", { item_list_id: "main_catalog", item_list_name: "Main collection", filter: category, sort }, { ecommerce: { items: list.map(gaItem) } });
  }

  function openLayer(element, withScrim = true) {
    if (!element) return;
    if (activeLayer && activeLayer !== element) closeLayer(activeLayer, false);
    lastFocus = document.activeElement;
    activeLayer = element;
    element.classList.add("is-open");
    element.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    if (withScrim) $(".scrim").classList.add("is-active");
    const focusable = $("button, input, select, [tabindex='0']", element);
    setTimeout(() => focusable?.focus(), 80);
  }

  function closeLayer(element = activeLayer, restoreFocus = true) {
    if (!element) return;
    element.classList.remove("is-open");
    element.setAttribute("aria-hidden", "true");
    $(".scrim").classList.remove("is-active");
    if (activeLayer === element) activeLayer = null;
    if (!$(".mobile-nav").classList.contains("is-open")) document.body.classList.remove("no-scroll");
    if (restoreFocus) lastFocus?.focus?.();
  }

  function openProduct(product, source = "catalog") {
    currentProduct = product;
    const modal = $(".product-modal");
    $(".product-modal__image", modal).src = product.image;
    $(".product-modal__image", modal).alt = product.name;
    $(".product-modal__badge", modal).textContent = product.badge;
    $(".product-modal__category", modal).textContent = product.categoryLabel;
    $(".product-modal__name", modal).textContent = product.name;
    $(".product-modal__desc", modal).textContent = product.description;
    $(".product-modal__price", modal).textContent = money(product.price);
    $$(".color", modal).forEach((button, index) => {
      button.hidden = !product.colors[index];
      if (product.colors[index]) button.style.setProperty("--color", product.colors[index]);
      button.classList.toggle("is-active", index === 0);
    });
    $(".selected-color", modal).textContent = "Graphite";
    openLayer(modal);
    analytics.track("view_item", { source }, { ecommerce: { currency: config.currency, value: product.price, items: [gaItem(product)] } });
  }

  function addToCart(product, color = "Graphite", source = "catalog") {
    const existing = cart.find((entry) => entry.id === product.id && entry.color === color);
    if (existing) existing.qty += 1;
    else cart.push({ id: product.id, qty: 1, color });
    saveCart();
    toast(`${product.name} added to cart`);
    const count = $(".cart-count");
    count.classList.add("bump");
    setTimeout(() => count.classList.remove("bump"), 320);
    analytics.track("add_to_cart", { source }, { ecommerce: { currency: config.currency, value: product.price, items: [gaItem(product)] } });
  }

  function updateQuantity(id, color, delta) {
    const entry = cart.find((item) => item.id === id && item.color === color);
    if (!entry) return;
    const product = getProduct(id);
    if (delta < 0 && entry.qty === 1) {
      cart = cart.filter((item) => !(item.id === id && item.color === color));
      analytics.track("remove_from_cart", {}, { ecommerce: { currency: config.currency, value: product.price, items: [gaItem(product)] } });
    } else {
      entry.qty += delta;
      analytics.track(delta > 0 ? "add_to_cart" : "remove_from_cart", { source: "cart_quantity" }, { ecommerce: { currency: config.currency, value: product.price, items: [gaItem(product)] } });
    }
    saveCart();
  }

  function renderCart() {
    const entries = cartEntries();
    const itemCount = entries.reduce((sum, entry) => sum + entry.qty, 0);
    $(".cart-count").textContent = itemCount;
    $(".drawer-count").textContent = itemCount;
    const container = $(".cart-items");
    container.innerHTML = entries.map(({ product, qty, color }) => `<article class="cart-item" data-id="${product.id}" data-color="${color}">
      <img src="${product.image}" alt="${product.name}"><div><h3>${product.name}</h3><p>${color}</p><div class="qty"><button data-qty="-1" aria-label="Decrease quantity"><svg><use href="#i-minus"></use></svg></button><span>${qty}</span><button data-qty="1" aria-label="Increase quantity"><svg><use href="#i-plus"></use></svg></button></div><button class="remove-item">Remove</button></div><span class="cart-item__price">${money(product.price * qty)}</span>
    </article>`).join("");
    const empty = entries.length === 0;
    $(".cart-empty").classList.toggle("is-visible", empty);
    container.hidden = empty;
    $(".cart-summary").hidden = empty;
    const sum = totals();
    $(".subtotal").textContent = money(sum.subtotal);
    $(".delivery-price").textContent = sum.delivery ? money(sum.delivery) : "Complimentary";
    $(".total").textContent = money(sum.total);
    $(".discount-row").hidden = !sum.discount;
    $(".discount").textContent = `−${money(sum.discount)}`;
    const remaining = Math.max(config.freeShippingThreshold - sum.subtotal, 0);
    $(".shipping-left").textContent = remaining ? money(remaining) : money(0);
    $(".free-shipping p").innerHTML = remaining ? `Add <strong class="shipping-left">${money(remaining)}</strong> more for complimentary delivery` : "<strong>Complimentary delivery unlocked</strong>";
    $(".free-shipping span").style.width = `${Math.min(sum.subtotal / config.freeShippingThreshold * 100, 100)}%`;
  }

  function openCart() {
    renderCart();
    openLayer($(".cart-drawer"));
    const entries = cartEntries();
    analytics.track("view_cart", {}, { ecommerce: { currency: config.currency, value: totals().subtotal, items: entries.map(({ product, qty }, index) => gaItem(product, qty, index)) } });
  }

  function toggleFavorite(product, button) {
    const nowActive = !favorites.has(product.id);
    if (nowActive) favorites.add(product.id); else favorites.delete(product.id);
    store.set("masterchil_favorites", [...favorites]);
    button.classList.toggle("is-active", nowActive);
    button.setAttribute("aria-label", nowActive ? "Remove from favorites" : "Add to favorites");
    toast(nowActive ? "Added to favorites" : "Removed from favorites");
    analytics.track(nowActive ? "add_to_wishlist" : "remove_from_wishlist", {}, { ecommerce: { currency: config.currency, value: product.price, items: [gaItem(product)] } });
  }

  function renderSearchResults(query) {
    const normalized = query.trim().toLowerCase();
    const results = normalized ? products.filter((product) => `${product.name} ${product.categoryLabel} ${product.description}`.toLowerCase().includes(normalized)) : [];
    const box = $("#search-results");
    box.innerHTML = results.map((product) => `<button class="search-result" data-product-id="${product.id}"><img src="${product.image}" alt=""><span><strong>${product.name}</strong><span>${money(product.price)}</span></span></button>`).join("");
    if (normalized && !results.length) box.innerHTML = `<p>No matches yet. Try “sound” or “light”.</p>`;
    return results;
  }

  function userHash(email) {
    let hash = 0;
    for (const character of email) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
    return `masterchil_${Math.abs(hash).toString(36)}`;
  }

  function updateUserUI() {
    const user = store.get("masterchil_user", null);
    $(".auth-label").textContent = user ? user.name.split(" ")[0] : "Sign in";
    $(".auth-trigger").setAttribute("aria-label", user ? `Account: ${user.name}` : "Sign in");
    if (user) analytics.setUser(user.id, { customer_type: "demo_member" });
  }

  function openCheckout() {
    if (!cart.length) return;
    closeLayer($(".cart-drawer"), false);
    checkoutStage = 1;
    selectedDelivery = "courier";
    $(".checkout-main").hidden = false;
    $(".checkout-summary").hidden = false;
    $(".order-success").hidden = true;
    updateCheckoutStage();
    renderCheckoutSummary();
    const user = store.get("masterchil_user", null);
    if (user) {
      const form = $("#checkout-form");
      form.elements.fullName.value = user.name || "";
      form.elements.email.value = user.email || "";
    }
    openLayer($(".checkout-modal"));
    const sum = totals();
    analytics.track("begin_checkout", { coupon: promoApplied ? "MASTER10" : undefined }, { ecommerce: { currency: config.currency, value: sum.subtotal - sum.discount, coupon: promoApplied ? "MASTER10" : undefined, items: cartEntries().map(({ product, qty }, index) => gaItem(product, qty, index)) } });
  }

  function updateCheckoutStage() {
    $$(".checkout-stage").forEach((stage) => stage.classList.toggle("is-active", Number(stage.dataset.stage) === checkoutStage));
    $$(".checkout-steps span").forEach((step, index) => step.classList.toggle("is-active", index + 1 === checkoutStage));
  }

  function stageValid() {
    const stage = $(`.checkout-stage[data-stage="${checkoutStage}"]`);
    const fields = $$(`input[required]`, stage);
    return fields.every((field) => field.reportValidity());
  }

  function renderCheckoutSummary() {
    $(".checkout-items").innerHTML = cartEntries().map(({ product, qty }) => `<div class="checkout-item"><img src="${product.image}" alt=""><div><strong>${product.name}</strong><small>${qty} pcs.</small></div><span>${money(product.price * qty)}</span></div>`).join("");
    $(".checkout-total").textContent = money(totals(selectedDelivery).total);
  }

  function completeOrder() {
    const sum = totals(selectedDelivery);
    const transactionId = `MC-${Date.now().toString().slice(-8)}`;
    analytics.track("purchase", {}, { ecommerce: {
      transaction_id: transactionId,
      affiliation: "Masterchil Store Demo",
      value: sum.subtotal - sum.discount,
      shipping: sum.delivery,
      currency: config.currency,
      coupon: promoApplied ? "MASTER10" : undefined,
      items: cartEntries().map(({ product, qty }, index) => gaItem(product, qty, index))
    }});
    cart = [];
    promoApplied = false;
    store.set("masterchil_promo", false);
    saveCart();
    $(".checkout-main").hidden = true;
    $(".checkout-summary").hidden = true;
    $(".order-success").hidden = false;
    $(".order-id").textContent = transactionId;
  }

  function setupAnalyticsLab() {
    const eventBox = $(".analytics-events");
    const empty = $(".analytics-empty");
    const count = $(".event-count");
    $(".ga-status").textContent = analytics.status.mode;
    $(".consent-status").textContent = analytics.status.consent().toUpperCase();

    function eventNode(event) {
      const article = document.createElement("article");
      article.className = "event-card";
      const time = new Date(event.timestamp).toLocaleTimeString("de-DE", { hour12: false });
      article.innerHTML = `<div class="event-card__top"><strong></strong><time>${time}</time></div><pre></pre>`;
      $("strong", article).textContent = event.event;
      $("pre", article).textContent = JSON.stringify(event.payload, null, 2);
      return article;
    }
    function addEvent(event) {
      eventBox.append(eventNode(event));
      empty.hidden = true;
      count.textContent = analytics.events.length;
      $(".consent-status").textContent = analytics.status.consent().toUpperCase();
    }
    analytics.events.forEach(addEvent);
    window.addEventListener("nova:analytics", (event) => addEvent(event.detail));
    $(".analytics-export").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(analytics.events, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `nova-analytics-${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast("Event stream exported");
    });
    $(".analytics-clear").addEventListener("click", () => {
      analytics.events.splice(0);
      eventBox.innerHTML = "";
      empty.hidden = false;
      count.textContent = "0";
    });
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const scrollButton = event.target.closest("[data-scroll-to]");
      if (scrollButton) {
        document.getElementById(scrollButton.dataset.scrollTo)?.scrollIntoView({ behavior: "smooth" });
      }
      const tracked = event.target.closest("[data-analytics-event]");
      if (tracked) {
        let params = {};
        try { params = JSON.parse(tracked.dataset.analyticsParams || "{}"); } catch { /* ignore malformed optional metadata */ }
        analytics.track(tracked.dataset.analyticsEvent, params);
      }
    });

    $("#product-grid").addEventListener("click", (event) => {
      const card = event.target.closest(".product-card");
      if (!card) return;
      const product = getProduct(card.dataset.productId);
      if (event.target.closest(".wishlist")) return toggleFavorite(product, event.target.closest(".wishlist"));
      if (event.target.closest(".card-add")) return addToCart(product, "Graphite", "catalog_card");
      if (event.target.closest(".product-card__media")) {
        analytics.track("select_item", {}, { ecommerce: { item_list_id: "main_catalog", item_list_name: "Main collection", items: [gaItem(product)] } });
        openProduct(product);
      }
    });
    $("#product-grid").addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("product-card__media")) {
        event.preventDefault();
        openProduct(getProduct(event.target.closest(".product-card").dataset.productId), "keyboard");
      }
    });

    $$(".filter").forEach((filter) => filter.addEventListener("click", () => {
      $$(".filter").forEach((item) => item.classList.remove("is-active"));
      filter.classList.add("is-active");
      renderProducts(filter.dataset.category, $("#sort-products").value);
      analytics.track("filter_products", { category: filter.dataset.category });
    }));
    $("#sort-products").addEventListener("change", (event) => {
      renderProducts($(".filter.is-active").dataset.category, event.target.value);
      analytics.track("sort_products", { sort: event.target.value });
    });

    $(".cart-trigger").addEventListener("click", openCart);
    $(".cart-close").addEventListener("click", () => closeLayer($(".cart-drawer")));
    $(".cart-browse").addEventListener("click", () => { closeLayer($(".cart-drawer")); $("#catalog").scrollIntoView({ behavior: "smooth" }); });
    $(".cart-items").addEventListener("click", (event) => {
      const item = event.target.closest(".cart-item");
      if (!item) return;
      if (event.target.closest("[data-qty]")) updateQuantity(item.dataset.id, item.dataset.color, Number(event.target.closest("[data-qty]").dataset.qty));
      if (event.target.closest(".remove-item")) {
        const entry = cart.find((cartItem) => cartItem.id === item.dataset.id && cartItem.color === item.dataset.color);
        const product = getProduct(item.dataset.id);
        cart = cart.filter((cartItem) => !(cartItem.id === item.dataset.id && cartItem.color === item.dataset.color));
        saveCart();
        analytics.track("remove_from_cart", { source: "remove_button" }, { ecommerce: { currency: config.currency, value: product.price * entry.qty, items: [gaItem(product, entry.qty)] } });
      }
    });
    $(".promo-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const value = $("#promo").value.trim().toUpperCase();
      const message = $(".promo-message");
      if (value === "MASTER10") {
        promoApplied = true; store.set("masterchil_promo", true); renderCart(); message.textContent = "Promo applied: 10% off"; analytics.track("select_promotion", { promotion_id: "MASTER10", promotion_name: "Welcome discount" });
      } else { message.textContent = "Code not found. Try MASTER10"; }
    });
    $(".checkout-trigger").addEventListener("click", openCheckout);

    $(".product-close").addEventListener("click", () => closeLayer($(".product-modal")));
    $(".product-add").addEventListener("click", () => {
      addToCart(currentProduct, $(".selected-color").textContent, "quick_view");
      closeLayer($(".product-modal"), false);
      setTimeout(openCart, 220);
    });
    $$(".color").forEach((color) => color.addEventListener("click", () => {
      $$(".color").forEach((item) => item.classList.remove("is-active"));
      color.classList.add("is-active");
      $(".selected-color").textContent = color.dataset.color;
      analytics.track("select_item_variant", { item_id: currentProduct?.id, color: color.dataset.color });
    }));

    $(".search-trigger").addEventListener("click", () => openLayer($(".search-overlay"), false));
    $(".search-close").addEventListener("click", () => closeLayer($(".search-overlay")));
    $("#search-input").addEventListener("input", (event) => renderSearchResults(event.target.value));
    $("#search-form").addEventListener("submit", (event) => { event.preventDefault(); const query = $("#search-input").value.trim(); renderSearchResults(query); if (query) analytics.track("search", { search_term: query }); });
    $$(".search-suggestions button").forEach((button) => button.addEventListener("click", () => { $("#search-input").value = button.textContent; renderSearchResults(button.textContent); analytics.track("search", { search_term: button.textContent, source: "suggestion" }); }));
    $("#search-results").addEventListener("click", (event) => { const item = event.target.closest("[data-product-id]"); if (!item) return; closeLayer($(".search-overlay"), false); openProduct(getProduct(item.dataset.productId), "search"); });

    $(".auth-trigger").addEventListener("click", () => openLayer($(".auth-modal")));
    $(".auth-close").addEventListener("click", () => closeLayer($(".auth-modal")));
    $$(".auth-tabs button").forEach((tab) => tab.addEventListener("click", () => {
      $$(".auth-tabs button").forEach((item) => item.classList.remove("is-active")); tab.classList.add("is-active");
      const register = tab.dataset.authMode === "register";
      $(".name-field").hidden = !register;
      $(".name-field input").required = register;
      $(".auth-submit").firstChild.textContent = register ? "Create account " : "Sign in ";
      $(".auth-status").textContent = "";
    }));
    $(".password-toggle").addEventListener("click", (event) => { const input = $("input", event.target.parentElement); input.type = input.type === "password" ? "text" : "password"; event.target.textContent = input.type === "password" ? "Show" : "Hide"; });
    $(".forgot-trigger").addEventListener("click", () => { $(".auth-status").textContent = "Demo mode: no recovery email is sent."; analytics.track("password_reset_request", { mode: "demo" }); });
    $("#auth-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const register = $(".auth-tabs button.is-active").dataset.authMode === "register";
      const email = String(data.get("email")).trim().toLowerCase();
      const name = register ? String(data.get("name")).trim() : email.split("@")[0].replace(/[._-]/g, " ").replace(/^./, (character) => character.toUpperCase());
      const user = { id: userHash(email), name, email };
      store.set("masterchil_user", user);
      updateUserUI();
      $(".auth-status").textContent = register ? "Account created. Welcome to Masterchil Store." : "Signed in. It is good to see you again.";
      analytics.track(register ? "sign_up" : "login", { method: "demo_email" });
      setTimeout(() => closeLayer($(".auth-modal")), 850);
    });

    $(".checkout-close").addEventListener("click", () => closeLayer($(".checkout-modal")));
    $$(".checkout-next").forEach((button) => button.addEventListener("click", () => {
      if (!stageValid()) return;
      const checkoutTotals = totals();
      if (checkoutStage === 1) analytics.track("add_shipping_info", { shipping_tier: "not_selected" }, { ecommerce: { currency: config.currency, value: checkoutTotals.subtotal - checkoutTotals.discount, items: cartEntries().map(({ product, qty }, index) => gaItem(product, qty, index)) } });
      if (checkoutStage === 2) analytics.track("add_payment_info", { payment_type: "demo_card", shipping_tier: $("input[name='delivery']:checked").value }, { ecommerce: { currency: config.currency, value: checkoutTotals.subtotal - checkoutTotals.discount, items: cartEntries().map(({ product, qty }, index) => gaItem(product, qty, index)) } });
      checkoutStage += 1; updateCheckoutStage();
    }));
    $$(".delivery-options label").forEach((label) => label.addEventListener("click", () => {
      $$(".delivery-options label").forEach((item) => item.classList.remove("is-active"));
      label.classList.add("is-active");
      selectedDelivery = $("input", label).value;
      renderCheckoutSummary();
    }));
    $("#checkout-form").addEventListener("submit", (event) => { event.preventDefault(); completeOrder(); });
    $(".success-close").addEventListener("click", () => closeLayer($(".checkout-modal")));

    $(".video-trigger").addEventListener("click", () => { openLayer($(".story-modal")); analytics.track("video_start", { video_title: "Masterchil Store brand story" }); });
    $(".story-close").addEventListener("click", () => closeLayer($(".story-modal")));
    $(".story-play").addEventListener("click", (event) => { event.currentTarget.classList.toggle("is-playing"); const playing = event.currentTarget.classList.contains("is-playing"); event.currentTarget.textContent = playing ? "Ⅱ" : "▶"; analytics.track(playing ? "video_progress" : "video_pause", { video_title: "Masterchil Store brand story", video_percent: playing ? 25 : 50 }); });

    $("#newsletter-form").addEventListener("submit", (event) => { event.preventDefault(); analytics.track("generate_lead", { form_name: "newsletter", value: 0, currency: config.currency }); toast("You are subscribed — check your inbox"); event.currentTarget.reset(); });

    const lab = $(".analytics-lab");
    $(".analytics-lab-trigger").addEventListener("click", () => { lab.classList.add("is-open"); lab.setAttribute("aria-hidden", "false"); });
    $(".analytics-close").addEventListener("click", () => { lab.classList.remove("is-open"); lab.setAttribute("aria-hidden", "true"); });
    const cookieBanner = $(".cookie-banner");
    const showCookieBanner = () => { cookieBanner.classList.add("is-open"); cookieBanner.setAttribute("aria-hidden", "false"); };
    const hideCookieBanner = () => { cookieBanner.classList.remove("is-open"); cookieBanner.setAttribute("aria-hidden", "true"); };
    $$(".privacy-settings").forEach((button) => button.addEventListener("click", showCookieBanner));
    $(".cookie-accept").addEventListener("click", () => { analytics.consent("all"); hideCookieBanner(); toast("Analytics preferences saved"); });
    $(".cookie-essential").addEventListener("click", () => { analytics.consent("essential"); hideCookieBanner(); toast("Essential cookies only"); });

    $(".scrim").addEventListener("click", () => closeLayer());
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && activeLayer) closeLayer(); });

    const menu = $(".menu-trigger");
    menu.addEventListener("click", () => { const open = !$(".mobile-nav").classList.contains("is-open"); $(".mobile-nav").classList.toggle("is-open", open); menu.setAttribute("aria-expanded", String(open)); document.body.classList.toggle("no-scroll", open); });
    $$(".mobile-nav a").forEach((link) => link.addEventListener("click", () => { $(".mobile-nav").classList.remove("is-open"); menu.setAttribute("aria-expanded", "false"); document.body.classList.remove("no-scroll"); }));
  }

  function setupMotion() {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: .12 });
    $$(".reveal").forEach((element) => observer.observe(element));
    const header = $(".site-header");
    window.addEventListener("scroll", () => header.classList.toggle("is-sticky", scrollY > 35), { passive: true });
    if (reduced) return;

    const heroImage = $(".hero__media img");
    $(".hero").addEventListener("pointermove", (event) => {
      const x = (event.clientX / innerWidth - .5) * 9;
      const y = (event.clientY / innerHeight - .5) * 6;
      heroImage.style.transform = `scale(1.05) translate(${x}px,${y}px)`;
    });
    $$(".spotlight-card").forEach((card) => card.addEventListener("pointermove", (event) => { const rect = card.getBoundingClientRect(); card.style.setProperty("--x", `${event.clientX - rect.left}px`); card.style.setProperty("--y", `${event.clientY - rect.top}px`); }));
    const cursor = $(".cursor-orb");
    document.addEventListener("pointermove", (event) => { cursor.classList.add("is-visible"); cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`; });
    document.addEventListener("pointerover", (event) => cursor.classList.toggle("is-hovering", Boolean(event.target.closest("button,a,.product-card__media"))));
    $$(".magnetic").forEach((button) => {
      button.addEventListener("pointermove", (event) => { const rect = button.getBoundingClientRect(); button.style.transform = `translate(${(event.clientX-rect.left-rect.width/2)*.12}px,${(event.clientY-rect.top-rect.height/2)*.16}px)`; });
      button.addEventListener("pointerleave", () => { button.style.transform = ""; });
    });
  }

  function init() {
    renderProducts();
    renderCart();
    updateUserUI();
    setupAnalyticsLab();
    bindEvents();
    setupMotion();

    if (analytics.status.consent() === "unset") setTimeout(() => { $(".cookie-banner").classList.add("is-open"); $(".cookie-banner").setAttribute("aria-hidden", "false"); }, 1700);
    if (new URLSearchParams(location.search).get("debug_analytics") === "1") {
      $(".analytics-lab").classList.add("is-open");
      $(".analytics-lab").setAttribute("aria-hidden", "false");
    }
    window.addEventListener("load", () => setTimeout(() => document.body.classList.add("loaded"), 250));
    setTimeout(() => document.body.classList.add("loaded"), 1800);
  }

  init();
})();
