import type { LearningNewsletter } from '../../models/newsletter.js';
import { env } from '../../config/env.js';
import nodemailer from 'nodemailer';

export async function sendGmailPreview(newsletter: LearningNewsletter): Promise<void> {
  const from = requiredValue('GMAIL_FROM', env.gmailFrom);
  const to = requiredValue('GMAIL_TO', env.gmailTo);
  const appPassword = requiredValue('GMAIL_APP_PASSWORD', env.gmailAppPassword);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: from,
      pass: appPassword,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject: newsletter.title,
    text: newsletter.markdown,
    html: newsletter.html,
    attachments: [
      {
        filename: 'xome-learning-brief.md',
        content: newsletter.markdown,
        contentType: 'text/markdown',
      },
    ],
  });
}

function requiredValue(name: string, value?: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
