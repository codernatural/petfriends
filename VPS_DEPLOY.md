# 🚀 Deploy PetFriends на VPS 144.31.85.158

## Шаг 1: Загрузи файлы на VPS

```bash
# На VPS создай папку и клонируй репозиторий
mkdir -p /var/www/petfriends
cd /var/www/petfriends

# Или скопируй файлы через scp (с локального компьютера)
scp -r ./server user@144.31.85.158:/var/www/petfriends/
```

## Шаг 2: Установи зависимости на VPS

```bash
cd /var/www/petfriends/server
npm install
```

## Шаг 3: Настройка .env

```bash
nano /var/www/petfriends/server/.env
```

Добавь:
```
PORT=3000
JWT_SECRET=your-secret-key-change-me
```

## Шаг 4: Запуск сервера

```bash
# Тест
node index.js

# Фоновое выполнение (pm2)
npm install -g pm2
pm2 start index.js --name petfriends

# Автозапуск после перезагрузки
pm2 startup
pm2 save
```

## Шаг 5: Проверка

Открой в браузере:
- http://144.31.85.158:3000/health

Должно показать:
```json
{"status":"ok","users":0,"pets":0}
```

## Шаг 6: Настройка Nginx (опционально для HTTPS)

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/petfriends
```

```nginx
server {
    listen 80;
    server_name 144.31.85.158;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/petfriends /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Теперь обнови frontend

В `js/api.js` измени URL если используешь nginx:
```javascript
baseUrl: 'http://144.31.85.158',  // без порта если nginx
```

---

## Команды управления

```bash
# Статус
pm2 status

# Логи
pm2 logs petfriends

# Перезапуск
pm2 restart petfriends

# Остановка
pm2 stop petfriends
```

## Проверка совместных питомцев

1. Запусти сервер
2. Открой приложение
3. Создай питомца
4. Нажми "Пригласить друга"
5. Скопируй код
6. Другой пользователь вводит код в "Присоединиться"
7. Оба видят совместного питомца!