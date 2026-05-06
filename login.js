const msg = document.getElementById("loginMensagem");

function show(t, tipo = "") {
  msg.innerText = t || "";
  msg.className = "mensagem";
  if (tipo) msg.classList.add(tipo);
}

function obterUrlConfirmacao() {
  const caminho = window.location.pathname.replace(/index\.html$/i, "confirmado.html");
  return `${window.location.origin}${caminho}`;
}

async function login() {
  const email = loginEmail.value.trim();
  const senha = loginSenha.value;

  const { error } = await window.supabaseClient.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    show(error.message, "erro");
    return;
  }

  window.location.href = "../Cadastrar-empresa/index.html";
}

async function registrar() {
  const email = loginEmail.value.trim();
  const senha = loginSenha.value;

  const { error } = await window.supabaseClient.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: obterUrlConfirmacao()
    }
  });

  if (error) {
    show(error.message, "erro");
    return;
  }

  show("Conta criada. Vá até sua caixa de e-mail, procure a mensagem enviada por Supabase Auth e clique em Confirm your mail para confirmar seu cadastro.", "ok");
}

btnEntrar.onclick = login;
btnCriarConta.onclick = registrar;
