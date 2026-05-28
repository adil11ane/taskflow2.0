# TaskFlow API

REST API для управления задачами, проектами и комментариями.

## Стек
- Django 6.0.5
- Django REST Framework
- JWT (SimpleJWT)
- SQLite

## Установка

1. Клонировать репозиторий
git clone https://github.com/твой-юзернейм/tutorials.git
cd tutorials


2. Создать виртуальное окружение
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows


3. Установить зависимости
pip install -r requirements.txt


4. Создать .env файл
cp .env.example .env
# Заполни SECRET_KEY своим значением


5. Применить миграции
python manage.py migrate


6. Запустить сервер
python manage.py runserver

## API Endpoints

| Method | URL | Описание |
|--------|-----|----------|
| POST | /users/register/ | Регистрация |
| POST | /users/login/ | Вход, получение токенов |
| POST | /users/logout/ | Выход, блокировка токена |
| POST | /users/login/refresh/ | Обновление access токена |
| GET/POST | /polls/api/projects/ | Список / создание проектов |
| GET/PUT/DELETE | /polls/api/projects/{id}/ | Просмотр / редактирование / удаление |
| GET/POST | /polls/api/tasks/ | Список / создание задач |
| GET/PUT/DELETE | /polls/api/tasks/{id}/ | Просмотр / редактирование / удаление |
| GET/POST | /polls/api/comments/ | Список / создание комментариев |
| GET/PUT/DELETE | /polls/api/comments/{id}/ | Просмотр / редактирование / удаление |
| GET | /api/docs/ | Swagger документация |

## Аутентификация
Bearer Token — добавь заголовок:
Authorization: Bearer <access_token>
