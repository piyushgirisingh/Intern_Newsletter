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

export interface LearningNewsletter {
  id: string;
  title: string;
  generatedAt: string;
  items: LearningBriefItem[];
  notesPrompt: string;
  markdown: string;
  html: string;
}
