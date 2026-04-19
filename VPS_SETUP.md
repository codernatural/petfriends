# 🚀 Установка PetFriends на VPS 144.31.85.158

## Шаг 1: Создай папку на VPS

```bash
ssh root@144.31.85.158
mkdir -p /var/www/petfriends
```

## Шаг 2: Загрузи файлы

### Вариант A: Git clone (рекомендуется)
```bash
cd /var/www/petfriends
git clone https://github.com/codernatural/petfriends.git .
```

### Вариант B: SCP с локального ПК
```bash
# Сначала создай папку на VPS:
ssh root@144.31.85.158 "mkdir -p /var/www/petfriends"
exit

# Затем копируй:
scp -r ./server root@144.31.85.158:/var/www/petfriends/
```

## Шаг 3: Установи зависимости

```bash
cd /var/www/petfriends/server
npm install
```

## Шаг 4: Запусти сервер

```bash
node index.js
```

## Шаг 5: Проверь

Открой в браузере:
```
http://144.31.85.158:3000/health
```

Ответ должен быть:
```json
{"status":"ok","users":0,"pets":0}
```

## Для ��остоянной работы (PM2)

```bash
npm install -g pm2
pm2 start index.js --name petfriends
pm2 save
pm2 startup
```

## Проверка через Telegram Mini App

После запуска сервера добавь IP в `js/api.js`:
```javascript
baseUrl: 'http://144.31.85.158:3000'
```

И открой приложение — оно автоматически подключится к серверу!