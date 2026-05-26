export interface LearningFocus {
  name: string;
  beginnerQuestion: string;
  whyItMattersForQA: string;
}

export interface NewsletterSettings {
  brandName: string;
  outputLanguage: string;
  timezone: string;
  minimumItems: number;
  maximumItems: number;
  audience: string;
}

export interface LearningBriefItem {
  title: string;
  sourceUrl: string;
  plainEnglishSummary: string;
  realEstateTerm?: string;
  technicalAngle?: string;
  qaIdea?: string;
  founderQuestion?: string;
  stakeholderTalkingPoint?: string;
}

export interface QuizQuestion {
  id?: string;
  questionOrder: number;
  questionText: string;
  topicKey: string;
  topicLabel: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  sourceUrl?: string;
}

export interface LearningNewsletter {
  id: string;
  userId?: string;
  quizAccessToken?: string;
  title: string;
  generatedAt: string;
  items: LearningBriefItem[];
  quiz: QuizQuestion[];
  notesPrompt: string;
  markdown: string;
  html: string;
}

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  roleContext?: string;
}

export interface UserTopicProfile {
  topicKey: string;
  topicLabel: string;
  strengthScore: number;
  confidence: number;
  attempts: number;
  correct: number;
}
