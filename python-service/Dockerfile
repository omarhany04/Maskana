FROM python:3.12-slim

WORKDIR /service

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY python-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY python-service/app ./app
COPY python-service/data ./data
COPY python-service/.env.example ./.env.example

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
