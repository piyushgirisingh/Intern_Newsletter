import type { LearningNewsletter, QuizQuestion, UserTopicProfile } from '../models/newsletter.js';
import { requireSupabaseClient } from '../services/supabase/supabaseClient.js';

export class SupabaseNewsletterRepository {
  private readonly supabase = requireSupabaseClient();

  async getNextIssueOrder(): Promise<number> {
    const { count, error } = await this.supabase
      .from('daily_newsletters')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;
    return (count ?? 0) + 1;
  }

  async saveNewsletter(newsletter: LearningNewsletter): Promise<void> {
    const { error: newsletterError } = await this.supabase.from('daily_newsletters').upsert({
      id: newsletter.id,
      user_id: newsletter.userId,
      title: newsletter.title,
      generated_at: newsletter.generatedAt,
      quiz_access_token: newsletter.quizAccessToken,
      markdown: newsletter.markdown,
      html: newsletter.html,
      items: newsletter.items,
      notes_prompt: newsletter.notesPrompt,
    });

    if (newsletterError) throw newsletterError;

    const quizRows = newsletter.quiz.map((question) => ({
      newsletter_id: newsletter.id,
      user_id: newsletter.userId,
      question_order: question.questionOrder,
      question_text: question.questionText,
      topic_key: question.topicKey,
      topic_label: question.topicLabel,
      choices: question.choices,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
      source_url: question.sourceUrl,
    }));

    if (quizRows.length > 0) {
      const { error: quizError } = await this.supabase
        .from('newsletter_quizzes')
        .upsert(quizRows, { onConflict: 'newsletter_id,user_id,question_order' });

      if (quizError) throw quizError;
    }
  }

  async fetchWeakTopics(userId: string, limit = 5): Promise<UserTopicProfile[]> {
    const { data, error } = await this.supabase
      .from('user_topic_profiles')
      .select('topic_key,topic_label,strength_score,confidence,attempts,correct')
      .eq('user_id', userId)
      .order('strength_score', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      topicKey: row.topic_key,
      topicLabel: row.topic_label,
      strengthScore: Number(row.strength_score),
      confidence: Number(row.confidence),
      attempts: row.attempts,
      correct: row.correct,
    }));
  }

  async fetchNewsletterForUser(newsletterId: string, userId: string, token: string): Promise<{
    newsletter: LearningNewsletter;
    quiz: QuizQuestion[];
  } | null> {
    const { data: newsletter, error: newsletterError } = await this.supabase
      .from('daily_newsletters')
      .select('*')
      .eq('id', newsletterId)
      .eq('user_id', userId)
      .eq('quiz_access_token', token)
      .single();

    if (newsletterError) return null;

    const { data: quiz, error: quizError } = await this.supabase
      .from('newsletter_quizzes')
      .select('*')
      .eq('newsletter_id', newsletterId)
      .eq('user_id', userId)
      .order('question_order', { ascending: true });

    if (quizError) throw quizError;

    return {
      newsletter: {
        id: newsletter.id,
        userId: newsletter.user_id,
        quizAccessToken: newsletter.quiz_access_token,
        title: newsletter.title,
        generatedAt: newsletter.generated_at,
        items: newsletter.items,
        quiz: [],
        notesPrompt: newsletter.notes_prompt,
        markdown: newsletter.markdown,
        html: newsletter.html,
      },
      quiz: (quiz ?? []).map((question) => ({
        id: question.id,
        questionOrder: question.question_order,
        questionText: question.question_text,
        topicKey: question.topic_key,
        topicLabel: question.topic_label,
        choices: question.choices,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        sourceUrl: question.source_url ?? undefined,
      })),
    };
  }
}
