import type { LearningArticle } from '../../models/article.js';

const technicalWords = ['api', 'data', 'automation', 'platform', 'integration', 'search', 'auction'];

export function scoreArticleForInternLearning(article: LearningArticle): LearningArticle {
  const text = `${article.title} ${article.summary} ${article.rawText ?? ''}`.toLowerCase();
  const technicalScore = technicalWords.some((word) => text.includes(word)) ? 2 : 0;
  const officialSourceScore = article.sourceType === 'official-site' ? 3 : 1;
  const beginnerValueScore = text.includes('mortgage') || text.includes('auction') || text.includes('home') ? 2 : 1;

  return {
    ...article,
    importanceScore: officialSourceScore + beginnerValueScore + technicalScore,
    tags: [...new Set([...article.tags, article.sourceType])],
  };
}
