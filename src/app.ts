import { validateEnvForRun } from './config/env.js';
import { crawlXomeLearningSources } from './providers/crawling/xomeCrawler.js';
import { scoreArticleForInternLearning } from './providers/analysis/simpleLearningAnalysis.js';
import { generateXomeLearningBrief } from './providers/content/xomeBriefGenerator.js';
import { JsonArticleRepository, JsonNewsletterRepository, JsonTaskRepository } from './repositories/jsonFileStore.js';
import { deliverNewsletter } from './services/delivery/deliverNewsletter.js';

const articleRepository = new JsonArticleRepository();
const newsletterRepository = new JsonNewsletterRepository();
const taskRepository = new JsonTaskRepository();

const taskId = await taskRepository.createTask('daily-xome-learning-brief');

try {
  validateEnvForRun();

  const crawledArticles = await crawlXomeLearningSources();
  const analyzedArticles = crawledArticles.map(scoreArticleForInternLearning);
  await articleRepository.saveCrawledArticles(analyzedArticles);

  const candidates = await articleRepository.findCandidatesForNewsletter(10);
  const issueOrder = await newsletterRepository.getNextIssueOrder();
  const newsletter = await generateXomeLearningBrief(candidates, issueOrder);

  await newsletterRepository.saveNewsletter(newsletter);
  await deliverNewsletter(newsletter);
  await taskRepository.completeTask(taskId);

  console.log(`Generated ${newsletter.title}`);
  console.log('Open frontend/index.html after running the preview server, or read output/latest-newsletter.json.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
