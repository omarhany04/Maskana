# Real Estate CRM SaaS

## Structure

```text
.
|-- app
|-- nginx
|-- prisma
|-- python-service
`-- shared
```

## Local Setup

```bash
npm install
cd app && npm install
python -m venv python-service/.venv
python-service/.venv/Scripts/pip install -r python-service/requirements.txt
cp .env.example .env
cp python-service/.env.example python-service/.env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Docker

```bash
docker compose up --build
```

## AWS EC2

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs python3 python3-venv python3-pip nginx postgresql-client
git clone <repository-url> /srv/real-estate-crm
cd /srv/real-estate-crm
npm install
cd app && npm install && cd ..
python3 -m venv python-service/.venv
python-service/.venv/bin/pip install -r python-service/requirements.txt
cp .env.example .env
cp python-service/.env.example python-service/.env
npm run db:generate
npm run db:migrate
npm run db:seed
cd app && npm run build && cd ..
sudo cp nginx/default.conf /etc/nginx/sites-available/real-estate-crm
sudo ln -sf /etc/nginx/sites-available/real-estate-crm /etc/nginx/sites-enabled/real-estate-crm
sudo nginx -t
sudo systemctl restart nginx
```

## Services

```bash
cd /srv/real-estate-crm/app && npm run start
cd /srv/real-estate-crm/python-service && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Required Environment Variables

```env
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
AI_SERVICE_URL=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_S3_PUBLIC_BASE_URL=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REFRESH_TOKEN=
```
