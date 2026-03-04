# 🎮 TicTacToe — Крестики-нолики

Полноценное веб-приложение: **Django REST API** (backend) + **Vite + React** (frontend).
Авторизация через **Telegram бот** с 6-значным кодом подтверждения.

---

## 📦 Структура проекта

```
tictactoe/
├── backend/       ← Django API
│   ├── tictactoe/ ← Настройки Django
│   ├── users/     ← Авторизация, Telegram
│   ├── game/      ← Логика игры
│   ├── manage.py
│   └── requirements.txt
├── frontend/      ← Vite + React
│   ├── src/
│   └── package.json
└── README.md
```

---

## 🚀 Запуск (локально)

### 1. Backend (Django)

```bash
cd backend

# Создать виртуальное окружение
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Установить зависимости
pip install -r requirements.txt

# Применить миграции (создаст базу данных SQLite)
python manage.py makemigrations users game
python manage.py migrate

# (опционально) Создать суперпользователя для /admin
python manage.py createsuperuser

# Запустить сервер
python manage.py runserver
# Сервер будет на http://localhost:8000
```

### 2. Frontend (Vite + React)

```bash
cd frontend

# Установить зависимости
npm install

# Запустить дев-сервер
npm run dev
# Сайт будет на http://localhost:3000
```

---

## 🤖 Настройка Telegram бота

### Получить свой Telegram ID
1. Напишите боту [@userinfobot](https://t.me/userinfobot) — он пришлёт ваш числовой ID
2. Напишите вашему боту команду `/start` — это **обязательно** перед регистрацией

### Создать бота (если нужен новый токен)
1. Напишите [@BotFather](https://t.me/BotFather)
2. Команда `/newbot`
3. Придумайте имя и username бота
4. Скопируйте токен в `backend/tictactoe/settings.py` → `TELEGRAM_BOT_TOKEN`

---

## 🗄 База данных

По умолчанию используется **SQLite** (`db.sqlite3`).

Для продакшена рекомендуется **PostgreSQL**:

```python
# backend/tictactoe/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'tictactoe_db',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

```bash
pip install psycopg2-binary
```

---

## 🌐 Деплой (продакшен)

### Backend
```bash
# Установить gunicorn
pip install gunicorn

# Запустить
gunicorn tictactoe.wsgi:application --bind 0.0.0.0:8000

# settings.py: DEBUG = False, SECRET_KEY из переменных окружения
```

### Frontend
```bash
npm run build
# Папка dist/ — статические файлы для nginx/apache
```

### Nginx конфиг (пример)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (статика)
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## ⚙ Переменные окружения (рекомендуется)

```bash
# backend/.env
SECRET_KEY=your-secret-key
TELEGRAM_BOT_TOKEN=your-bot-token
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
```

```python
# settings.py
import os
SECRET_KEY = os.environ.get('SECRET_KEY', 'fallback-key')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
```

---

## 🎮 Функционал

- ✅ Регистрация с Telegram кодом подтверждения
- ✅ Вход с Telegram 2FA
- ✅ Игра против AI (3 уровня: лёгкий/средний/сложный с Minimax)
- ✅ Мультиплеер через лобби (polling каждые 2 сек)
- ✅ Статистика игрока (победы/поражения/ничьи/win rate)
- ✅ Таблица лидеров
- ✅ Профиль пользователя
- ✅ Сессионная аутентификация

---

## ⚠ Важно

Токен Telegram бота был опубликован публично в чате. Рекомендуется:
1. Написать @BotFather команду `/revoke`
2. Получить новый токен
3. Обновить `TELEGRAM_BOT_TOKEN` в settings.py
