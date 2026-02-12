# LoyalX - Децентрализованная система лояльности на TON

LoyalX - это кросс-продуктовая on-chain система лояльности, построенная на блокчейне TON. Позволяет брендам создавать свои токены лояльности (Jettons TEP-74) и пользователям обменивать их между собой.

## 🏗️ Архитектура проекта

```
LoyalX/
├── Contracts/          # Смарт-контракты на Tact
│   ├── contracts/      # Исходники контрактов
│   ├── tests/          # Тесты на TypeScript + Sandbox
│   └── wrappers/       # TypeScript обёртки (генерируются)
├── tgapp/             # Frontend на React + Vite
│   └── src/
│       ├── screens/   # Экраны приложения
│       ├── components/# React компоненты
│       └── hooks/     # Custom hooks
└── Documentation/     # Техническое задание
```

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- npm или yarn
- TON кошелёк (для testnet)

### Установка

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd LoyalX
```

2. **Установите зависимости для контрактов:**
```bash
cd Contracts
npm install
```

3. **Установите зависимости для frontend:**
```bash
cd ../tgapp
npm install
```

## 📦 Смарт-контракты

### Компиляция

```bash
cd Contracts
npm run build
```

Это скомпилирует все контракты и создаст TypeScript обёртки в `wrappers/`.

### Тестирование

```bash
npm test
```

Тесты запускаются в Sandbox (локальный блокчейн) без необходимости деплоя в testnet.

### Структура контрактов

- **Factory** - фабрика для создания новых брендов
- **BrandJetton** - контракт бренда (Jetton Master)
- **JettonWallet** - кошелёк пользователя для конкретного бренда

### Деплой в testnet

```bash
npx blueprint run deployFactory
```

⚠️ **Важно:** Для деплоя нужны testnet TON. Получите их в [TON Testnet Faucet](https://testnet.tonscan.org/faucet).

## 🎨 Frontend

### Разработка

```bash
cd tgapp
npm run dev
```

Приложение откроется на `http://localhost:5173`

### Сборка для production

```bash
npm run build
```

Результат будет в `tgapp/dist/`

### Деплой на GitHub Pages

1. Создайте репозиторий на GitHub
2. Настройте GitHub Pages в настройках репозитория
3. Push код в main ветку
4. GitHub Actions автоматически задеплоит приложение

## 🔧 Конфигурация

### TON Connect

Для работы TON Connect нужен manifest файл. Создайте `public/tonconnect-manifest.json`:

```json
{
  "url": "https://your-domain.com",
  "name": "LoyalX",
  "iconUrl": "https://your-domain.com/icon.png"
}
```

### Environment Variables

Создайте `.env` в папке `tgapp/`:

```env
VITE_TON_API_KEY=your_toncenter_api_key
```

## 📱 Telegram Mini App

### Создание бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Создайте нового бота: `/newbot`
3. Настройте Mini App: `/newapp`
4. Укажите URL вашего деплоя

### Настройка

В настройках бота укажите:
- **Web App URL:** `https://your-github-pages-url.github.io/LoyalX`
- **Short name:** `loyalx`

## 🧪 Тестирование

### Контракты

```bash
cd Contracts
npm test
```

### Frontend (TODO)

```bash
cd tgapp
npm test
```

## 📚 Документация

Подробное техническое задание находится в `Documentation/TechnicalTask.pdf`

### Основные функции

1. **Создание бренда** - любой пользователь может создать свой бренд и токен
2. **Минтинг токенов** - владелец бренда может выпускать токены пользователям
3. **Обмен токенов** - пользователи могут обменивать токены между брендами
4. **Просмотр балансов** - отображение всех токенов пользователя

## 🔐 Безопасность

- Контракты следуют стандарту TEP-74
- Все операции требуют подписи кошелька
- Только владелец бренда может минтить токены
- Курсы обмена устанавливаются владельцами брендов

## 🐛 Известные проблемы

- ⚠️ В Blueprint Sandbox есть проблема с чтением балансов jetton (init flag). В реальном testnet/mainnet всё работает корректно.

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## 📄 Лицензия

MIT

## 👥 Авторы

LoyalX Team

## 🔗 Полезные ссылки

- [TON Documentation](https://docs.ton.org/)
- [Tact Language](https://tact-lang.org/)
- [Blueprint](https://github.com/ton-org/blueprint)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/)
- [TEP-74 Jetton Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
