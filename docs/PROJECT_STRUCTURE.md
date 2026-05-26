# Xome Learning Newsletter Structure

This project follows the README pipeline:

1. Crawl sources.
2. Analyze and score what was found.
3. Generate a simple daily learning brief.
4. Save it locally.
5. Preview it in a small frontend.
6. Later, deliver by Gmail or a Codex morning chat follow-up.

## Folder Tree

```text
.
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── data/
│   └── .gitkeep
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
│   │   └── .gitkeep
│   ├── index.html
│   └── styles.css
├── output/
│   └── .gitkeep
├── scripts/
│   ├── morningPrompt.md
│   └── run-daily-newsletter.sh
└── src/
    ├── app.ts
    ├── server.ts
    ├── agents/
    │   └── researchPlanner.ts
    ├── config/
    │   ├── env.ts
    │   ├── xomeNewsletterConfig.ts
    │   └── xomeSources.ts
    ├── models/
    │   ├── article.ts
    │   ├── newsletter.ts
    │   └── repositories.ts
    ├── providers/
    │   ├── analysis/
    │   │   └── simpleLearningAnalysis.ts
    │   ├── content/
    │   │   └── xomeBriefGenerator.ts
    │   ├── crawling/
    │   │   └── xomeCrawler.ts
    │   └── templates/
    │       └── xomeNewsletterTemplate.ts
    ├── repositories/
    │   └── jsonFileStore.ts
    └── services/
        └── delivery/
            ├── deliverNewsletter.ts
            ├── gmailDelivery.ts
            └── localDelivery.ts
├── supabase/
│   └── schema.sql
```

## Delivery Recommendation

Start with local output and the frontend preview. It is the safest first step because you can inspect the content before sending anything.

After that, use one of these:

- Codex chat every morning: best while you are still learning what format you like.
- Gmail: best after the brief format is stable and you are comfortable sending it to yourself automatically.

The local project does not automatically use your connected Codex Gmail account. That is intentional because email sending should require an approved connector or OAuth flow.

## VPS Automation

Use `deploy/systemd/xome-newsletter.timer` for a Linux VPS. It runs at 7 AM Central and calls `scripts/run-daily-newsletter.sh`, which writes logs under `output/logs/`.

The model does not need to run 24/7. The VPS only needs to stay online so the timer can call the model API at 7 AM.

For quiz submissions, keep `xome-newsletter-app.service` running. That is the only 24/7 Node process. It serves the frontend and accepts quiz submissions.

## Your Tasks

1. Install dependencies when you are ready: `npm install`.
2. Copy `.env.example` to `.env`.
3. Add `OPENAI_API_KEY` or `GROQ_API_KEY` if you want AI-generated summaries.
4. Review `src/config/xomeSources.ts` and add better Xome pages or sources as you learn them.
5. Run `npm run generate`.
6. Run `npm run preview` and open the shown local URL.
7. Deploy the project to the VPS.
8. Run `npm run automation:run` once manually.
9. Enable the systemd timer.
