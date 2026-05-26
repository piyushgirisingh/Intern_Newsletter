import { env } from '../../config/env.js';
import type { AppUser } from '../../models/newsletter.js';
import { requireSupabaseClient } from '../supabase/supabaseClient.js';

interface ConfiguredUser {
  email: string;
  displayName?: string;
  roleContext?: string;
}

export async function getOrCreateNewsletterUsers(): Promise<AppUser[]> {
  const configuredUsers = readConfiguredUsers();
  const supabase = requireSupabaseClient();
  const users: AppUser[] = [];

  for (const configuredUser of configuredUsers) {
    const { data, error } = await supabase
      .from('app_users')
      .upsert(
        {
          email: configuredUser.email,
          display_name: configuredUser.displayName,
          role_context: configuredUser.roleContext ?? 'Xome QA engineering intern',
        },
        { onConflict: 'email' },
      )
      .select('id,email,display_name,role_context')
      .single();

    if (error) {
      throw error;
    }

    users.push({
      id: data.id,
      email: data.email,
      displayName: data.display_name ?? undefined,
      roleContext: data.role_context ?? undefined,
    });
  }

  return users;
}

function readConfiguredUsers(): ConfiguredUser[] {
  if (env.newsletterUsers) {
    return env.newsletterUsers
      .split(',')
      .map((entry) => {
        const [email, displayName] = entry.split(':').map((value) => value.trim());
        return { email, displayName };
      })
      .filter((user) => user.email);
  }

  if (env.gmailTo) {
    return env.gmailTo
      .split(',')
      .map((email) => ({ email: email.trim() }))
      .filter((user) => user.email);
  }

  return [];
}
