# 📤 Как загрузить файлы на VPS

## Вариант 1: SCP (с локального ПК)

```bash
# Открой терминал (PowerShell/CMD) и выполни:
scp -r ./server root@144.31.85.158:/var/www/petfriends/
```

## Вариант 2: Git clone на VPS (проще!)

### На VPS выполни:
```bash
# 1. Подключись к VPS
ssh root@144.31.85.158

# 2. Клонируй репозиторий
cd /var/www
git clone https://github.com/codernatural/petfriends.git

# 3. Установи зависимости
cd petfriends/server
npm install

# 4. Запусти сервер
node index.js
```

## Вариант 3: GitHub → VPS

```bash
# На VPS:
cd /var/www
rm -rf petfriends  # если папка уже есть
git clone https://github.com/codernatural/petfriends.git
cd petfriends/server
npm install
node index.js
```

## Проверка работы сервера

После запуска открой в браузере:
```
http://144.31.85.158:3000/health
```

Должно показать:
```json
{"status":"ok","users":0,"pets":0}
```

## Фоновая работа (чтобы сервер не остановился)

```bash
npm install -g pm2
pm2 start index.js --name petfriends
pm2 save
pm2 startup  # автозапуск после перезагрузки
```

## Команды управления

```bash
pm2 status      # статус
pm2 logs        # логи
pm2 restart      # перезапуск
pm2 stop         # остановка
```
