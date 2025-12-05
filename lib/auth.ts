import { createClient } from "@/utils/supabase/server";

// Create a Supabase client for server-side auth operations
export async function createServerSupabaseClient() {
  return await createClient();
}

// Get the current user session
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// Get the current user
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
