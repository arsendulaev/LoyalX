# 🚀 Быстрый старт - Оставшиеся шаги

## ✅ Что уже сделано:
- Frontend работает на http://localhost:5175
- Factory задеплоен: `EQBZD7FtOdEdXaNKm-19ydjyECueAnX6EnGfpJEVgx0C88L3`
- .env настроен
- TON Connect manifest создан

## 📋 Что осталось:

### ШАГ 1: Проверь что приложение работает (2 минуты)

1. Открой http://localhost:5175 в браузере
2. Должно появиться красивое приложение с:
   - Навигацией сверху (Кошелёк, Создать бренд, Обмен)
   - Кнопкой "Connect Wallet"
   - Градиентным фоном

**Если видишь белый экран:**
- Нажми Ctrl+Shift+R для полной перезагрузки
- Проверь консоль (F12) - не должно быть ошибок

---

### ШАГ 2: Протестируй подключение кошелька (5 минут)

**Если у тебя есть Tonkeeper (testnet):**
1. Нажми "Connect Wallet"
2. Выбери Tonkeeper
3. Отсканируй QR код
4. Подтверди подключение
5. Твой адрес должен отобразиться на экране "Кошелёк"

**Если нет кошелька:**
- Можешь пропустить этот шаг
- Приложение всё равно работает, просто без подключения

---

### ШАГ 3: Создай GitHub репозиторий (5 минут)

```bash
# 1. Перейди на https://github.com/new
# Создай репозиторий:
# - Название: LoyalX
# - Public (для бесплатного GitHub Pages)
# - НЕ добавляй README, .gitignore (у нас уже есть)

# 2. Подключи remote и запуши код
cd /home/arsen/LoyalX

git add .
git commit -m "Initial commit: LoyalX loyalty system"

# Замени YOUR_USERNAME на твой GitHub username
git remote add origin https://github.com/YOUR_USERNAME/LoyalX.git
git push -u origin main
```

---

### ШАГ 4: Настрой GitHub Pages (5 минут)

**4.1. Включи Pages:**
1. Открой репозиторий на GitHub
2. Settings → Pages
3. **Source:** выбери "GitHub Actions" (НЕ "Deploy from a branch"!)

**4.2. Добавь Secrets:**
1. Settings → Secrets and variables → Actions
2. New repository secret

Добавь:
```
Name: VITE_FACTORY_ADDRESS
Value: EQBZD7FtOdEdXaNKm-19ydjyECueAnX6EnGfpJEVgx0C88L3
```

**4.3. Обнови manifest для production:**

Замени в `tgapp/public/tonconnect-manifest.json`:
```json
{
  "url": "https://YOUR_USERNAME.github.io/LoyalX/",
  "name": "LoyalX",
  "iconUrl": "https://YOUR_USERNAME.github.io/LoyalX/vite.svg",
  "termsOfUseUrl": "https://ton.org/terms",
  "privacyPolicyUrl": "https://ton.org/privacy"
}
```

И в `tgapp/src/App.tsx` строку 8:
```typescript
const manifestUrl = 'https://YOUR_USERNAME.github.io/LoyalX/tonconnect-manifest.json';
```

Потом:
```bash
git add .
git commit -m "Configure for GitHub Pages"
git push
```

**4.4. Дождись деплоя:**
- Actions → Deploy to GitHub Pages
- Подожди ~2 минуты
- Приложение будет на: `https://YOUR_USERNAME.github.io/LoyalX/`

---

### ШАГ 5: Создай Telegram бота (10 минут)

**5.1. Создай бота:**
1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. Отправь: `/newbot`
3. Имя: `LoyalX Bot`
4. Username: `loyalx_YOUR_NAME_bot` (должен быть уникальным)
5. Сохрани токен

**5.2. Создай Mini App:**
1. В BotFather: `/newapp`
2. Выбери своего бота
3. Название: `LoyalX`
4. Описание: `Decentralized loyalty system on TON blockchain`
5. Загрузи иконку 512x512 (можешь использовать любую)
6. **Web App URL:** `https://YOUR_USERNAME.github.io/LoyalX/`
7. Short name: `loyalx`

**5.3. Протестируй:**
1. Открой бота в Telegram
2. Нажми кнопку меню (внизу)
3. Выбери "LoyalX"
4. Приложение откроется в Telegram!

---

## 🎉 Готово!

После всех шагов у тебя будет:
- ✅ Работающее приложение локально
- ✅ Приложение на GitHub Pages
- ✅ Telegram Mini App

## 🐛 Возможные проблемы:

### GitHub Pages показывает 404
- Проверь что Pages включен (Settings → Pages)
- Проверь что выбран "GitHub Actions" (не branch)
- Подожди 2-3 минуты после деплоя
- Проверь Actions - деплой должен быть зелёным

### TON Connect не работает
- Проверь что manifest URL правильный
- Проверь что используешь testnet кошелёк
- Попробуй очистить кеш браузера

### Приложение не открывается в Telegram
- Проверь что URL в BotFather правильный
- Проверь что приложение работает в обычном браузере
- Попробуй пересоздать Mini App

---

## 📞 Что дальше?

После успешного запуска можно:
1. **Интегрировать контракты** - подключить реальные вызовы Factory
2. **Добавить функционал минта** - владельцы брендов смогут выпускать токены
3. **Реализовать обмен** - пользователи смогут менять токены
4. **Деплой в mainnet** - когда всё протестировано

---

## 💡 Полезные команды:

```bash
# Локальная разработка
cd tgapp && npm run dev

# Сборка для production
cd tgapp && npm run build

# Тесты контрактов
cd Contracts && npm test

# Деплой нового контракта
cd Contracts && npx blueprint run
```

---

Удачи! 🚀
