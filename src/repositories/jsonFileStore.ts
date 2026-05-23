import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { LearningArticle } from '../models/article.js';
import type { LearningNewsletter } from '../models/newsletter.js';
import type { ArticleRepository, NewsletterRepository, TaskRepository } from '../models/repositories.js';

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const contents = await readFile(filePath, 'utf8');
    return JSON.parse(contents) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return fallback;
    }

    throw error;
  }
}

async function writeJsonFile<T>(filePath: string, value: T): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export class JsonArticleRepository implements ArticleRepository {
  constructor(private readonly filePath = 'data/articles.json') {}

  async findByUrls(urls: string[]): Promise<LearningArticle[]> {
    const articles = await readJsonFile<LearningArticle[]>(this.filePath, []);
    const urlSet = new Set(urls);
    return articles.filter((article) => urlSet.has(article.url));
  }

  async saveCrawledArticles(newArticles: LearningArticle[]): Promise<number> {
    const articles = await readJsonFile<LearningArticle[]>(this.filePath, []);
    const existingUrls = new Set(articles.map((article) => article.url));
    const uniqueArticles = newArticles.filter((article) => !existingUrls.has(article.url));

    await writeJsonFile(this.filePath, [...articles, ...uniqueArticles]);
    return uniqueArticles.length;
  }

  async findCandidatesForNewsletter(limit: number): Promise<LearningArticle[]> {
    const articles = await readJsonFile<LearningArticle[]>(this.filePath, []);
    return articles
      .sort((left, right) => (right.importanceScore ?? 0) - (left.importanceScore ?? 0))
      .slice(0, limit);
  }

  async updateAnalysis(updatedArticle: LearningArticle): Promise<void> {
    const articles = await readJsonFile<LearningArticle[]>(this.filePath, []);
    const nextArticles = articles.map((article) =>
      article.id === updatedArticle.id ? updatedArticle : article,
    );
    await writeJsonFile(this.filePath, nextArticles);
  }
}

export class JsonNewsletterRepository implements NewsletterRepository {
  constructor(private readonly filePath = 'data/newsletters.json') {}

  async getNextIssueOrder(): Promise<number> {
    const newsletters = await readJsonFile<LearningNewsletter[]>(this.filePath, []);
    return newsletters.length + 1;
  }

  async saveNewsletter(newsletter: LearningNewsletter): Promise<LearningNewsletter> {
    const newsletters = await readJsonFile<LearningNewsletter[]>(this.filePath, []);
    await writeJsonFile(this.filePath, [...newsletters, newsletter]);
    await writeJsonFile('output/latest-newsletter.json', newsletter);
    await writeJsonFile('frontend/generated/latest-newsletter.json', newsletter);
    return newsletter;
  }

  async getLatestNewsletter(): Promise<LearningNewsletter | null> {
    const newsletters = await readJsonFile<LearningNewsletter[]>(this.filePath, []);
    return newsletters.at(-1) ?? null;
  }
}

export class JsonTaskRepository implements TaskRepository {
  constructor(private readonly filePath = 'data/tasks.json') {}

  async createTask(name: string): Promise<string> {
    const tasks = await readJsonFile<Array<{ id: string; name: string; status: string; startedAt: string }>>(
      this.filePath,
      [],
    );
    const id = `task-${Date.now()}`;
    await writeJsonFile(this.filePath, [
      ...tasks,
      { id, name, status: 'running', startedAt: new Date().toISOString() },
    ]);
    return id;
  }

  async completeTask(taskId: string): Promise<void> {
    const tasks = await readJsonFile<Array<{ id: string; name: string; status: string; startedAt: string; endedAt?: string }>>(
      this.filePath,
      [],
    );
    await writeJsonFile(
      this.filePath,
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: 'completed', endedAt: new Date().toISOString() }
          : task,
      ),
    );
  }
}
