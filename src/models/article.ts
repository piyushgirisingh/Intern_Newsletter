export type SourceType = 'official-site' | 'education' | 'market-update';

export interface CrawlTarget {
  title: string;
  url: string;
  sourceType: SourceType;
}

export interface CrawlTargetGroup {
  name: string;
  purpose: string;
  targets: CrawlTarget[];
}

export interface LearningArticle {
  id: string;
  title: string;
  url: string;
  sourceType: SourceType;
  summary: string;
  rawText?: string;
  publishedAt?: string;
  crawledAt: string;
  tags: string[];
  importanceScore?: number;
}
