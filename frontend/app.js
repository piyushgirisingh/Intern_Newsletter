const statusEl = document.querySelector('#status');
const listEl = document.querySelector('#brief-list');
const notesEl = document.querySelector('#notes');
const saveNotesButton = document.querySelector('#save-notes');
const downloadJsonButton = document.querySelector('#download-json');
const downloadMarkdownButton = document.querySelector('#download-markdown');

let currentBrief = null;

notesEl.value = localStorage.getItem('xome-learning-notes') ?? '';

saveNotesButton.addEventListener('click', () => {
  localStorage.setItem('xome-learning-notes', notesEl.value);
  saveNotesButton.textContent = 'Saved';
  setTimeout(() => {
    saveNotesButton.textContent = 'Save to browser notes';
  }, 1200);
});

downloadJsonButton.addEventListener('click', () => {
  if (!currentBrief) return;
  downloadFile('xome-learning-brief.json', JSON.stringify(currentBrief, null, 2), 'application/json');
});

downloadMarkdownButton.addEventListener('click', () => {
  if (!currentBrief) return;
  const notes = notesEl.value.trim();
  const content = `${currentBrief.markdown}\n\n## My notes\n\n${notes}\n`;
  downloadFile('xome-learning-notes.md', content, 'text/markdown');
});

async function loadBrief() {
  try {
    const response = await fetch('./generated/latest-newsletter.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('No generated brief found.');
    }

    currentBrief = await response.json();
    renderBrief(currentBrief);
  } catch (error) {
    statusEl.textContent = `${error.message} Run npm run generate first.`;
  }
}

function renderBrief(brief) {
  statusEl.textContent = `${brief.title} generated ${new Date(brief.generatedAt).toLocaleString()}`;
  listEl.innerHTML = brief.items
    .map(
      (item, index) => `<article class="brief-item">
  <h2>${index + 1}. ${escapeHtml(item.title)}</h2>
  <a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(item.sourceUrl)}</a>
  ${renderField('Simple summary', item.plainEnglishSummary)}
  ${renderField('Real-estate term', item.realEstateTerm)}
  ${renderField('Technical angle', item.technicalAngle)}
  ${renderField('QA idea', item.qaIdea)}
  ${renderField('Founder question', item.founderQuestion)}
  ${renderField('Stakeholder talking point', item.stakeholderTalkingPoint)}
</article>`,
    )
    .join('');
}

function renderField(label, value) {
  return `<p><span class="label">${escapeHtml(label)}:</span> ${escapeHtml(value ?? 'None')}</p>`;
}

function downloadFile(fileName, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

loadBrief();
