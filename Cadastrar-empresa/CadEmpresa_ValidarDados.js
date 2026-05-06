// CadEmpresa_ValidarDados.js
// Validação central do cadastro antes de gravar no Supabase.

function somenteDigitos(valor = '') {
  return String(valor || '').replace(/\D/g, '');
}

function marcarCampo(id, invalido) {
  const campo = document.getElementById(id);
  if (campo) campo.classList.toggle('campo-invalido', !!invalido);
  return campo;
}

function limparMarcacoes() {
  ['nomeFantasia', 'razaoSocial', 'cnpj'].forEach(id => marcarCampo(id, false));
}

function cnpjValido(cnpj = '') {
  const c = somenteDigitos(cnpj);
  if (c.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(c)) return false;

  const calcDigito = (base) => {
    let tamanho = base.length;
    let numeros = c.substring(0, tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }

    const resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado;
  };

  return calcDigito(c.substring(0, 12)) === parseInt(c.charAt(12), 10)
      && calcDigito(c.substring(0, 13)) === parseInt(c.charAt(13), 10);
}

function cnpjJaExiste(cnpj, empresasAtuais = [], idAtual = '') {
  const cnpjNovo = somenteDigitos(cnpj);

  return (empresasAtuais || []).some(emp => {
    const mesmoRegistro = idAtual && emp.Id === idAtual;
    if (mesmoRegistro) return false;
    return somenteDigitos(emp.CNPJ) === cnpjNovo;
  });
}

export function validarEmpresaAntesSalvar(empresaObj, empresasAtuais = [], idAtual = '') {
  limparMarcacoes();

  const camposObrigatorios = [
    { id: 'nomeFantasia', nome: 'Nome Fantasia', valor: empresaObj.NomeFantasia },
    { id: 'razaoSocial', nome: 'Razão Social', valor: empresaObj.razao },
    { id: 'cnpj', nome: 'CNPJ', valor: empresaObj.CNPJ }
  ];

  for (const campo of camposObrigatorios) {
    if (!String(campo.valor || '').trim()) {
      return {
        ok: false,
        mensagem: `Preencha o campo obrigatório: ${campo.nome}.`,
        campo: marcarCampo(campo.id, true)
      };
    }
  }

  if (!cnpjValido(empresaObj.CNPJ)) {
    return {
      ok: false,
      mensagem: 'CNPJ inválido. Verifique antes de salvar.',
      campo: marcarCampo('cnpj', true)
    };
  }

  if (cnpjJaExiste(empresaObj.CNPJ, empresasAtuais, idAtual)) {
    return {
      ok: false,
      mensagem: 'Já existe empresa cadastrada com este CNPJ.',
      campo: marcarCampo('cnpj', true)
    };
  }

  return { ok: true };
}
