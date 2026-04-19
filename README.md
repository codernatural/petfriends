# 🐾 PetFriends - Telegram Mini App

Аналог Widgetable для Telegram с совместным выращиванием питомцев.

## 🚀 Быстрый старт

### Вариант 1: Локальная версия (без сервера)

Открой `index.html` в браузере — работает полностью автономно через LocalStorage.

### Вариант 2: С сервером (полный функционал)

```bash
# 1. Перейди в папку сервера
cd server

# 2. Установи зависимости
npm install

# 3. Настрой .env
cp .env.example .env
# Отредактируй .env, добавив TELEGRAM_BOT_TOKEN от @BotFather

# 4. Запусти сервер
npm start

# 5. В другом терминале - запусти frontend
# (нужен локальный веб-сервер для Telegram)
npx serve .
```

## 📱 Telegram Mini App

### Настройка бота

1. Открой **@BotFather** в Telegram
2. Создай Mini App: `/new miniapps`
3. Скопируй **URL Mini App** (например, `https://your-server.com`)
4. Укажи URL в настройках Mini App

### Развёртывание на GitHub Pages (только frontend)

```bash
git init
git add .
git commit -m "PetFriends"
git remote add origin https://github.com/USERNAME/petfriends.git
git push -u origin main
```

Затем: Settings → GitHub Pages → Source: main branch

## 🎮 Функционал

- 🐾 **Питомцы**: 8 видов, 3 характера, уровни, эволюция
- 👥 **Совместное выращивание**: приглашай друзей ухаживать за питомцем вместе
- 🎰 **Колесо удачи**: ежедневные награды
- 📋 **Квесты**: зарабатывай монеты
- 🎮 **Мини-игры**: Викторина, Реакция
- 🔥 **Серия заходов**: бонус за ежедневные посещения
- ⏱️ **Кулдауны**: баланс геймплея

## 🔧 Структура проекта

```
petfriends/
├── index.html          # Главная страница
├── styles/
│   └── main.css        # Стили
├── js/
│   ├── app.js         # Точка входа
│   ├── ui.js          # UI компоненты
│   ├── pet.js         # Логика питомцев
│   ├── storage.js     # Хранение данных
│   └── telegram.js     # Telegram API
├── server/
│   ├── index.js       # Express API сервер
│   ├── package.json
│   ├── .env.example
│   └── db.json        # Схема базы данных
└── db.json            # Схема БД
```

## 🌐 API Endpoints

### Авторизация
- `POST /api/auth` — Автовход через Telegram (initData)
- `GET /api/user` — Данные пользователя

### Питомцы
- `GET /api/pets` — Все питомцы пользователя
- `GET /api/pets/shared` — Совместные питомцы
- `POST /api/pets` — Создать питомца
- `PUT /api/pets/:id` — Действие с питомцем (feed/play/care)
- `POST /api/pets/:id/invite` — Пригласить друга
- `POST /api/pets/join` — Присоединиться к питомцу

### Прочее
- `GET /api/inventory` — Инвентарь
- `GET /api/quests` — Квесты
- `POST /api/wheel/spin` — Крутить колесо
- `GET /api/events` — События

## 👥 Совместное выращивание

1. Создай питомца
2. Нажми "Пригласить друга"
3. Скопируй код приглашения
4. Друг вводит код и становится совладельцем
5. Оба могут кормить, играть и ухаживать за питомцем!

## 📦 Для разработки

```bash
# Frontend
npx serve .

# Backend
cd server
npm install
cp .env.example .env
# Добавь TELEGRAM_BOT_TOKEN
npm start
```

## ⚠️ Важно

- Telegram Mini App требует **HTTPS**
- Для авторизации нужен **Bot Token** от @BotFather
- В проде использовать **MongoDB** вместо in-memory хранилища

## 📄 Лицензия

MIT
