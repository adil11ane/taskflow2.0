FROM python:3.12-slim 

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \ 
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app 

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt 

COPY . . 

RUN chmod +x /app/app/entrypoint.sh

WORKDIR /app/app
EXPOSE 8000 

ENTRYPOINT ["/app/app/entrypoint.sh"]
