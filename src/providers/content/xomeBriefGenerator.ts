import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { env } from '../../config/env.js';
import { newsletterSettings, xomeLearningFocus } from '../../config/xomeNewsletterConfig.js';
import type { LearningArticle } from '../../models/article.js';
import type { AppUser, LearningBriefItem, LearningNewsletter, QuizQuestion, UserTopicProfile } from '../../models/newsletter.js';
import { renderNewsletterHtml } from '../templates/xomeNewsletterTemplate.js';

export async function generateXomeLearningBrief(
  articles: LearningArticle[],
  issueOrder: number,
  options: {
    user?: AppUser;
    weakTopics?: UserTopicProfile[];
    quizUrl?: string;
    quizAccessToken?: string;
  } = {},
): Promise<LearningNewsletter> {
  const items = await generateItems(articles, options.weakTopics);
  const quiz = await generateQuiz(items, options.weakTopics);

  const generatedAt = new Date().toISOString();
  const title = options.user
    ? `${newsletterSettings.brandName} #${issueOrder} for ${options.user.displayName ?? options.user.email}`
    : `${newsletterSettings.brandName} #${issueOrder}`;
  const notesPrompt =
    'After reading, write 2 product questions, 2 QA test ideas, and 1 thing you would ask your PM or engineering mentor.';
  const markdown = renderNewsletterMarkdown(title, generatedAt, items, notesPrompt);
  const html = renderNewsletterHtml({ title, generatedAt, items, quiz, notesPrompt, quizUrl: options.quizUrl });

  return {
    id: options.user ? `xome-brief-${issueOrder}-${options.user.id}` : `xome-brief-${issueOrder}`,
    userId: options.user?.id,
    quizAccessToken: options.quizAccessToken,
    title,
    generatedAt,
    items,
    quiz,
    notesPrompt,
    markdown,
    html,
  };
}

async function generateItems(
  articles: LearningArticle[],
  weakTopics: UserTopicProfile[] = [],
): Promise<LearningBriefItem[]> {
  if (!hasLlmApiKey()) {
    return generateFallbackItems(articles);
  }

  try {
    return await generateItemsWithLlm(articles, weakTopics);
  } catch (error) {
    console.warn(`LLM generation failed. Using deterministic fallback items. ${(error as Error).message}`);
    return generateFallbackItems(articles);
  }
}

async function generateItemsWithLlm(
  articles: LearningArticle[],
  weakTopics: UserTopicProfile[] = [],
): Promise<LearningBriefItem[]> {
  const prompt = [
    `Audience: ${newsletterSettings.audience}`,
    `Goal: Give ${newsletterSettings.minimumItems}-${newsletterSettings.maximumItems} simple daily learning items about Xome, real estate, product quality, engineering, AI tools, and stakeholder communication.`,
    'Use very simple language. Assume the reader is new to real estate.',
    'For each item include: title, plainEnglishSummary, realEstateTerm, technicalAngle, qaIdea, founderQuestion, stakeholderTalkingPoint, sourceUrl.',
    'If weak topics are provided, include extra reading material that helps those weak areas.',
    'Return only valid JSON array.',
    `Learning focus: ${JSON.stringify(xomeLearningFocus)}`,
    `Weak topics for this user: ${JSON.stringify(weakTopics)}`,
    `Source articles: ${JSON.stringify(articles)}`,
  ].join('\n\n');

  const result = await generateText({
    model: createNewsletterModel(),
    prompt,
  });

  return parseLearningBriefItems(result.text);
}

async function generateQuiz(
  items: LearningBriefItem[],
  weakTopics: UserTopicProfile[] = [],
): Promise<QuizQuestion[]> {
  if (!hasLlmApiKey()) {
    return generateFallbackQuiz(items);
  }

  const prompt = [
    'Create exactly 3 multiple-choice quiz questions for a beginner Xome QA engineering intern.',
    'Questions must be unique for today and based only on the newsletter items.',
    'Prefer weak user topics when available, but keep the questions answerable from the newsletter.',
    'Each question must have exactly 4 choices.',
    'Return only a valid JSON array with: questionOrder, questionText, topicKey, topicLabel, choices, correctAnswer, explanation, sourceUrl.',
    `Weak topics: ${JSON.stringify(weakTopics)}`,
    `Newsletter items: ${JSON.stringify(items)}`,
  ].join('\n\n');

  try {
    const result = await generateText({
      model: createNewsletterModel(),
      prompt,
    });
    return parseQuizQuestions(result.text);
  } catch (error) {
    console.warn(`Quiz generation failed. Using deterministic fallback quiz. ${(error as Error).message}`);
    return generateFallbackQuiz(items);
  }
}

function hasLlmApiKey(): boolean {
  return Boolean(env.groqApiKey || env.openAIApiKey || env.moonshotApiKey);
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

  if (env.llmProvider === 'moonshot') {
    const moonshot = createOpenAI({
      apiKey: requiredValue('MOONSHOT_API_KEY', env.moonshotApiKey),
      baseURL: 'https://api.moonshot.ai/v1',
      name: 'moonshot',
    });

    return moonshot.chat(env.llmModel ?? 'kimi-k2.6');
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

function parseQuizQuestions(rawText: string): QuizQuestion[] {
  const parsed = JSON.parse(extractJsonArray(rawText.trim())) as QuizQuestion[];
  return parsed.slice(0, 3).map((question, index) => ({
    ...question,
    questionOrder: question.questionOrder ?? index + 1,
    choices: question.choices.slice(0, 4),
  }));
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

function generateFallbackQuiz(items: LearningBriefItem[]): QuizQuestion[] {
  const sourceItems = items.slice(0, 3);

  return sourceItems.map((item, index) => ({
    questionOrder: index + 1,
    questionText: `What is one useful QA angle from "${item.title}"?`,
    topicKey: normalizeTopicKey(item.realEstateTerm ?? item.title),
    topicLabel: item.realEstateTerm ?? 'Product and QA basics',
    choices: [
      item.qaIdea ?? 'Write a happy-path test and an edge-case test.',
      'Ignore user workflows and only test colors.',
      'Avoid asking product questions.',
      'Skip technical risks until after release.',
    ],
    correctAnswer: item.qaIdea ?? 'Write a happy-path test and an edge-case test.',
    explanation: item.technicalAngle ?? 'QA should connect user workflows, product intent, and technical risk.',
    sourceUrl: item.sourceUrl,
  }));
}

function normalizeTopicKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'general';
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
