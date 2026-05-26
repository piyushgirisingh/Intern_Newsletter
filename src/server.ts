import express from 'express';
import { validateEnvForRun } from './config/env.js';
import { SupabaseNewsletterRepository } from './repositories/supabaseNewsletterRepository.js';
import { submitQuiz } from './services/quiz/quizSubmissionService.js';

validateEnvForRun();

const app = express();
const port = Number(process.env.PORT ?? 8787);
const newsletterRepository = new SupabaseNewsletterRepository();

app.use(express.json());
app.use(express.static('frontend'));

app.get('/api/newsletter', async (request, response) => {
  try {
    const newsletterId = String(request.query.newsletterId ?? '');
    const userId = String(request.query.userId ?? '');
    const token = String(request.query.token ?? '');

    if (!newsletterId || !userId || !token) {
      response.status(400).json({ error: 'newsletterId, userId, and token are required.' });
      return;
    }

    const result = await newsletterRepository.fetchNewsletterForUser(newsletterId, userId, token);

    if (!result) {
      response.status(404).json({ error: 'Newsletter not found.' });
      return;
    }

    response.json(result);
  } catch (error) {
    response.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/quiz-submissions', async (request, response) => {
  try {
    const result = await submitQuiz(request.body);
    response.json(result);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Newsletter app listening on port ${port}`);
});
