import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(url, key);

export const BUCKET = 'demo-images';

export async function uploadImage(file: Buffer, filename: string, contentType: string): Promise<string> {
  const path = `${Date.now()}-${filename}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
