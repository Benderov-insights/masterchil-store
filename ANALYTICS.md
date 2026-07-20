# Masterchil Store GA4 / GTM implementation map

The storefront already creates `window.dataLayer` and emits recommended Google Analytics events. Before a real measurement ID is connected, every event is visible in **Analytics Lab**, so the implementation can be tested without polluting a production property.

Official references:

- [GA4 ecommerce measurement](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [Recommended events reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Google Tag Manager data layer](https://developers.google.com/tag-platform/tag-manager/datalayer)
- [Consent Mode setup](https://developers.google.com/tag-platform/security/guides/consent)
- [GA4 ecommerce validation](https://developers.google.com/analytics/devguides/collection/ga4/validate-ecommerce)

## 1. Architecture

```text
UI action
  → MASTERCHIL_ANALYTICS.track(event, params, { ecommerce })
    → window.dataLayer.push({ event, ...params, ecommerce })
    → Analytics Lab (local validation)
    → GTM container → Google tag / GA4 Event tag

or

    → direct gtag('event', event, params)
```

Before every ecommerce push, `js/analytics.js` clears the previous ecommerce state with `{ ecommerce: null }`. This prevents the previous event's `items` array from leaking into the next event.

## 2. Recommended installation with GTM

### 2.1 Prepare GA4

1. Create a GA4 property and a Web data stream.
2. Copy the Measurement ID in the `G-XXXXXXXXXX` format.
3. Enable GTM in `js/config.js` and provide the Container ID.
4. Keep direct GA4 disabled.

### 2.2 Create the base Google tag in GTM

1. Create a **Google tag**.
2. Enter the GA4 Measurement ID.
3. Set the trigger to **Initialization — All Pages**.
4. Save the tag.

Consent defaults are set in `analytics.js` before the container loads:

```js
analytics_storage: "denied"
ad_storage: "denied"
ad_user_data: "denied"
ad_personalization: "denied"
functionality_storage: "granted"
security_storage: "granted"
```

After the visitor makes a choice, the code runs `gtag('consent', 'update', ...)` and pushes `consent_update` to the data layer.

### 2.3 Create the ecommerce event tag

1. Use a **Custom Event** trigger.
2. Set the event name to this regular expression:

```regex
^(view_item_list|select_item|view_item|add_to_cart|view_cart|remove_from_cart|begin_checkout|add_shipping_info|add_payment_info|purchase|add_to_wishlist|view_promotion|select_promotion)$
```

3. In the GA4 Event tag, use the built-in data-layer event name: `{{Event}}`.
4. Enable ecommerce data from the `dataLayer` if that option exists in your tag version. Otherwise, create a Data Layer Variable named `ecommerce` and send it as an event parameter.
5. Connect the event tag to the Google tag created in the previous step.

For non-ecommerce events, create a second GA4 Event tag with this Custom Event trigger:

```regex
^(login|sign_up|search|generate_lead|filter_products|sort_products|select_item_variant|remove_from_wishlist|video_start|video_progress|video_pause|password_reset_request)$
```

Use `{{Event}}` as the Event Name. Add Data Layer Variables only for the parameters needed in reports.

### 2.4 User properties

After demo sign-in, the storefront emits `user_context`:

```js
{
  event: "user_context",
  user_id: "masterchil_...",
  user_properties: {
    customer_type: "demo_member"
  }
}
```

Create a `user_context` Custom Event trigger and a tag that updates the user ID and user properties. Email, name, phone number, and address are never added to the data layer.

## 3. Direct GA4 installation

Enable `analytics.ga4.enabled`, add the Measurement ID, and disable GTM. The script automatically:

1. sets the consent defaults;
2. loads `gtag.js` asynchronously;
3. runs `gtag('config', measurementId)`;
4. forwards every internal analytics event to `gtag('event', ...)`.

Temporarily set `debugMode: true` for DebugView. Return it to `false` before production release.

## 4. Event map

| Stage | Event | Trigger | Main parameters |
|---|---|---|---|
| Catalog | `view_item_list` | render, filter, or sort | `item_list_id`, `item_list_name`, `items`, `filter`, `sort` |
| Catalog | `select_item` | product-card click | `item_list_id`, `items` |
| Product | `view_item` | quick view opens | `currency`, `value`, `items`, `source` |
| Product | `select_item_variant` | color changes | `item_id`, `color` |
| Wishlist | `add_to_wishlist` | favorite added | `currency`, `value`, `items` |
| Cart | `add_to_cart` | item added or quantity increased | `currency`, `value`, `items`, `source` |
| Cart | `view_cart` | cart opens | `currency`, `value`, `items` |
| Cart | `remove_from_cart` | item removed or quantity decreased | `currency`, `value`, `items`, `source` |
| Promotion | `select_promotion` | banner or `MASTER10` | `promotion_id`, `promotion_name` |
| Checkout | `begin_checkout` | checkout begins | `currency`, `value`, `coupon`, `items` |
| Checkout | `add_shipping_info` | contact step completes | `shipping_tier`, `items` |
| Checkout | `add_payment_info` | delivery step completes | `payment_type`, `shipping_tier`, `items` |
| Revenue | `purchase` | demo order succeeds | `transaction_id`, `value`, `shipping`, `currency`, `coupon`, `items` |
| Account | `login` | demo sign-in | `method` |
| Account | `sign_up` | demo registration | `method` |
| Discovery | `search` | search submit or suggestion | `search_term`, `source` |
| Lead | `generate_lead` | newsletter form | `form_name`, `value`, `currency` |
| Content | `video_start`, `video_progress`, `video_pause` | brand story | `video_title`, `video_percent` |
| Consent | `consent_update` | cookie choice | `consent_level` and consent flags |

Every object in `items` includes a stable `item_id`, `item_name`, `item_brand`, `item_category`, list metadata, `price`, and `quantity`.

## 5. Add tracked elements

For a simple click without changing JavaScript:

```html
<button
  data-analytics-event="select_promotion"
  data-analytics-params='{"promotion_id":"summer","promotion_name":"Summer 2026"}'>
  View offer
</button>
```

For a more complex interaction, use the unified API:

```js
window.MASTERCHIL_ANALYTICS.track("share", {
  method: "telegram",
  content_type: "product",
  item_id: "orbit-one"
});
```

Ecommerce example:

```js
window.MASTERCHIL_ANALYTICS.track("refund", {}, {
  ecommerce: {
    transaction_id: "MC-12345678",
    currency: "EUR",
    value: 329,
    items: [{ item_id: "orbit-one", item_name: "Orbit One", price: 329, quantity: 1 }]
  }
});
```

## 6. Pre-release validation

1. Open the storefront with `?debug_analytics=1`.
2. Complete the catalog → product → cart → checkout → purchase journey.
3. Confirm the event order in Analytics Lab and export the JSON.
4. Open GTM Preview / Tag Assistant and repeat the journey.
5. Confirm that every ecommerce event has a fresh `ecommerce.items` array.
6. Open **Admin → Data display → DebugView** in GA4.
7. Verify `currency: EUR`, a numeric `value`, and a unique `transaction_id`.
8. Confirm that the same event is not sent by both GTM and direct gtag.

Google recommends using exact recommended-event names, validating required parameters, and never reusing a `transaction_id`; a second purchase with the same ID can be deduplicated.

## 7. Custom definitions and reports

Do not register standard ecommerce parameters as custom dimensions. Useful Masterchil Store definitions include:

- event-scoped dimensions: `source`, `filter`, `sort`, `color`, `form_name`, `consent_level`;
- user-scoped dimension: `customer_type`;
- item-scoped dimensions for material, collection, or connection type in a production catalog.

Recommended Explorations:

1. `view_item_list → select_item → view_item → add_to_cart → begin_checkout → purchase`;
2. conversion rate by `item_list_name`, `source`, and device;
3. abandonment rate by checkout step;
4. `search_term → view_item → purchase`;
5. the effect of `MASTER10` on AOV and conversion rate.

## 8. Privacy and production

- Never send email, name, phone number, address, password, or full search queries containing PII to GA4.
- Never put secrets in `config.js`. GTM Container IDs and GA4 Measurement IDs are public; server keys are not.
- The consent banner is a demonstration, not legal advice. Align your CMP, storage categories, and privacy policy with the requirements of each operating region.
- Configure cross-domain measurement in the Google tag when using multiple domains.
- For production purchases, also send confirmation from the backend or implement deduplication around one stable `transaction_id`.
