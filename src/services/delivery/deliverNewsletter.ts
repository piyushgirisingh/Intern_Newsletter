import type { LearningNewsletter } from '../../models/newsletter.js';
import { env } from '../../config/env.js';
import { writeLocalNewsletterFiles } from './localDelivery.js';
import { sendGmailPreview } from './gmailDelivery.js';

export type DeliveryMode = 'local' | 'gmail';

export async function deliverNewsletter(newsletter: LearningNewsletter): Promise<void> {
  if (env.newsletterDeliveryMode === 'gmail') {
    await sendGmailPreview(newsletter);
    return;
  }

  await writeLocalNewsletterFiles(newsletter);
}
