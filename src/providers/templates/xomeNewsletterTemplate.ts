import type { LearningBriefItem } from '../../models/newsletter.js';
import type { QuizQuestion } from '../../models/newsletter.js';

export function renderNewsletterHtml(input: {
  title: string;
  generatedAt: string;
  items: LearningBriefItem[];
  quiz?: QuizQuestion[];
  notesPrompt: string;
  quizUrl?: string;
}): string {
  const itemHtml = input.items
    .map(
      (item, index) => `<article class="brief-item">
  <p class="item-count">${index + 1}</p>
  <h2>${escapeHtml(item.title)}</h2>
  <a href="${escapeHtml(item.sourceUrl)}">${escapeHtml(item.sourceUrl)}</a>
  <p><strong>Simple summary:</strong> ${escapeHtml(item.plainEnglishSummary)}</p>
  <p><strong>Real-estate term:</strong> ${escapeHtml(item.realEstateTerm ?? 'None')}</p>
  <p><strong>Technical angle:</strong> ${escapeHtml(item.technicalAngle ?? 'None')}</p>
  <p><strong>QA idea:</strong> ${escapeHtml(item.qaIdea ?? 'None')}</p>
  <p><strong>Founder question:</strong> ${escapeHtml(item.founderQuestion ?? 'None')}</p>
  <p><strong>Stakeholder talking point:</strong> ${escapeHtml(item.stakeholderTalkingPoint ?? 'None')}</p>
</article>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(input.title)}</title>
</head>
<body>
  <main>
    <h1>${escapeHtml(input.title)}</h1>
    <p>Generated: ${escapeHtml(input.generatedAt)}</p>
    ${itemHtml}
    ${renderQuizSection(input.quiz ?? [], input.quizUrl)}
    <section>
      <h2>Notes</h2>
      <p>${escapeHtml(input.notesPrompt)}</p>
    </section>
  </main>
</body>
</html>`;
}

function renderQuizSection(quiz: QuizQuestion[], quizUrl?: string): string {
  if (quiz.length === 0) {
    return '';
  }

  const questions = quiz
    .map(
      (question) => `<li>
  <strong>${escapeHtml(question.questionText)}</strong>
  <br>
  Topic: ${escapeHtml(question.topicLabel)}
</li>`,
    )
    .join('\n');

  const button = quizUrl
    ? `<p><a href="${escapeHtml(quizUrl)}">Open quiz and submit answers</a></p>`
    : '';

  return `<section>
  <h2>Daily quiz</h2>
  <ol>${questions}</ol>
  ${button}
</section>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
