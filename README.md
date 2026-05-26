# Xome Learning Newsletter

This project is a daily learning pipeline for a new QA engineering intern at Xome who is also new to real estate.

The goal is simple: generate 5-10 things to learn each morning so you can better understand Xome, real estate, the product, engineering risks, QA ideas, and stakeholder communication.

## What It Does

The pipeline follows the newsletter kit structure:

1. Crawl Xome, real-estate, and technical learning sources.
2. Analyze the sources and score what is useful.
3. Generate a plain-English learning brief.
4. Save the brief locally.
5. Show it in a small frontend.
6. Let you download the brief or save your own notes.

## Why This Is Tailored For You

Each brief is written for someone who:

- Is new to Xome.
- Is new to real estate.
- Is working with engineering.
- Wants to think like a QA engineer, product thinker, startup founder, and user.
- Needs simple explanations, not heavy industry language.
- Wants technical angles like data quality, search, automation, integrations, AI tools, and reliability.
- Will communicate with product managers, engineers, and other stakeholders.

## Recommended Delivery

Start with the local frontend first. It lets you review the content before anything is sent.

After the format feels useful, choose one:

- Codex chat every morning: better while you are still learning and changing the format.
- Gmail delivery: better after the content format is stable.

This local project does not automatically use your connected Codex Gmail account. Email should be added later through an approved Gmail connector or OAuth flow.

## Project Structure

```text
.
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── data/
├── deploy/
│   ├── cron/
│   │   └── xome-newsletter.cron
│   └── systemd/
│       ├── xome-newsletter.service
│       └── xome-newsletter.timer
├── docs/
│   └── PROJECT_STRUCTURE.md
├── frontend/
│   ├── app.js
│   ├── generated/
│   ├── index.html
│   └── styles.css
├── output/
├── scripts/
│   ├── morningPrompt.md
│   └── run-daily-newsletter.sh
└── src/
    ├── app.ts
    ├── config/
    ├── models/
    ├── providers/
    ├── repositories/
    └── services/
```

See `docs/PROJECT_STRUCTURE.md` for the detailed tree.

## Setup

Do not run this until you are ready to install dependencies:

```bash
npm install
```

Then copy the environment file:

```bash
cp .env.example .env
```

Add an LLM API key if you want AI-generated summaries. Without an API key, the project can still create basic fallback items from crawled page summaries.

For OpenAI:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
LLM_MODEL=gpt-5-mini
```

For Groq:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key
LLM_MODEL=llama-3.3-70b-versatile
```

For Kimi / Moonshot:

```env
LLM_PROVIDER=moonshot
MOONSHOT_API_KEY=your_moonshot_key
LLM_MODEL=kimi-k2.6
```

## Run

Generate the brief:

```bash
npm run generate
```

Preview it:

```bash
npm run preview
```

The frontend reads `frontend/generated/latest-newsletter.json`, which is created by the generator.

## VPS Automation

For full automation, run the project on your 24/7 VPS and let the server trigger the job every morning. A separate lightweight model does not need to run all day. The model is only called when the scheduled job runs.

Recommended production `.env` values:

```env
LLM_PROVIDER=moonshot
MOONSHOT_API_KEY=your_moonshot_key
LLM_MODEL=kimi-k2.6
NEWSLETTER_DELIVERY_MODE=gmail
GMAIL_FROM=your_gmail@gmail.com
GMAIL_TO=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_google_app_password
PUBLIC_APP_URL=https://your-vps-domain-or-ip
NEWSLETTER_USERS=person1@example.com:Person One,person2@example.com:Person Two
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_server_side_service_role_key
```

Before running the new user and quiz features, run `supabase/schema.sql` in the Supabase SQL editor.

`NEWSLETTER_USERS` is optional. If it is empty, the app uses `GMAIL_TO`. For multiple users, use comma-separated values:

```env
NEWSLETTER_USERS=piyush@example.com:Piyush,teammate@example.com:Teammate
```

Manual automation test:

```bash
npm run automation:run
```

Systemd installation on the VPS assumes this project is deployed at `/root/Intern_Newsletter`.

```bash
sudo cp deploy/systemd/xome-newsletter.service /etc/systemd/system/
sudo cp deploy/systemd/xome-newsletter.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now xome-newsletter.timer
systemctl list-timers xome-newsletter.timer
```

Logs are written to:

```text
output/logs/daily-newsletter.log
output/logs/daily-newsletter-error.log
```

If your VPS does not support the systemd calendar timezone syntax, either set the VPS timezone to Central time or use `deploy/cron/xome-newsletter.cron`.

## Quiz API

The daily email links users to the frontend with `newsletterId` and `userId` in the URL. The frontend calls the Node API to submit quiz answers.

Run the API manually:

```bash
npm run server
```

Install it as a 24/7 systemd service:

```bash
sudo cp deploy/systemd/xome-newsletter-app.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now xome-newsletter-app.service
sudo systemctl status xome-newsletter-app.service --no-pager
```

Optional reinforcement planner:

```bash
sudo cp deploy/systemd/xome-research-agent.service /etc/systemd/system/
sudo cp deploy/systemd/xome-research-agent.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now xome-research-agent.timer
```

## Your Tasks

1. Install dependencies when you are ready.
2. Copy `.env.example` to `.env`.
3. Add your OpenAI or Groq API key if you want AI-written summaries.
4. Review `src/config/xomeSources.ts` and add useful Xome pages.
5. Run `npm run generate`.
6. Run `npm run preview`.
7. For VPS automation, deploy the project to `/root/Intern_Newsletter`.
8. Run `npm run automation:run` once manually.
9. Enable the systemd timer.
