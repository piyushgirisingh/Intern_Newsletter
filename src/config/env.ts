import 'dotenv/config';

export type LlmProvider = 'groq' | 'openai' | 'moonshot';
export type DeliveryMode = 'local' | 'gmail';

export interface AppEnv {
  llmProvider: LlmProvider;
  llmModel?: string;
  openAIApiKey?: string;
  groqApiKey?: string;
  moonshotApiKey?: string;
  newsletterOutputLanguage: string;
  newsletterBrandName: string;
  newsletterTimezone: string;
  newsletterDeliveryMode: DeliveryMode;
  gmailFrom?: string;
  gmailTo?: string;
  gmailAppPassword?: string;
  publicAppUrl: string;
  newsletterUsers?: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
}

export const env: AppEnv = {
  llmProvider: readLlmProvider(),
  llmModel: readOptionalEnv('LLM_MODEL'),
  openAIApiKey: readOptionalEnv('OPENAI_API_KEY'),
  groqApiKey: readOptionalEnv('GROQ_API_KEY'),
  moonshotApiKey: readOptionalEnv('MOONSHOT_API_KEY') ?? readOptionalEnv('KIMI_API_KEY'),
  newsletterOutputLanguage: process.env.NEWSLETTER_OUTPUT_LANGUAGE ?? 'English',
  newsletterBrandName: process.env.NEWSLETTER_BRAND_NAME ?? 'Xome Learning Brief',
  newsletterTimezone: process.env.NEWSLETTER_TIMEZONE ?? 'America/Chicago',
  newsletterDeliveryMode: readDeliveryMode(),
  gmailFrom: readOptionalEnv('GMAIL_FROM'),
  gmailTo: readOptionalEnv('GMAIL_TO'),
  gmailAppPassword: readOptionalEnv('GMAIL_APP_PASSWORD'),
  publicAppUrl: process.env.PUBLIC_APP_URL ?? 'http://localhost:8787',
  newsletterUsers: readOptionalEnv('NEWSLETTER_USERS'),
  supabaseUrl: readOptionalEnv('SUPABASE_URL') ?? readOptionalEnv('VITE_SUPABASE_URL'),
  supabaseServiceRoleKey: readOptionalEnv('SUPABASE_SERVICE_ROLE_KEY'),
};

export function validateEnvForRun(): void {
  if (env.llmProvider === 'groq' && !env.groqApiKey) {
    throw new Error('LLM_PROVIDER=groq requires GROQ_API_KEY.');
  }

  if (env.llmProvider === 'openai' && !env.openAIApiKey) {
    throw new Error('LLM_PROVIDER=openai requires OPENAI_API_KEY.');
  }

  if (env.llmProvider === 'moonshot' && !env.moonshotApiKey) {
    throw new Error('LLM_PROVIDER=moonshot requires MOONSHOT_API_KEY.');
  }

  if (env.newsletterDeliveryMode === 'gmail') {
    const missing = [
      ['GMAIL_FROM', env.gmailFrom],
      ['GMAIL_TO', env.gmailTo],
      ['GMAIL_APP_PASSWORD', env.gmailAppPassword],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(`NEWSLETTER_DELIVERY_MODE=gmail requires: ${missing.join(', ')}.`);
    }
  }

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    console.warn('Supabase server credentials are not configured. User tracking and quiz submissions will be disabled.');
  }
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readLlmProvider(): LlmProvider {
  const provider = process.env.LLM_PROVIDER ?? (process.env.MOONSHOT_API_KEY ? 'moonshot' : process.env.GROQ_API_KEY ? 'groq' : 'openai');

  if (provider === 'groq' || provider === 'openai' || provider === 'moonshot') {
    return provider;
  }

  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}

function readDeliveryMode(): DeliveryMode {
  const mode = process.env.NEWSLETTER_DELIVERY_MODE ?? 'local';

  if (mode === 'local' || mode === 'gmail') {
    return mode;
  }

  throw new Error(`Unsupported NEWSLETTER_DELIVERY_MODE: ${mode}`);
}
