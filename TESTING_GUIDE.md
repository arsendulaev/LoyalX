# 🧪 Руководство по тестированию и запуску LoyalX

## 📋 Текущий статус

✅ **Готово:**
- Смарт-контракты написаны и протестированы
- Frontend создан с базовым UI
- GitHub Actions настроен
- Документация написана

⏳ **Осталось:**
- Интеграция контрактов с frontend
- Деплой Factory в testnet
- Настройка GitHub Pages
- Создание Telegram бота

---

## 🎯 План тестирования (пошагово)

### ШАГ 1: Локальное тестирование Frontend (5 минут)

**Цель:** Убедиться что приложение запускается и UI работает

```bash
# 1. Перейти в папку frontend
cd tgapp

# 2. Запустить dev сервер
npm run dev

# 3. Открыть браузер
# Приложение откроется на http://localhost:5173
```

**Что проверить:**
- ✅ Приложение загружается без ошибок
- ✅ Навигация работает (Кошелёк, Создать бренд, Обмен)
- ✅ Кнопка "Connect Wallet" отображается
- ✅ Дизайн выглядит нормально

**Ожидаемый результат:**
- Приложение работает
- TON Connect пока не подключается (нужен manifest)
- Формы отображаются, но не работают (нужна интеграция)

---

### ШАГ 2: Тестирование контрактов в Sandbox (2 минуты)

**Цель:** Проверить что контракты компилируются и тесты проходят

```bash
# 1. Перейти в папку контрактов
cd ../Contracts

# 2. Запустить тесты
npm test
```

**Ожидаемый результат:**
```
PASS tests/LoyalX.spec.ts
  LoyalX System Test
    ✓ should create brands, mint tokens and SWAP them
```

**Что это значит:**
- ✅ Контракты компилируются
- ✅ Factory создаёт бренды
- ✅ BrandJetton минтит токены
- ⚠️ Проверки балансов отключены (известная проблема Sandbox)

---

### ШАГ 3: Создание TON Testnet кошелька (10 минут)

**Цель:** Получить кошелёк для деплоя контрактов

