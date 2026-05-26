import { validateEnvForRun } from './config/env.js';
import { randomBytes } from 'node:crypto';
import { crawlXomeLearningSources } from './providers/crawling/xomeCrawler.js';
import { scoreArticleForInternLearning } from './providers/analysis/simpleLearningAnalysis.js';
import { generateXomeLearningBrief } from './providers/content/xomeBriefGenerator.js';
import { JsonArticleRepository, JsonNewsletterRepository, JsonTaskRepository } from './repositories/jsonFileStore.js';
import { SupabaseNewsletterRepository } from './repositories/supabaseNewsletterRepository.js';
import { deliverNewsletter } from './services/delivery/deliverNewsletter.js';
import { getSupabaseClient } from './services/supabase/supabaseClient.js';
import { getOrCreateNewsletterUsers } from './services/users/newsletterUsers.js';
import { env } from './config/env.js';

const articleRepository = new JsonArticleRepository();
const newsletterRepository = new JsonNewsletterRepository();
const taskRepository = new JsonTaskRepository();
const supabaseNewsletterRepository = getSupabaseClient() ? new SupabaseNewsletterRepository() : null;

const taskId = await taskRepository.createTask('daily-xome-learning-brief');

try {
  validateEnvForRun();

  const crawledArticles = await crawlXomeLearningSources();
  const analyzedArticles = crawledArticles.map(scoreArticleForInternLearning);
  await articleRepository.saveCrawledArticles(analyzedArticles);

  const candidates = await articleRepository.findCandidatesForNewsletter(10);
  const issueOrder = supabaseNewsletterRepository
    ? await supabaseNewsletterRepository.getNextIssueOrder()
    : await newsletterRepository.getNextIssueOrder();

  if (supabaseNewsletterRepository) {
    const users = await getOrCreateNewsletterUsers();

    if (users.length === 0) {
      throw new Error('No newsletter users configured. Set NEWSLETTER_USERS or GMAIL_TO.');
    }

    for (const user of users) {
      const weakTopics = await supabaseNewsletterRepository.fetchWeakTopics(user.id);
      const quizAccessToken = randomBytes(24).toString('base64url');
      const newsletterId = `xome-brief-${issueOrder}-${user.id}`;
      const quizUrl = `${env.publicAppUrl}/?newsletterId=${encodeURIComponent(newsletterId)}&userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(quizAccessToken)}`;
      const newsletter = await generateXomeLearningBrief(candidates, issueOrder, {
        user,
        weakTopics,
        quizUrl,
        quizAccessToken,
      });

      await newsletterRepository.saveNewsletter(newsletter);
      await supabaseNewsletterRepository.saveNewsletter(newsletter);
      await deliverNewsletter(newsletter, { to: user.email });
      console.log(`Generated ${newsletter.title} for ${user.email}`);
    }
  } else {
    const newsletter = await generateXomeLearningBrief(candidates, issueOrder);
    await newsletterRepository.saveNewsletter(newsletter);
    await deliverNewsletter(newsletter);
    console.log(`Generated ${newsletter.title}`);
  }

  await taskRepository.completeTask(taskId);

  console.log('Open frontend/index.html after running the preview server, or read output/latest-newsletter.json.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
