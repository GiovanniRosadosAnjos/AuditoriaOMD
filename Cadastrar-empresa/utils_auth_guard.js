// utils_auth_guard.js
// Proteção de tela por autenticação Supabase.
// A tela começa oculta no HTML e só é exibida após sessão válida.

(async function(){
  function voltarParaLogin(){
    window.location.href = "/index.html";
  }

  if(!window.supabaseClient){
    console.error("SupabaseClient não carregado");
    voltarParaLogin();
    return;
  }

  try {
    const { data, error } = await window.supabaseClient.auth.getSession();

    if(error || !data.session){
      voltarParaLogin();
      return;
    }

    document.body.style.display = "block";
  } catch (err) {
    console.error("Erro ao validar sessão:", err);
    voltarParaLogin();
  }
})();
