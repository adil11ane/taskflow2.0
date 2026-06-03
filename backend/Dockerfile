FROM python:3.12-slim 

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \ 
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app 

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ENV PYTHONPATH="app/app/"

COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt 

COPY . . 
EXPOSE 8000 

CMD ["gunicorn", "--chdir", "app", "--bind", "0.0.0.0:8000", "learning.wsgi:application"]
