import * as cheerio from 'cheerio';
import type { LearningArticle } from '../../models/article.js';
import { xomeSourceGroups } from '../../config/xomeSources.js';

export async function crawlXomeLearningSources(): Promise<LearningArticle[]> {
  const now = new Date().toISOString();
  const articles: LearningArticle[] = [];

  for (const group of xomeSourceGroups) {
    for (const target of group.targets) {
      try {
        const response = await fetch(target.url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const title = $('title').first().text().trim() || target.title;
        const description =
          $('meta[name="description"]').attr('content')?.trim() ??
          $('h1').first().text().trim() ??
          group.purpose;

        articles.push({
          id: Buffer.from(target.url).toString('base64url'),
          title,
          url: target.url,
          sourceType: target.sourceType,
          summary: description,
          rawText: $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000),
          crawledAt: now,
          tags: [group.name],
        });
      } catch (error) {
        console.warn(`Skipping ${target.url}: ${(error as Error).message}`);
      }
    }
  }

  return articles;
}
