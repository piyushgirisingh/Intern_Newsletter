import type { LearningFocus, NewsletterSettings } from '../models/newsletter.js';
import { env } from './env.js';

export const xomeLearningFocus: LearningFocus[] = [
  {
    name: 'Company basics',
    beginnerQuestion: 'What does Xome do, and who uses it?',
    whyItMattersForQA: 'You need to understand the main users before writing useful test cases.',
  },
  {
    name: 'Real estate basics',
    beginnerQuestion: 'What does this real-estate term mean in simple words?',
    whyItMattersForQA: 'Unknown domain words can hide important product behavior.',
  },
  {
    name: 'Product workflow',
    beginnerQuestion: 'What problem is this feature trying to solve for buyers, sellers, agents, or servicers?',
    whyItMattersForQA: 'A good QA mindset checks whether the workflow solves the right user problem.',
  },
  {
    name: 'Engineering and data',
    beginnerQuestion: 'What technical systems, integrations, data quality issues, or automation ideas matter here?',
    whyItMattersForQA: 'Technical context helps you test faster and spot risky areas.',
  },
  {
    name: 'Founder mindset',
    beginnerQuestion: 'If I were a user or startup founder, what would I improve or question?',
    whyItMattersForQA: 'This turns QA from checking steps into finding better ways to build the product.',
  },
  {
    name: 'Stakeholder communication',
    beginnerQuestion: 'How can I explain this clearly to a product manager, engineer, or business stakeholder?',
    whyItMattersForQA: 'Clear communication helps turn findings into action.',
  },
];

export const newsletterSettings: NewsletterSettings = {
  brandName: env.newsletterBrandName,
  outputLanguage: env.newsletterOutputLanguage,
  timezone: env.newsletterTimezone,
  minimumItems: 5,
  maximumItems: 10,
  audience:
    'A new QA engineering intern at Xome who is also new to real estate and wants simple, practical, technical learning.',
};
