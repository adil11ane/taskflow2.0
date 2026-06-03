#!/bin/bash 
set -e 
echo "=== backend Running database migrations ===" 
python manage.py migrate --noinput 
echo "=== backend Collect static files ==="
python manage.py collectstatic --noinput

if [ "$ENVIRONMENT" = "production" ]; then 
    echo "=== backend Starting Production Server (guniconr) ==="
    exec gunicorn core.wsgi:application  --bind 0.0.0.0:8000 --workers 3 
else 
    echo "=== backend Starting Development Server ==="
    exec python manage.py runserver 0.0.0.0:8000
fi 