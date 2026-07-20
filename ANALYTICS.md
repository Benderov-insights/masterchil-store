# GA4 / GTM: карта внедрения Masterchil Store

Сайт уже формирует `window.dataLayer` и отправляет рекомендованные Google Analytics события. До подключения реального ID они видны в **Analytics Lab**, поэтому схему можно проверить без загрязнения production-property.

Официальные опорные материалы:

- [GA4 ecommerce measurement](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [Recommended events reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Google Tag Manager data layer](https://developers.google.com/tag-platform/tag-manager/datalayer)
- [Consent Mode setup](https://developers.google.com/tag-platform/security/guides/consent)
- [GA4 ecommerce validation](https://developers.google.com/analytics/devguides/collection/ga4/validate-ecommerce)

## 1. Архитектура

```text
UI action
  → MASTERCHIL_ANALYTICS.track(event, params, { ecommerce })
    → window.dataLayer.push({ event, ...params, ecommerce })
    → Analytics Lab (локальная проверка)
    → GTM container → Google tag / GA4 Event tag

или

    → direct gtag('event', event, params)
```

`js/analytics.js` также очищает предыдущее ecommerce-состояние через `{ ecommerce: null }` перед каждым новым ecommerce push. Это предотвращает перенос массива `items` из прошлого события.

## 2. Рекомендуемая установка через GTM

### 2.1. Подготовьте GA4

1. Создайте GA4 property и Web data stream.
2. Скопируйте Measurement ID формата `G-XXXXXXXXXX`.
3. В `js/config.js` включите GTM и укажите Container ID.
4. Оставьте прямой GA4 выключенным.

### 2.2. Создайте базовый Google tag в GTM

1. Создайте тег **Google tag**.
2. Укажите GA4 Measurement ID.
3. Trigger: **Initialization — All Pages**.
4. Сохраните.

Consent defaults выполняются в `analytics.js` до загрузки контейнера. По умолчанию:

```js
analytics_storage: "denied"
ad_storage: "denied"
ad_user_data: "denied"
ad_personalization: "denied"
functionality_storage: "granted"
security_storage: "granted"
```

После выбора пользователя код выполняет `gtag('consent', 'update', ...)` и создаёт `consent_update` в dataLayer.

### 2.3. Создайте ecommerce tag

1. Trigger type: **Custom Event**.
2. Event name, regular expression:

```regex
^(view_item_list|select_item|view_item|add_to_cart|view_cart|remove_from_cart|begin_checkout|add_shipping_info|add_payment_info|purchase|add_to_wishlist|view_promotion|select_promotion)$
```

3. В GA4 Event tag используйте имя встроенного события dataLayer: `{{Event}}`.
4. Включите отправку ecommerce data из `dataLayer` (если эта настройка доступна в вашей версии тега). Если нет, создайте Data Layer Variable `ecommerce` и передайте её как параметр события.
5. Привяжите тег к Google tag из предыдущего шага.

Для прочих событий создайте второй GA4 Event tag и Custom Event trigger:

```regex
^(login|sign_up|search|generate_lead|filter_products|sort_products|select_item_variant|remove_from_wishlist|video_start|video_progress|video_pause|password_reset_request)$
```

Event Name: `{{Event}}`. Параметры можно передать отдельными Data Layer Variables только для тех полей, которые нужны в отчётах.

### 2.4. User properties

После demo-входа появляется событие `user_context`:

```js
{
  event: "user_context",
  user_id: "masterchil_...",
  user_properties: {
    customer_type: "demo_member"
  }
}
```

Создайте Custom Event trigger `user_context` и тег, который обновляет user ID / user properties. Email, имя, телефон и адрес в dataLayer не отправляются.

## 3. Установка GA4 напрямую

Включите `analytics.ga4.enabled`, укажите Measurement ID и выключите GTM. Скрипт автоматически:

1. задаст consent defaults;
2. асинхронно подключит `gtag.js`;
3. выполнит `gtag('config', measurementId)`;
4. продублирует каждое событие из внутреннего API в `gtag('event', ...)`.

Для DebugView временно установите `debugMode: true`. Перед production-релизом верните `false`.

## 4. Карта событий

| Этап | Событие | Точка отправки | Основные параметры |
|---|---|---|---|
| Каталог | `view_item_list` | рендер / фильтр / сортировка | `item_list_id`, `item_list_name`, `items`, `filter`, `sort` |
| Каталог | `select_item` | клик по карточке | `item_list_id`, `items` |
| PDP | `view_item` | открытие quick view | `currency`, `value`, `items`, `source` |
| PDP | `select_item_variant` | смена цвета | `item_id`, `color` |
| Wishlist | `add_to_wishlist` | добавление в избранное | `currency`, `value`, `items` |
| Cart | `add_to_cart` | добавление / +1 | `currency`, `value`, `items`, `source` |
| Cart | `view_cart` | открытие корзины | `currency`, `value`, `items` |
| Cart | `remove_from_cart` | удаление / −1 | `currency`, `value`, `items`, `source` |
| Promo | `select_promotion` | баннер / `MASTER10` | `promotion_id`, `promotion_name` |
| Checkout | `begin_checkout` | начало оформления | `currency`, `value`, `coupon`, `items` |
| Checkout | `add_shipping_info` | завершение контактов | `shipping_tier`, `items` |
| Checkout | `add_payment_info` | завершение доставки | `payment_type`, `shipping_tier`, `items` |
| Revenue | `purchase` | успешный demo-заказ | `transaction_id`, `value`, `shipping`, `currency`, `coupon`, `items` |
| Account | `login` | demo-вход | `method` |
| Account | `sign_up` | demo-регистрация | `method` |
| Discovery | `search` | отправка поиска / подсказка | `search_term`, `source` |
| Lead | `generate_lead` | newsletter | `form_name`, `value`, `currency` |
| Content | `video_start`, `video_progress`, `video_pause` | brand story | `video_title`, `video_percent` |
| Consent | `consent_update` | выбор cookie | `consent_level` и consent flags |

Каждый объект в `items` содержит стабильный `item_id`, `item_name`, `item_brand`, `item_category`, list metadata, `price` и `quantity`.

## 5. Добавление новых отслеживаемых элементов

Для простого клика без правки JavaScript:

```html
<button
  data-analytics-event="select_promotion"
  data-analytics-params='{"promotion_id":"summer","promotion_name":"Summer 2026"}'>
  Смотреть предложение
</button>
```

Для сложного сценария используйте единый API:

```js
window.MASTERCHIL_ANALYTICS.track("share", {
  method: "telegram",
  content_type: "product",
  item_id: "orbit-one"
});
```

Ecommerce-вызов:

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

## 6. Проверка до публикации

1. Откройте сайт с `?debug_analytics=1`.
2. Пройдите цепочку: catalog → product → cart → checkout → purchase.
3. В Analytics Lab проверьте порядок событий и экспортируйте JSON.
4. В GTM откройте Preview / Tag Assistant и повторите цепочку.
5. Убедитесь, что на каждом ecommerce-событии новый `ecommerce.items`.
6. В GA4 откройте **Admin → Data display → DebugView**.
7. Проверьте `currency: EUR`, числовой `value` и уникальный `transaction_id`.
8. Убедитесь, что событие не отправляется одновременно из GTM и direct gtag.

Google отдельно рекомендует использовать точные имена рекомендованных событий, проверять обязательные параметры и избегать повторного `transaction_id`: повторная покупка с тем же ID будет дедуплицирована.

## 7. Пользовательские определения и отчёты

Не регистрируйте стандартные ecommerce-параметры как custom dimensions. Для анализа Masterchil Store имеет смысл создать:

- event-scoped dimensions: `source`, `filter`, `sort`, `color`, `form_name`, `consent_level`;
- user-scoped dimension: `customer_type`;
- при production-каталоге — item-scoped dimensions для материала, коллекции или типа подключения.

Полезные Explorations:

1. `view_item_list → select_item → view_item → add_to_cart → begin_checkout → purchase`;
2. сравнение conversion rate по `item_list_name`, `source` и устройству;
3. abandon rate по шагам checkout;
4. поиск: `search_term → view_item → purchase`;
5. влияние промо `MASTER10` на AOV и conversion rate.

## 8. Privacy и production

- Не отправляйте в GA4 email, имя, телефон, адрес, пароль или полный search query с PII.
- Не помещайте секреты в `config.js`: GTM Container ID и GA4 Measurement ID публичны, серверные ключи — нет.
- Текст баннера является демонстрационным, а не юридической консультацией. Согласуйте CMP, категории хранения и privacy policy с требованиями ваших регионов.
- Для нескольких доменов настройте cross-domain measurement в Google tag.
- Для production purchase отправляйте подтверждение также с backend или используйте стратегию дедупликации по одному стабильному `transaction_id`.
