import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { env } from '../../config/env.js';
import { newsletterSettings, xomeLearningFocus } from '../../config/xomeNewsletterConfig.js';
import type { LearningArticle } from '../../models/article.js';
import type { LearningBriefItem, LearningNewsletter } from '../../models/newsletter.js';
import { renderNewsletterHtml } from '../templates/xomeNewsletterTemplate.js';

export async function generateXomeLearningBrief(
  articles: LearningArticle[],
  issueOrder: number,
): Promise<LearningNewsletter> {
  const items = await generateItems(articles);

  const generatedAt = new Date().toISOString();
  const title = `${newsletterSettings.brandName} #${issueOrder}`;
  const notesPrompt =
    'After reading, write 2 product questions, 2 QA test ideas, and 1 thing you would ask your PM or engineering mentor.';
  const markdown = renderNewsletterMarkdown(title, generatedAt, items, notesPrompt);
  const html = renderNewsletterHtml({ title, generatedAt, items, notesPrompt });

  return {
    id: `xome-brief-${issueOrder}`,
    title,
    generatedAt,
    items,
    notesPrompt,
    markdown,
    html,
  };
}

async function generateItems(articles: LearningArticle[]): Promise<LearningBriefItem[]> {
  if (!hasLlmApiKey()) {
    return generateFallbackItems(articles);
  }

  try {
    return await generateItemsWithLlm(articles);
  } catch (error) {
    console.warn(`LLM generation failed. Using deterministic fallback items. ${(error as Error).message}`);
    return generateFallbackItems(articles);
  }
}

async function generateItemsWithLlm(articles: LearningArticle[]): Promise<LearningBriefItem[]> {
  const prompt = [
    `Audience: ${newsletterSettings.audience}`,
    `Goal: Give ${newsletterSettings.minimumItems}-${newsletterSettings.maximumItems} simple daily learning items about Xome, real estate, product quality, engineering, AI tools, and stakeholder communication.`,
    'Use very simple language. Assume the reader is new to real estate.',
    'For each item include: title, plainEnglishSummary, realEstateTerm, technicalAngle, qaIdea, founderQuestion, stakeholderTalkingPoint, sourceUrl.',
    'Return only valid JSON array.',
    `Learning focus: ${JSON.stringify(xomeLearningFocus)}`,
    `Source articles: ${JSON.stringify(articles)}`,
  ].join('\n\n');

  const result = await generateText({
    model: createNewsletterModel(),
    prompt,
  });

  return parseLearningBriefItems(result.text);
}

function hasLlmApiKey(): boolean {
  return Boolean(env.groqApiKey || env.openAIApiKey);
}

function createNewsletterModel(): LanguageModel {
  if (env.llmProvider === 'groq') {
    const groq = createOpenAI({
      apiKey: requiredValue('GROQ_API_KEY', env.groqApiKey),
      baseURL: 'https://api.groq.com/openai/v1',
      name: 'groq',
    });

    return groq.chat(env.llmModel ?? 'llama-3.3-70b-versatile');
  }

  if (env.llmProvider === 'openai') {
    const openai = createOpenAI({ apiKey: requiredValue('OPENAI_API_KEY', env.openAIApiKey) });
    return openai(env.llmModel ?? 'gpt-5-mini');
  }

  throw new Error(`Unsupported LLM_PROVIDER: ${env.llmProvider}`);
}

function requiredValue(name: string, value?: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseLearningBriefItems(rawText: string): LearningBriefItem[] {
  const trimmedText = rawText.trim();
  const jsonText = extractJsonArray(trimmedText);

  try {
    return JSON.parse(jsonText) as LearningBriefItem[];
  } catch (error) {
    throw new Error(
      [
        'The LLM response was not valid JSON after cleanup.',
        `Original parse error: ${(error as Error).message}`,
        `Response preview: ${trimmedText.slice(0, 500)}`,
      ].join('\n'),
    );
  }
}

function extractJsonArray(text: string): string {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');

  if (start !== -1 && end > start) {
    return text.slice(start, end + 1).trim();
  }

  return text.trim();
}

function generateFallbackItems(articles: LearningArticle[]): LearningBriefItem[] {
  return articles.slice(0, newsletterSettings.maximumItems).map((article) => ({
    title: article.title,
    sourceUrl: article.url,
    plainEnglishSummary: article.summary,
    realEstateTerm: article.sourceType === 'official-site' ? 'Auction or real-estate marketplace' : 'Real-estate basics',
    technicalAngle: 'Think about what data, search, forms, integrations, or automation may support this workflow.',
    qaIdea: 'Write one happy-path test and one edge-case test for the user workflow described here.',
    founderQuestion: 'What would make this easier, faster, or clearer for a first-time user?',
    stakeholderTalkingPoint: 'Ask which user problem this page or feature is most important for.',
  }));
}

function renderNewsletterMarkdown(
  title: string,
  generatedAt: string,
  items: LearningBriefItem[],
  notesPrompt: string,
): string {
  const body = items
    .map(
      (item, index) => `## ${index + 1}. ${item.title}

Source: ${item.sourceUrl}

Simple summary: ${item.plainEnglishSummary}

Real-estate term: ${item.realEstateTerm ?? 'None'}

Technical angle: ${item.technicalAngle ?? 'None'}

QA idea: ${item.qaIdea ?? 'None'}

Founder question: ${item.founderQuestion ?? 'None'}

Stakeholder talking point: ${item.stakeholderTalkingPoint ?? 'None'}`,
    )
    .join('\n\n');

  return `# ${title}

Generated: ${generatedAt}

${body}

## Notes

${notesPrompt}
`;
}
