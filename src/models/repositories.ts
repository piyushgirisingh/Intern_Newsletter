import type { LearningArticle } from './article.js';
import type { LearningNewsletter } from './newsletter.js';

export interface ArticleRepository {
  findByUrls(urls: string[]): Promise<LearningArticle[]>;
  saveCrawledArticles(articles: LearningArticle[]): Promise<number>;
  findCandidatesForNewsletter(limit: number): Promise<LearningArticle[]>;
  updateAnalysis(article: LearningArticle): Promise<void>;
}

export interface NewsletterRepository {
  getNextIssueOrder(): Promise<number>;
  saveNewsletter(newsletter: LearningNewsletter): Promise<LearningNewsletter>;
  getLatestNewsletter(): Promise<LearningNewsletter | null>;
}

export interface TaskRepository {
  createTask(name: string): Promise<string>;
  completeTask(taskId: string): Promise<void>;
}
