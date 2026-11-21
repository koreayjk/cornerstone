// Supabase client for the Family Portal (build-plan step 3 scaffold; not loaded by any page yet).
// Fill in the project URL and the anon (publishable) key when the Supabase project exists.
// Both are public by design: every table is protected by Row Level Security
// (supabase/migrations). NEVER put the service-role key here or anywhere in this repo.
//
// Usage (step 4+):  const sb = await getSupabase();  const { data } = await sb.from('announcements').select();
window.CCA_SUPABASE = {
  url: '',      // e.g. https://<project-ref>.supabase.co
  anonKey: ''   // Project Settings → API → anon / publishable key
};

let supabasePromise = null;
function getSupabase() {
  const { url, anonKey } = window.CCA_SUPABASE;
  if (!url || !anonKey) return Promise.reject(new Error('Supabase is not configured yet (js/supabase.js)'));
  // loaded on first use; version pinned
  if (!supabasePromise) {
    supabasePromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm')
      .then(({ createClient }) => createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }));
  }
  return supabasePromise;
}
