# 🐾 PetFriends - Telegram Mini App Deployment Guide

## Развёртывание на GitHub Pages + Telegram Mini App

### 1. Загрузи на GitHub

```bash
# Инициализируй git репозиторий
cd c:/Users/jijadev/Desktop/Claude/Widgetable
git init
git add .
git commit -m "PetFriends v2"

# Создай репозиторий на github.com → затем:
git remote add origin https://github.com/USERNAME/petfriends.git
git push -u origin main
```

### 2. Включи GitHub Pages

1. Открой репозиторий → **Settings**
2. Прокрути до **GitHub Pages**
3. **Source**: Deploy from a branch → **main** → **/ (root)**
4. Нажми **Save**

Через 2-3 минуты сайт появится на: `https://USERNAME.github.io/petfriends/`

---

## Telegram Mini App Setup

### 3. Создай Mini App в @BotFather

1. Открой **@BotFather** в Telegram
2. Отправь `/new miniapps`
3. Введи название: `PetFriends`
4. Введи username: `petfriends_xxx` (уникальный!)
5. **BotFather** выдаст URL, скопируй его

### 4. Укажи URL в настройках Mini App

1. Открой **@BotFather** → `/myapps`
2. Выбери свой Mini App
3. В поле **URL** укажи: `https://USERNAME.github.io/petfriends/`
4. Сохрани

---

## Как работает автовход

### В Telegram (Mini App)

При открытии через Telegram Mini App SDK автоматически передаёт:
- `initData` — зашифрованные данные пользователя
- `user.id`, `user.first_name`, `user.username`

Эти данные используются для **автоматической авторизации** без ввода пароля.

### В браузере (тестирование)

При открытии `index.html` напрямую в браузере:
- Работает автономно через **LocalStorage**
- Данные хранятся локально
- Можно тестировать без сервера

---

## Для полного функционала (опционально)

### Вариант A: Cloudflare Workers (бесплатно)

Создай Worker который будет:
1. Принимать `initData` от frontend
2. Верифицировать через Bot Token
3. Хранить данные в Cloudflare KV

### Вариант B: Firebase

1. Создай проект на [Firebase](https://console.firebase.google.com)
2. Включи **Firestore** и **Authentication**
3. Добавь Firebase SDK в frontend
4. Замени `storage.js` на Firebase API

### Вариант C: Supabase (бесплатно)

1. Создай проект на [Supabase](https://supabase.com)
2. Включи **Auth** и **PostgreSQL**
3. Добавь Supabase SDK
4. Используй Realtime для синхронизации питомцев

---

## Архитектура для GitHub Pages

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Mini App                        │
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │  PetFriends App  │────▶│  GitHub Pages (Static)      │   │
│  │  (index.html)    │     │  index.html + js + css      │   │
│  └─────────────────┘     └─────────────────────────────┘   │
│           │                                                    │
│           │ (опционально для синхронизации)                      │
│           ▼                                                    │
│  ┌─────────────────┐                                          │
│  │  API Server     │  ← Cloudflare Workers / Firebase /        │
│  │  (auth + data)  │    Supabase / Railway / etc.             │
│  └─────────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Тестирование локально

```bash
# Запусти локальный сервер
cd c:/Users/jijadev/Desktop/Claude/Widgetable
npx serve .

# Открой http://localhost:3000
```

Для Telegram WebApp используй **ngrok**:
```bash
ngrok http 3000
# Скопируй https URL → вставь в BotFather
```

---

## Что уже работает без сервера

✅ Создание питомцев (локально)
✅ Кормление, игры, уход
✅ Колесо удачи (ежедневное)
✅ Квесты и награды
✅ Мини-игры
✅ Серия заходов (streak)
✅ Все статистики и уровни
✅ Анимации и интерфейс

## Что требует сервер

🔒 Авторизация нескольких пользователей
👥 Совместные питомцы (синхронизация)
💾 Облачное сохранение прогресса
📊 Списки лидеров (future)

---

## Быстрый старт прямо сейчас

1. Загрузи на GitHub (команды выше)
2. Включи GitHub Pages
3. Создай Mini App в @BotFather
4. Укажи URL
5. Открой в Telegram — работает!

Для совместных питомцев добавь любой backend (Firebase/Supabase рекомендую).
