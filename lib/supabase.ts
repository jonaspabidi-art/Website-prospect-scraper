import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    _client = createClient(url, key);
  }
  return _client;
}

export const BUCKET = 'demo-images';

export async function uploadImage(file: Buffer, filename: string, contentType: string): Promise<string> {
  const supabase = getClient();
  const path = `${Date.now()}-${filename}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
