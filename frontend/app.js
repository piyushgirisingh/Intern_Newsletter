const statusEl = document.querySelector('#status');
const listEl = document.querySelector('#brief-list');
const notesEl = document.querySelector('#notes');
const quizPanelEl = document.querySelector('#quiz-panel');
const quizFormEl = document.querySelector('#quiz-form');
const quizResultEl = document.querySelector('#quiz-result');
const saveNotesButton = document.querySelector('#save-notes');
const downloadJsonButton = document.querySelector('#download-json');
const downloadMarkdownButton = document.querySelector('#download-markdown');

let currentBrief = null;
let currentQuiz = [];
const params = new URLSearchParams(window.location.search);
const newsletterId = params.get('newsletterId');
const userId = params.get('userId');
const token = params.get('token');

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
    const response = newsletterId && userId && token
      ? await fetch(`/api/newsletter?newsletterId=${encodeURIComponent(newsletterId)}&userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`, {
          cache: 'no-store',
        })
      : await fetch('./generated/latest-newsletter.json', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error('No generated brief found.');
    }

    const payload = await response.json();
    currentBrief = payload.newsletter ?? payload;
    currentQuiz = payload.quiz ?? currentBrief.quiz ?? [];
    renderBrief(currentBrief);
    renderQuiz(currentQuiz);
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

function renderQuiz(quiz) {
  if (!newsletterId || !userId || !token || quiz.length === 0) {
    quizPanelEl.hidden = true;
    return;
  }

  quizPanelEl.hidden = false;
  quizFormEl.innerHTML = quiz
    .map(
      (question) => `<fieldset class="quiz-question">
  <legend>${escapeHtml(question.questionOrder)}. ${escapeHtml(question.questionText)}</legend>
  <p class="quiz-topic">${escapeHtml(question.topicLabel)}</p>
  ${question.choices
    .map(
      (choice) => `<label class="quiz-choice">
    <input type="radio" name="${escapeHtml(question.id)}" value="${escapeHtml(choice)}" required>
    <span>${escapeHtml(choice)}</span>
  </label>`,
    )
    .join('')}
</fieldset>`,
    )
    .join('');

  quizFormEl.insertAdjacentHTML('beforeend', '<button type="submit">Submit quiz</button>');
}

quizFormEl.addEventListener('submit', async (event) => {
  event.preventDefault();

  const answers = currentQuiz.map((question) => {
    const selected = quizFormEl.querySelector(`input[name="${CSS.escape(question.id)}"]:checked`);
    return {
      questionId: question.id,
      selectedAnswer: selected?.value ?? '',
    };
  });

  quizResultEl.textContent = 'Submitting...';

  const response = await fetch('/api/quiz-submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newsletterId, userId, token, answers }),
  });

  const result = await response.json();

  if (!response.ok) {
    quizResultEl.textContent = result.error ?? 'Quiz submission failed.';
    return;
  }

  quizResultEl.textContent = `Submitted. Score: ${result.score}/${result.total}. Your weak topics will shape tomorrow's newsletter.`;
});

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
