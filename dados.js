const endpoint = 'https://sheetdb.io/api/v1/ygjx7hr6r521t';

// Busca todas as empresas
async function buscarEmpresas() {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('Erro ao buscar empresas');
  return await res.json();
}

// Busca revisões de uma empresa pelo Id
async function buscarRevisoesPorId(id) {
  const res = await fetch(`${endpoint}/search?Id=${id}`);
  if (!res.ok) throw new Error('Erro ao buscar revisões');
  return await res.json();
}

// Salva empresa/revisão
async function salvarEmpresa(dados) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ data: dados })
  });
  if (!res.ok) throw new Error('Erro ao salvar empresa');
  return await res.json();
}
