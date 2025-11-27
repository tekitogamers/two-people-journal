import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const uploadImage = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('couple-images')
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (error) throw error;
  return data;
};

export const getImageUrl = (path: string) => {
  return supabase.storage.from('couple-images').getPublicUrl(path).data.publicUrl;
};
