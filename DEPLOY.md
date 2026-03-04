# 🚀 Деплой на Railway (бесплатно)

Railway даёт $5 бесплатно в месяц — хватит для небольшого проекта.

---

## Шаг 1 — Подготовка

1. Зарегистрируйтесь на **https://railway.app** (через GitHub)
2. Установите Railway CLI (необязательно, можно через сайт)

---

## Шаг 2 — Загрузите код на GitHub

Создайте два репозитория (или один с папками backend/ и frontend/):

```bash
# В папке tictactoe/
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/ВАШ_ЛОГИН/tictactoe.git
git push -u origin main
```

---

## Шаг 3 — Деплой Backend на Railway

1. Зайдите на **railway.app** → **New Project** → **Deploy from GitHub repo**
2. Выберите ваш репозиторий
3. Railway спросит — укажите **Root Directory: `backend`**
4. В разделе **Variables** добавьте переменные:

| Переменная | Значение |
|---|---|
| `SECRET_KEY` | любая длинная случайная строка |
| `DEBUG` | `False` |
| `TELEGRAM_BOT_TOKEN` | ваш токен бота |
| `ALLOWED_HOSTS` | `*.railway.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://ВАШ-FRONTEND.railway.app` |

5. Railway автоматически запустит: `python manage.py migrate && gunicorn ...`
6. Скопируйте URL вашего backend, например: `https://tictactoe-backend.railway.app`

---

## Шаг 4 — Деплой Frontend на Railway

1. В том же проекте → **New Service** → **GitHub repo** → Root Directory: `frontend`
2. В разделе **Variables** добавьте:

| Переменная | Значение |
|---|---|
| `VITE_API_URL` | `https://tictactoe-backend.railway.app/api` |

3. После деплоя скопируйте URL frontend

---

## Шаг 5 — Обновите CSRF на backend

Вернитесь в Variables backend-сервиса и обновите:
```
CSRF_TRUSTED_ORIGINS = https://tictactoe-frontend.railway.app
```

Перезапустите сервис (Redeploy).

---

## ✅ Готово!

Ваш сайт доступен по адресу `https://tictactoe-frontend.railway.app`

---

## Альтернатива — Ngrok (быстро, временно)

Если просто хотите показать сайт другу прямо сейчас:

```bash
# 1. Скачайте ngrok: https://ngrok.com/download
# 2. Зарегистрируйтесь и получите токен

# Запустите backend
python manage.py runserver

# В другом терминале — frontend  
npm run dev

# В третьем терминале — ngrok на frontend
ngrok http 3000
```

Ngrok выдаст ссылку вида `https://abc123.ngrok.io` — отправьте другу.

**Важно:** в `backend/tictactoe/settings.py` добавьте ngrok URL:
```python
CSRF_TRUSTED_ORIGINS = ['https://abc123.ngrok.io']
ALLOWED_HOSTS = ['*']
```

---

## Альтернатива — Render.com (бесплатно, без лимита времени)

Backend: https://render.com → New Web Service → Root: `backend`
- Build: `pip install -r requirements.txt`  
- Start: `python manage.py migrate && gunicorn tictactoe.wsgi`

Frontend: New Static Site → Root: `frontend`
- Build: `npm install && npm run build`
- Publish: `dist`
