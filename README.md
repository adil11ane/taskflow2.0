# TaskFlow API

REST API для управления задачами, проектами и комментариями.

## Стек
- Django 6.0.5
- Django REST Framework
- JWT (SimpleJWT)
- PostgreSQL

## Установка

1. Клонировать репозиторий
git clone https://github.com/adil11ane/TaskFlow.git
cd tutorials

2. Локальная разработка 
# Запуск local/prod 
Запуск контейнеров: 
открыть Terminal -> docker-compose up -d --build

Просмотр стаус контейнеров:
'docker compose ps'

Просмотр логов бэкенд контейнера:
'docker compose logs backend'

Войти в интерактивную консоль Django shell: 
'docker compose exec backend python manage.py shell'

Остановка контейнеров:
также в Terminal -> docker-compose down 

3. Продакшен разработка (поменяйте в своем ранее созданом .env файле ENVIRONMENT=production, можете так свапаться)
Запуск в фоновом режиме:
docker-compose -f docker-compose.prod.yml up -d --build 

Осатновка и удаление обьемов:
docker-compose -f docker-compose.prod.yml down 

4. Структура проекта
# Структура проекта 

├── backend/               # Бэкенд-приложение (Django)
│   ├── app/               # Основные приложения и их функции
│   │   ├── db/            # Конфигурация / миграции базы данных
│   │   ├── learning/      # Модуль/приложение корень проекта
│   │   ├── polls/         # Модуль/приложение основных аспектов проекта
│   │   ├── staticfiles/   # Сборщик статических файлов приложения
│   │   └── users/         # Модуль управления пользователями и авторизации
│   ├── entrypoint.sh      # Скрипт инициализации контейнера бэкенда
│   ├── manage.py          # Скрипт управления Django
│   ├── requirements.txt   # Зависимости Python
│   └── Dockerfile         # Инструкция сборки Docker-образа для бэкенда
├── frontend/              # Фронтенд-приложение
│   ├── src/               # Исходный код интерфейса
│   │   ├── css/           # Стили интерфейса 
│   └── js/                # JavaScript files for index and dashboard
│   │   ├── index.html     # Страница авторизации и входа
│   │   └── dashboard.html # Основная страница 
│   └── Dockerfile         # Инструкция сборки Docker-образа для фронтенда
├── nginx/                 # Веб-сервер и обратный прокси (Reverse Proxy)
│   ├── conf/
│   │   └── default.conf   # Настройки маршрутизации запросов (Nginx)
│   └── Dockerfile         # Инструкция сборки Docker-образа для Nginx
├── .env                   # Локальные переменные окружения (скрытый файл)
├── .env.example           # Шаблон переменных окружения для команды
├── .gitignore             # Список файлов, игнорируемых Git
├── docker-compose.yml     # Конфигурация оркестрации всех контейнеров
└── README.md              # Документация проекта

5. Переменные окружения 
# Переменные окружения
SECRET_KEY String django-insecure-xyz...  - Секретный ключ Django для защиты данных, сессий, токенов.
DEBUG Boolean False  - Режим отладки Django. На продакшене обязательно False.
ENVIRONMENT String development/production - Указываешь каким образом ты хочешь запустить проект
DATABASE_URL Строка подключения к базе данных PostgreSQL postgres://user:pass@postgres_db:5432/db
REDIS_URL Строка подключения к кэшу Redis redis://redis_cache:6379/0


6. Запустить сервер
python manage.py runserver

## API Endpoints

| Method | URL | Описание |
|--------|-----|----------|
| POST | api/users/register/ | Регистрация |
| POST | api/users/login/ | Вход, получение токенов |
| POST | api/users/logout/ | Выход, блокировка токена |
| POST | api/users/login/refresh/ | Обновление access токена |
| GET/POST | api/polls/projects/ | Список / создание проектов |
| GET/PUT/DELETE | /polls/projects/{id}/ | Просмотр / редактирование / удаление |
| GET/POST | api/polls/tasks/ | Список / создание задач |
| GET/PUT/DELETE | api/polls/tasks/{id}/ | Просмотр / редактирование / удаление |
| GET/POST | api/polls/comments/ | Список / создание комментариев |
| GET/PUT/DELETE | api/polls/comments/{id}/ | Просмотр / редактирование / удаление |
| GET | /api/docs/ | Swagger документация |

## Аутентификация
Bearer Token — добавь заголовок:
Authorization: Bearer <access_token>
