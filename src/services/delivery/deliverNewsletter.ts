import type { LearningNewsletter } from '../../models/newsletter.js';
import { env } from '../../config/env.js';
import { writeLocalNewsletterFiles } from './localDelivery.js';
import { sendGmailPreview } from './gmailDelivery.js';

export type DeliveryMode = 'local' | 'gmail';

export async function deliverNewsletter(newsletter: LearningNewsletter, options: { to?: string } = {}): Promise<void> {
  if (env.newsletterDeliveryMode === 'gmail') {
    await sendGmailPreview(newsletter, options);
    return;
  }

  await writeLocalNewsletterFiles(newsletter);
}