**Вариант А: Tonkeeper (рекомендуется)**
1. Скачать [Tonkeeper](https://tonkeeper.com/)
2. Создать новый кошелёк
3. Переключиться на Testnet:
   - Настройки → Dev Menu → Switch to Testnet
4. Получить testnet TON:
   - Открыть https://testnet.tonscan.org/faucet
   - Вставить адрес кошелька
   - Получить ~5 TON

**Вариант Б: TON Wallet (браузерное расширение)**
1. Установить [TON Wallet extension](https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd)
2. Создать кошелёк
3. Переключиться на testnet
4. Получить TON через faucet

**Проверка:**
```bash
# В Tonkeeper или TON Wallet должно быть ~5 TON (testnet)
```

---

### ШАГ 4: Деплой Factory в Testnet (5 минут)

**Цель:** Задеплоить главный контракт Factory

```bash
# 1. Убедиться что контракты скомпилированы
cd Contracts
npm run build

# 2. Запустить скрипт деплоя
npx blueprint run deployFactory

# Выбрать:
# ? Choose network: testnet
# ? Choose wallet: tonkeeper (или другой)
```

**Процесс:**
1. Blueprint попросит подключить кошелёк
2. Откроется QR код или ссылка
3. Подтвердите транзакцию в кошельке (~0.05 TON)
4. Дождитесь деплоя

**Ожидаемый результат:**
```
✅ Factory deployed at: EQAbc123...xyz
📝 Сохраните этот адрес!
```

**ВАЖНО:** Скопируйте адрес Factory - он понадобится!

---

### ШАГ 5: Настройка Frontend для Testnet (3 минуты)

**Цель:** Подключить frontend к задеплоенному Factory

```bash
# 1. Создать .env файл
cd ../tgapp
nano .env  # или любой редактор
```

**Содержимое .env:**
```env
# Адрес Factory из предыдущего шага
VITE_FACTORY_ADDRESS=EQAbc123...xyz

# API ключ TON Center (опционально, для быстрой работы)
# Получить на https://toncenter.com/api/v2/
VITE_TON_API_KEY=your_api_key_here
```

**2. Создать TON Connect manifest:**
```bash
# Создать файл public/tonconnect-manifest.json
mkdir -p public
nano public/tonconnect-manifest.json
```

**Содержимое manifest:**
```json
{
  "url": "http://localhost:5173",
  "name": "LoyalX",
  "iconUrl": "http://localhost:5173/vite.svg",
  "termsOfUseUrl": "https://ton.org/terms",
  "privacyPolicyUrl": "https://ton.org/privacy"
}
```

**3. Перезапустить dev сервер:**
```bash
npm run dev
```

**Проверка:**
- Теперь кнопка "Connect Wallet" должна работать!
- Можно подключить Tonkeeper/TON Wallet

---

### ШАГ 6: Тестирование с подключенным кошельком (5 минут)

**Цель:** Проверить что TON Connect работает

1. Открыть http://localhost:5173
2. Нажать "Connect Wallet"
3. Отсканировать QR код в Tonkeeper (testnet!)
4. Подтвердить подключение

**Что проверить:**
- ✅ Кошелёк подключается
- ✅ Адрес отображается на экране "Кошелёк"
- ✅ Можно переходить между экранами
- ⚠️ Создание бренда и обмен пока не работают (нужна интеграция)

---

### ШАГ 7: Создание GitHub репозитория (5 минут)

**Цель:** Подготовить код для деплоя на GitHub Pages

```bash
# 1. Инициализировать git (если ещё не сделано)
cd /home/arsen/LoyalX
git init
git add .
git commit -m "Initial commit: LoyalX project"

# 2. Создать репозиторий на GitHub
# Открыть https://github.com/new
# Название: LoyalX
# Public или Private (для Pages нужен Public или Pro аккаунт)

# 3. Подключить remote
git remote add origin https://github.com/YOUR_USERNAME/LoyalX.git
git branch -M main
git push -u origin main
```

---

### ШАГ 8: Настройка GitHub Pages (5 минут)

**Цель:** Включить автоматический деплой

**1. Включить GitHub Pages:**
- Открыть репозиторий на GitHub
- Settings → Pages
- Source: GitHub Actions (не Deploy from branch!)

**2. Добавить Secrets:**
- Settings → Secrets and variables → Actions → New repository secret

Добавить:
```
Name: VITE_FACTORY_ADDRESS
Value: EQAbc123...xyz (адрес вашего Factory)

Name: VITE_TON_API_KEY
Value: ваш_api_ключ (опционально)
```

**3. Запустить деплой:**
```bash
# Любой push в main запустит деплой
git add .
git commit -m "Configure for production"
git push
```

**4. Дождаться деплоя:**
- Actions → Deploy to GitHub Pages
- Подождать ~2 минуты
- Приложение будет доступно на:
  `https://YOUR_USERNAME.github.io/LoyalX/`

---

### ШАГ 9: Обновление TON Connect manifest для production (3 минуты)

**Цель:** Настроить manifest для GitHub Pages URL

```bash
# Обновить tgapp/public/tonconnect-manifest.json
```

**Новое содержимое:**
```json
{
  "url": "https://YOUR_USERNAME.github.io/LoyalX/",
  "name": "LoyalX",
  "iconUrl": "https://YOUR_USERNAME.github.io/LoyalX/vite.svg",
  "termsOfUseUrl": "https://ton.org/terms",
  "privacyPolicyUrl": "https://ton.org/privacy"
}
```

```bash
# Закоммитить и запушить
git add tgapp/public/tonconnect-manifest.json
git commit -m "Update manifest for production"
git push
```

---

### ШАГ 10: Создание Telegram бота (10 минут)

**Цель:** Создать Mini App в Telegram

**1. Создать бота:**
- Открыть [@BotFather](https://t.me/BotFather) в Telegram
- Отправить `/newbot`
- Ввести имя: `LoyalX Bot`
- Ввести username: `loyalx_test_bot` (должен быть уникальным)
- Сохранить токен бота

**2. Создать Mini App:**
- В BotFather отправить `/newapp`
- Выбрать созданного бота
- Ввести название: `LoyalX`
- Ввести описание: `Decentralized loyalty system on TON`
- Загрузить иконку (512x512 px)
- Ввести Web App URL: `https://YOUR_USERNAME.github.io/LoyalX/`
- Ввести short name: `loyalx`

**3. Протестировать:**
- Открыть бота в Telegram
- Нажать на кнопку меню (внизу)
- Выбрать "LoyalX"
- Приложение откроется!

---

## 🎉 Финальная проверка

После всех шагов у вас должно быть:

✅ **Локально:**
- Frontend работает на http://localhost:5173
- Контракты тестируются успешно

✅ **В Testnet:**
- Factory задеплоен
- Можно подключить кошелёк

✅ **В Production:**
- Приложение на GitHub Pages
- Telegram Mini App работает

✅ **Что работает:**
- Подключение кошелька
- Навигация
- Отображение адреса

⚠️ **Что НЕ работает (нужна интеграция):**
- Создание бренда (кнопка есть, но не вызывает контракт)
- Обмен токенов (форма есть, но не работает)
- Отображение реальных балансов

---

## 🐛 Возможные проблемы

### Проблема 1: "Cannot find module"
```bash
cd tgapp
rm -rf node_modules package-lock.json
npm install
```

### Проблема 2: TON Connect не подключается
- Проверьте что используете testnet кошелёк
- Проверьте manifest.json
- Проверьте что URL в manifest совпадает с текущим

### Проблема 3: GitHub Pages показывает 404
- Проверьте что Pages включен
- Проверьте что деплой прошёл успешно (Actions)
- Подождите 2-3 минуты после деплоя

### Проблема 4: Деплой Factory не работает
- Проверьте баланс кошелька (нужно >0.1 TON)
- Проверьте что выбран testnet
- Попробуйте другой кошелёк (Tonkeeper рекомендуется)

---

## 📞 Следующие шаги

После успешного тестирования можно:
1. **Интегрировать контракты** - подключить реальные вызовы Factory и BrandJetton
2. **Добавить функционал** - минт токенов, обмен, отображение балансов
3. **Улучшить UI** - добавить анимации, лоадеры, уведомления
4. **Деплой в mainnet** - когда всё протестировано

---

## 💡 Советы

- **Всегда используйте testnet** для разработки
- **Сохраняйте адреса контрактов** - они понадобятся
- **Проверяйте транзакции** на https://testnet.tonscan.org
- **Не коммитьте .env** - он в .gitignore
- **Тестируйте в Telegram** - там может быть по-другому чем в браузере

---

Удачи! 🚀
