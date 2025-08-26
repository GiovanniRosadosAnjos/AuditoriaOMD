// 01_00_9_enviarDados.js

const endpoint = 'https://sheetdb.io/api/v1/ygjx7hr6r521t';

async function buscarEmpresas( ) {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('Erro ao buscar empresas');
  return await res.json();
}

async function buscarRevisoesPorId(id) {
  const res = await fetch(`${endpoint}/search?Id=${id}`);
  if (!res.ok) throw new Error('Erro ao buscar revisões');
  return await res.json();
}

async function salvarEmpresa(dados) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ data: dados })
  });
  if (!res.ok) throw new Error('Erro ao salvar empresa');
  return await res.json();
}

async function salvarContato(dados) {
  const res = await fetch(`${endpoint}?sheet=Contato`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: dados })
  });
  if (!res.ok) throw new Error('Erro ao salvar contato');
  return await res.json();
}

async function buscarContatosPorId(id) {
  const res = await fetch(`${endpoint}/search?Id=${id}&sheet=Contato`);
  if (!res.ok) throw new Error('Erro ao buscar contatos');
  return await res.json();
}

// ===================================================================
// --- FUNÇÃO CORRIGIDA E ADICIONADA ---
// Salva uma licença sanitária na aba correta.
async function salvarLicenca(dados) {
  const res = await fetch(`${endpoint}?sheet=LicencaSanitaria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: dados })
  });
  if (!res.ok) throw new Error('Erro ao salvar licença sanitária');
  return await res.json();
}
// ===================================================================

export { 
  buscarEmpresas, 
  buscarRevisoesPorId, 
  salvarEmpresa, 
  salvarContato, 
  buscarContatosPorId,
  salvarLicenca // <-- Exporta a nova função
};
