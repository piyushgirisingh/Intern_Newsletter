import { requireSupabaseClient } from '../supabase/supabaseClient.js';

export interface QuizAnswerInput {
  questionId: string;
  selectedAnswer: string;
}

export interface QuizSubmissionInput {
  newsletterId: string;
  userId: string;
  token: string;
  answers: QuizAnswerInput[];
}

export async function submitQuiz(input: QuizSubmissionInput): Promise<{
  score: number;
  total: number;
  analysis: Array<{
    questionId: string;
    topicKey: string;
    topicLabel: string;
    correct: boolean;
    explanation: string;
  }>;
}> {
  const supabase = requireSupabaseClient();
  const answerMap = new Map(input.answers.map((answer) => [answer.questionId, answer.selectedAnswer]));

  const { data: newsletter, error: newsletterError } = await supabase
    .from('daily_newsletters')
    .select('id')
    .eq('id', input.newsletterId)
    .eq('user_id', input.userId)
    .eq('quiz_access_token', input.token)
    .maybeSingle();

  if (newsletterError) throw newsletterError;
  if (!newsletter) {
    throw new Error('Invalid quiz link.');
  }

  const { data: questions, error: questionsError } = await supabase
    .from('newsletter_quizzes')
    .select('*')
    .eq('newsletter_id', input.newsletterId)
    .eq('user_id', input.userId)
    .order('question_order', { ascending: true });

  if (questionsError) throw questionsError;
  if (!questions || questions.length === 0) {
    throw new Error('No quiz found for this newsletter and user.');
  }

  const analysis = questions.map((question) => {
    const selectedAnswer = answerMap.get(question.id) ?? '';
    return {
      questionId: question.id,
      topicKey: question.topic_key,
      topicLabel: question.topic_label,
      correct: selectedAnswer === question.correct_answer,
      selectedAnswer,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
    };
  });

  const score = analysis.filter((item) => item.correct).length;
  const total = analysis.length;

  const { error: submissionError } = await supabase.from('quiz_submissions').upsert(
    {
      newsletter_id: input.newsletterId,
      user_id: input.userId,
      score,
      total,
      answers: input.answers,
      analysis,
    },
    { onConflict: 'newsletter_id,user_id' },
  );

  if (submissionError) throw submissionError;

  for (const item of analysis) {
    await updateTopicProfile(input.userId, item.topicKey, item.topicLabel, item.correct);
  }

  await queueResearchTasks(input.userId);

  return { score, total, analysis };
}

async function updateTopicProfile(
  userId: string,
  topicKey: string,
  topicLabel: string,
  wasCorrect: boolean,
): Promise<void> {
  const supabase = requireSupabaseClient();
  const { data: existing, error: fetchError } = await supabase
    .from('user_topic_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_key', topicKey)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const oldStrength = Number(existing?.strength_score ?? 0.5);
  const observed = wasCorrect ? 1 : 0;
  const strengthScore = Number((oldStrength * 0.7 + observed * 0.3).toFixed(3));
  const attempts = Number(existing?.attempts ?? 0) + 1;
  const correct = Number(existing?.correct ?? 0) + (wasCorrect ? 1 : 0);
  const confidence = Number(Math.min(1, attempts / 8).toFixed(3));
  const nextReviewDays = strengthScore < 0.45 ? 1 : strengthScore < 0.7 ? 3 : 7;
  const nextReviewAt = new Date(Date.now() + nextReviewDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('user_topic_profiles').upsert(
    {
      user_id: userId,
      topic_key: topicKey,
      topic_label: topicLabel,
      strength_score: strengthScore,
      confidence,
      attempts,
      correct,
      last_seen_at: new Date().toISOString(),
      next_review_at: nextReviewAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,topic_key' },
  );

  if (error) throw error;
}

async function queueResearchTasks(userId: string): Promise<void> {
  const supabase = requireSupabaseClient();
  const { data: weakTopics, error } = await supabase
    .from('user_topic_profiles')
    .select('topic_key,topic_label,strength_score')
    .eq('user_id', userId)
    .lt('strength_score', 0.65)
    .order('strength_score', { ascending: true })
    .limit(3);

  if (error) throw error;

  for (const topic of weakTopics ?? []) {
    await supabase.from('research_tasks').insert({
      user_id: userId,
      topic_key: topic.topic_key,
      topic_label: topic.topic_label,
      priority: Number((1 - Number(topic.strength_score)).toFixed(3)),
      reason: `User needs reinforcement on ${topic.topic_label}.`,
    });
  }
}
