// CadEmpresa_SupabaseClient.js
// Configuração da conexão com Supabase.
// Preencher com a URL do projeto e a anon public key do Supabase.

const SUPABASE_URL = 'https://ilmryxajavjuuwonhrex.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HpgmFXNnPqBTQjac6wecuw_QR48LC6c';

function supabaseConfigurado() {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('SEU_PROJETO') &&
    !SUPABASE_ANON_KEY.includes('SUA_ANON_PUBLIC_KEY')
  );
}

if (!window.supabase) {
  console.error('Biblioteca Supabase não carregada. Verifique o CDN no index.html.');
} else if (!supabaseConfigurado()) {
  console.warn('Supabase ainda não configurado. Preencha SUPABASE_URL e SUPABASE_ANON_KEY em CadEmpresa_SupabaseClient.js.');
  window.supabaseClient = null;
} else {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
