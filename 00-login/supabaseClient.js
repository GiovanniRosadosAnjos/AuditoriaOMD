const SUPABASE_URL = 'https://ilmryxajavjuuwonhrex.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HpgmFXNnPqBTQjac6wecuw_QR48LC6c';

if (window.supabase) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
