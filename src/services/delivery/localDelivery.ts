import { mkdir, writeFile } from 'node:fs/promises';
import type { LearningNewsletter } from '../../models/newsletter.js';

export async function writeLocalNewsletterFiles(newsletter: LearningNewsletter): Promise<void> {
  await mkdir('output', { recursive: true });
  await writeFile('output/latest-newsletter.md', newsletter.markdown, 'utf8');
  await writeFile('output/latest-newsletter.html', newsletter.html, 'utf8');
}
