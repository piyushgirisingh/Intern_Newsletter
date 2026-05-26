import { validateEnvForRun } from '../config/env.js';
import { requireSupabaseClient } from '../services/supabase/supabaseClient.js';

validateEnvForRun();

const supabase = requireSupabaseClient();

const { data: weakTopics, error } = await supabase
  .from('user_topic_profiles')
  .select('user_id,topic_key,topic_label,strength_score')
  .lt('strength_score', 0.7)
  .order('strength_score', { ascending: true })
  .limit(20);

if (error) {
  throw error;
}

for (const topic of weakTopics ?? []) {
  const { error: insertError } = await supabase.from('research_tasks').insert({
    user_id: topic.user_id,
    topic_key: topic.topic_key,
    topic_label: topic.topic_label,
    priority: Number((1 - Number(topic.strength_score)).toFixed(3)),
    reason: `Research deeper beginner-friendly material and quiz practice for ${topic.topic_label}.`,
  });

  if (insertError) {
    throw insertError;
  }
}

console.log(`Queued ${weakTopics?.length ?? 0} research topic(s).`);
