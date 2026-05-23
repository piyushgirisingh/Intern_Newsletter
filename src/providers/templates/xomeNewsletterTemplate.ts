import type { LearningBriefItem } from '../../models/newsletter.js';

export function renderNewsletterHtml(input: {
  title: string;
  generatedAt: string;
  items: LearningBriefItem[];
  notesPrompt: string;
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
    <section>
      <h2>Notes</h2>
      <p>${escapeHtml(input.notesPrompt)}</p>
    </section>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
