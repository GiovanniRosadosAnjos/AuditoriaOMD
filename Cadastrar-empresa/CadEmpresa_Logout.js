// CadEmpresa_Logout.js
(function(){
  async function criarAreaUsuario(){
    if(document.getElementById('areaUsuarioLogado')) return;

    const area = document.createElement('div');
    area.id = 'areaUsuarioLogado';
    // REV98 - Área de usuário centralizada no topo, independente da quantidade de botões operacionais.
    area.style.position = 'fixed';
    area.style.top = '12px';
    area.style.left = '50%';
    area.style.transform = 'translateX(-50%)';
    area.style.zIndex = '9999';
    area.style.display = 'flex';
    area.style.alignItems = 'center';
    area.style.gap = '8px';
    area.style.padding = '6px 12px';
    area.style.border = '1px solid #cfcfcf';
    area.style.borderRadius = '10px';
    area.style.background = '#ffffff';
    area.style.fontFamily = 'Century Gothic, Arial, sans-serif';
    area.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';

    let nomeUsuario = 'Usuário';

    if(window.supabaseClient){
      const { data: { user } } = await window.supabaseClient.auth.getUser();

      if(user?.email){
        nomeUsuario = user.email.split('@')[0];
        nomeUsuario = nomeUsuario.charAt(0).toUpperCase() + nomeUsuario.slice(1);
      }
    }

    const texto = document.createElement('span');
    texto.textContent = `Olá ${nomeUsuario}`;
    texto.style.fontSize = '14px';
    texto.style.fontWeight = '600';
    texto.style.color = '#222';

    const btn = document.createElement('button');
    btn.id = 'btnLogoutSistema';
    btn.type = 'button';
    btn.textContent = 'Sair';
    btn.style.padding = '6px 12px';
    btn.style.border = '1px solid #999';
    btn.style.borderRadius = '8px';
    btn.style.background = '#f5f5f5';
    btn.style.color = '#222';
    btn.style.fontFamily = 'Century Gothic, Arial, sans-serif';
    btn.style.fontSize = '13px';
    btn.style.cursor = 'pointer';

    btn.addEventListener('click', async function(){
      if(!window.supabaseClient){
        window.location.href = "/index.html";
        return;
      }

      await window.supabaseClient.auth.signOut();
      window.location.href = "/index.html";
    });

    area.appendChild(texto);
    area.appendChild(btn);

    document.body.appendChild(area);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', criarAreaUsuario);
  } else {
    criarAreaUsuario();
  }
})();
