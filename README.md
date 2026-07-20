# Masterchil Store

Готовый статический e-commerce сайт для GitHub Pages: премиальный адаптивный интерфейс, локальные изображения, каталог, поиск, избранное, корзина, промокод, demo checkout, demo-авторизация и полноценный слой событий GA4/GTM.

Витрина локализована на английском для рынка Германии: валюта EUR, цены с VAT, немецкий телефонный формат и бесплатная доставка от €200.

## Быстрый запуск

Сборка и зависимости не нужны. Можно дважды щёлкнуть `index.html` или запустить локальный сервер:

```bash
python -m http.server 4173
```

После этого откройте `http://localhost:4173`.

Промокод для проверки: `MASTER10`. Для открытия панели событий добавьте к URL `?debug_analytics=1` или нажмите **Analytics Lab** в футере.

## Что работает

- адаптивный каталог с фильтрами и сортировкой;
- поиск по названию, категории и описанию;
- быстрый просмотр и выбор варианта товара;
- избранное и корзина с сохранением в `localStorage`;
- расчёт доставки, скидки и итоговой суммы;
- трёхшаговый demo checkout и событие `purchase`;
- регистрация и вход в демонстрационном режиме;
- Consent Mode v2 с выбором «все» / «только необходимые»;
- dataLayer и рекомендованные ecommerce-события GA4;
- встроенная Analytics Lab с просмотром и экспортом JSON;
- анимации, параллакс, reveal, marquee, hover spotlight и reduced-motion режим;
- локальные оптимизированные WebP-изображения без внешних CDN.

## Публикация на GitHub Pages

Содержимое этой папки можно положить в корень отдельного репозитория:

```bash
git init
git add .
git commit -m "Launch Masterchil Store"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

В репозитории откройте **Settings → Pages → Build and deployment**, выберите **Deploy from a branch**, затем ветку `main`, папку `/(root)` и сохраните. Это соответствует актуальному способу публикации из ветки в [официальной документации GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Все пути относительные, поэтому сайт работает как на домене вида `username.github.io`, так и в подпапке `username.github.io/repository/`. Файл `.nojekyll` уже добавлен.

## Подключение аналитики

Откройте `js/config.js`, выберите один способ и включите только его:

### Рекомендуется: Google Tag Manager

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

### Альтернатива: GA4 напрямую

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

Не включайте GTM и прямой GA4 одновременно: это создаст двойные события. Полная карта тегов, параметров, воронок и QA находится в [ANALYTICS.md](ANALYTICS.md).

## Авторизация и оплата

Сайт рассчитан на статический хостинг. Поэтому текущие регистрация, вход и checkout — безопасные демонстрационные сценарии:

- пароль не сохраняется;
- профиль и корзина остаются только в браузере пользователя;
- реквизиты карты не запрашиваются;
- заказ создаётся локально и не вызывает списание.

Для production замените обработчик `#auth-form` в `js/app.js` на Firebase Auth, Supabase Auth, Auth0 или собственный API. Заказ и платёж необходимо создавать только на доверенном backend; секретные ключи нельзя размещать в репозитории или клиентском JavaScript.

## Структура

```text
masterchil-store/
├── index.html          # семантика и все UI-сценарии
├── styles.css          # дизайн, адаптивность и анимации
├── js/
│   ├── config.js       # GA4/GTM и параметры магазина
│   ├── analytics.js    # consent, dataLayer и единый API событий
│   └── app.js          # каталог, корзина, auth, checkout и UI
├── assets/             # локальные WebP и favicon
├── ANALYTICS.md        # подробная схема внедрения GA4/GTM
└── .nojekyll           # публикация без обработки Jekyll
```

## Контент перед запуском

Перед реальным запуском замените демонстрационные цены, контакты, ссылки соцсетей, условия доставки/возврата, privacy policy и юридические данные продавца. Также подключите backend для остатков, заказов, аккаунтов и оплаты.
