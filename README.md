# TaskFlow API

A REST API for managing projects, tasks, and comments, with JWT authentication.

## Tech Stack

- **Backend:** Django 6.0.5, Django REST Framework
- **Authentication:** JWT (SimpleJWT)
- **Database:** PostgreSQL
- **Cache:** Redis
- **Frontend:** HTML, CSS, JavaScript
- **Infrastructure:** Docker, Docker Compose, Nginx (reverse proxy)

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) with Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/adil11ane/TaskFlow.git
cd TaskFlow
```

### 2. Configure environment variables

Create your `.env` file from the template and fill in the values (see [Environment Variables](#environment-variables)):

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 3. Run in development mode

Set `ENVIRONMENT=development` in your `.env` file, then start the containers:

```bash
docker-compose up -d --build
```

Useful commands:

| Command | Description |
|---------|-------------|
| `docker compose ps` | Show container status |
| `docker compose logs backend` | Show backend container logs |
| `docker compose exec backend python manage.py shell` | Open the Django interactive shell |
| `docker-compose down` | Stop the containers |

### 4. Run in production mode

Set `ENVIRONMENT=production` in your `.env` file, then start the containers in the background:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Stop the containers and remove volumes:

```bash
docker-compose -f docker-compose.prod.yml down -v
```

### Running without Docker

You need a running PostgreSQL instance and a configured `.env` file.

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Environment Variables

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `SECRET_KEY` | String | `django-insecure-xyz...` | Django secret key used to protect sessions, tokens, and signed data |
| `DEBUG` | Boolean | `False` | Django debug mode. Must be `False` in production |
| `ENVIRONMENT` | String | `development` / `production` | Selects how the project runs |
| `DATABASE_URL` | String | `postgres://user:pass@postgres_db:5432/db` | PostgreSQL
