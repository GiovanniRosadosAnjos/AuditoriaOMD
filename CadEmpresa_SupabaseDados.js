// CadEmpresa_SupabaseDados.js
// Camada de dados da migração Sheet/API -> Supabase.
// Cadastro de empresas e licença sanitária usam exclusivamente o motor CRUD.js.
// Código antigo de empresas e licença sanitária foi movido para o final do arquivo e comentado, apenas como fallback de consulta.
// Demais entidades serão migradas uma por vez.

import { buscarRegistros, salvarRegistro, excluirRegistrosPorIds } from './CRUD.js';

function getSupabase() {
  const client = window.supabaseClient || null;
  if (!client) {
    throw new Error('Supabase não configurado. Preencha SUPABASE_URL e SUPABASE_ANON_KEY em CadEmpresa_SupabaseClient.js.');
  }
  return client;
}

function mapEmpresaFromSupabase(row = {}) {
  return {
    Id: row.id || '',
    Rev: '',
    NomeFantasia: row.nome_fantasia || '',
    razao: row.razao_social || '',
    CNPJ: row.cnpj || '',
    Rua: row.rua || '',
    num: row.numero || '',
    bairro: row.bairro || '',
    cidade: row.cidade || '',
    UF: row.estado || '',
    pais: row.pais || '',
    CEP: row.cep || '',
    observacoes: row.observacoes || '',
    LicencaSanitaria_Rev: '',
    Bombeiros_Rev: '',
    created_at: row.created_at || ''
  };
}

function mapEmpresaToSupabase(empresa = {}) {
  return {
    nome_fantasia: empresa.NomeFantasia || '',
    razao_social: empresa.razao || '',
    cnpj: empresa.CNPJ || '',
    rua: empresa.Rua || '',
    numero: empresa.num || '',
    bairro: empresa.bairro || '',
    cidade: empresa.cidade || '',
    estado: empresa.UF || '',
    pais: empresa.pais || '',
    cep: empresa.CEP || '',
    observacoes: empresa.observacoes || ''
  };
}

function isUuid(valor = '') {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor);
}

export async function buscarEmpresas() {
  return buscarRegistros('empresas', {
    select: '*',
    orderBy: 'created_at',
    ascending: false,
    mapper: mapEmpresaFromSupabase
  });
}

export async function salvarEmpresaAtual(empresa) {
  return salvarRegistro('empresas', mapEmpresaToSupabase(empresa), {
    id: empresa?.Id || '',
    select: '*',
    mapper: mapEmpresaFromSupabase
  });
}

// O histórico de empresas é automático via trigger no Supabase.
export async function salvarEmpresaHistorico() { return null; }

function mapContatoFromSupabase(row = {}) {
  return {
    id: row.id || '',
    empresa_id: row.empresa_id || '',
    nome: row.nome || '',
    cargo: row.cargo || '',
    email: row.email || '',
    telefone: row.telefone || '',
    criado_por: row.criado_por || '',
    created_at: row.created_at || ''
  };
}

function mapContatoToSupabase(empresaId, contato = {}) {
  return {
    empresa_id: empresaId,
    nome: contato.nome || '',
    cargo: contato.cargo || contato.funcao || '',
    email: contato.email || '',
    telefone: contato.telefone || ''
  };
}

export async function buscarContatosPorId(empresaId) {
  if (!empresaId) return [];
  const client = getSupabase();

  const { data, error } = await client
    .from('contatos_empresa')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapContatoFromSupabase);
}

export async function salvarContatosEmpresa(empresaId, contatos = []) {
  if (!empresaId) return null;
  const client = getSupabase();
  const lista = Array.isArray(contatos) ? contatos : [];

  const { data: existentes, error: erroBusca } = await client
    .from('contatos_empresa')
    .select('id')
    .eq('empresa_id', empresaId);

  if (erroBusca) throw erroBusca;

  const idsMantidos = new Set();
  const resultados = [];

  for (const contato of lista) {
    const contatoId = contato.id || contato.Id || '';
    const payload = mapContatoToSupabase(empresaId, contato);

    if (contatoId && isUuid(contatoId)) {
      idsMantidos.add(contatoId);
      const { data, error } = await client
        .from('contatos_empresa')
        .update(payload)
        .eq('id', contatoId)
        .eq('empresa_id', empresaId)
        .select()
        .single();
      if (error) throw error;
      resultados.push(data);
    } else {
      const { data, error } = await client
        .from('contatos_empresa')
        .insert({ ...payload, criado_por: 'anon' })
        .select()
        .single();
      if (error) throw error;
      if (data?.id) idsMantidos.add(data.id);
      resultados.push(data);
    }
  }

  const idsParaExcluir = (existentes || [])
    .map(row => row.id)
    .filter(id => id && !idsMantidos.has(id));

  if (idsParaExcluir.length) {
    const { error: erroDelete } = await client
      .from('contatos_empresa')
      .delete()
      .in('id', idsParaExcluir);
    if (erroDelete) throw erroDelete;
  }

  return resultados;
}

// Compatibilidade com chamadas antigas.
export async function salvarContato() { return null; }

const CNAES_LICENCA_SANITARIA = {
  '2660-4/00': {
    subgrupo: 'FABRIL',
    agrupamento: 'INDÚSTRIA DE PRODUTOS PARA A SAÚDE',
    descricao: 'FABRICAÇÃO DE APARELHOS ELETROMÉDICOS...'
  },
  '4645-1/01': {
    subgrupo: 'DISTRIBUIDORA/IMPORTADORA',
    agrupamento: 'COMÉRCIO ATACADISTA DE PRODUTOS PARA A SAÚDE',
    descricao: 'COMÉRCIO ATACADISTA DE INSTRUMENTOS E MATERIAIS...'
  },
  '4664-8/00': {
    subgrupo: 'DISTRIBUIDORA/IMPORTADORA',
    agrupamento: 'COMÉRCIO ATACADISTA DE PRODUTOS PARA A SAÚDE',
    descricao: 'COMÉRCIO ATACADISTA DE MÁQUINAS, APARELHOS...'
  }
};

function separarCnaes(valor = '') {
  return String(valor || '')
    .split(';')
    .map(cnae => cnae.trim())
    .filter(Boolean);
}

function juntarCnaes(lista = []) {
  const vistos = new Set();
  return (Array.isArray(lista) ? lista : [])
    .map(cnae => String(cnae || '').trim())
    .filter(Boolean)
    .filter(cnae => {
      if (vistos.has(cnae)) return false;
      vistos.add(cnae);
      return true;
    })
    .join('; ');
}

function mapLicencaFromSupabase(row = {}) {
  const cnaes = separarCnaes(row.cnae_codigo);
  const primeiroCnae = cnaes[0] || '';
  return {
    id: row.id || '',
    empresa_id: row.empresa_id || '',
    CEVS: row.numero_cevs || '',
    Validade: row.validade || '',
    CNAE: juntarCnaes(cnaes),
    CNAES: cnaes,
    CNAE_Descricao: (CNAES_LICENCA_SANITARIA[primeiroCnae] || {}).descricao || '',
    Subgrupo: (CNAES_LICENCA_SANITARIA[primeiroCnae] || {}).subgrupo || '',
    Agrupamento: (CNAES_LICENCA_SANITARIA[primeiroCnae] || {}).agrupamento || '',
    Observacoes: row.observacoes || ''
  };
}

function montarPayloadLicencas(empresaId, licencas = []) {
  const mapa = new Map();

  (Array.isArray(licencas) ? licencas : []).forEach(licenca => {
    const cevs = (licenca.cevs || licenca.CEVS || '').trim();
    const validade = licenca.validade || licenca.Validade || '';
    const observacoes = (licenca.observacoes ?? licenca.Observacoes ?? '').trim ? (licenca.observacoes ?? licenca.Observacoes ?? '').trim() : (licenca.observacoes ?? licenca.Observacoes ?? '');
    const idLicenca = licenca.id || '';

    const cnaeItens = Array.isArray(licenca.cnaeItens) && licenca.cnaeItens.length
      ? licenca.cnaeItens
      : (Array.isArray(licenca.cnaes)
          ? licenca.cnaes.map(cnae => ({ id: idLicenca, cnae }))
          : separarCnaes(licenca.cnae || licenca.CNAE || '').map(cnae => ({ id: idLicenca, cnae })));

    const ids = cnaeItens
      .map(item => item.id || '')
      .filter(id => id && isUuid(id));

    const cnaes = cnaeItens
      .map(item => item.cnae || item.CNAE || '')
      .flatMap(separarCnaes);

    if (!cevs && !validade && !cnaes.length) return;

    const chave = cevs;
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        id: ids[0] || idLicenca || '',
        idsOrigem: [...ids],
        empresa_id: empresaId,
        numero_cevs: cevs,
        validade,
        cnae_codigo: '',
        observacoes,
        cnaes: []
      });
    }

    const itemMapa = mapa.get(chave);
    itemMapa.validade = validade || itemMapa.validade;
    itemMapa.observacoes = observacoes;
    itemMapa.idsOrigem.push(...ids.filter(id => !itemMapa.idsOrigem.includes(id)));
    itemMapa.cnaes.push(...cnaes);
  });

  return [...mapa.values()].map(item => {
    item.cnae_codigo = juntarCnaes(item.cnaes);
    delete item.cnaes;
    return item;
  });
}

export async function buscarLicencasAtuaisPorId(empresaId) {
  if (!empresaId) return [];

  return buscarRegistros('licenca_sanitaria', {
    select: '*',
    filtros: [{ campo: 'empresa_id', valor: empresaId }],
    orderBy: 'created_at',
    ascending: true,
    mapper: mapLicencaFromSupabase
  });
}

export async function salvarLicencasAtuais(empresaId, _rev, licencas = []) {
  if (!empresaId) return null;

  const payload = montarPayloadLicencas(empresaId, licencas);
  const resultados = [];

  const existentes = await buscarRegistros('licenca_sanitaria', {
    select: '*',
    filtros: [{ campo: 'empresa_id', valor: empresaId }]
  });

  const existentesPorCevs = new Map();
  (existentes || []).forEach(row => {
    const chave = row.numero_cevs || '';
    if (!existentesPorCevs.has(chave)) existentesPorCevs.set(chave, []);
    existentesPorCevs.get(chave).push(row);
  });

  const cevsMantidos = new Set(payload.map(item => item.numero_cevs || ''));

  for (const item of payload) {
    const { id, idsOrigem = [], ...dados } = item;
    const candidatos = existentesPorCevs.get(dados.numero_cevs || '') || [];
    const existentePorId = candidatos.find(row => row.id === id) || null;
    const registroPrincipal = existentePorId || candidatos[0] || null;

    const salvo = await salvarRegistro('licenca_sanitaria', dados, {
      id: registroPrincipal?.id || '',
      select: '*',
      removerIdDoPayload: true
    });
    resultados.push(salvo);

    // Se versões antigas criaram uma linha por CNAE, remove as duplicadas do mesmo CEVS.
    const idsDuplicados = candidatos
      .map(row => row.id)
      .filter(rowId => rowId && rowId !== (registroPrincipal?.id || salvo?.id));

    await excluirRegistrosPorIds('licenca_sanitaria', idsDuplicados);
  }

  // Remove licenças que foram excluídas no modal.
  const idsParaExcluir = (existentes || [])
    .filter(row => !cevsMantidos.has(row.numero_cevs || ''))
    .map(row => row.id)
    .filter(Boolean);

  await excluirRegistrosPorIds('licenca_sanitaria', idsParaExcluir);

  return resultados;
}

// O histórico de licença sanitária será gravado por trigger no Supabase na próxima etapa.
export async function salvarLicencaHistorico() { return null; }
export async function buscarBombeirosAtualPorId() { return null; }
export async function salvarBombeirosAtual() { return null; }
export async function salvarBombeirosHistorico() { return null; }



/*
================================================================================
FALLBACK / CÓDIGO ANTIGO DE LICENÇA SANITÁRIA — NÃO EXECUTAR
================================================================================
Mantido temporariamente apenas para consulta durante os testes da migração para
CRUD.js. Todo este bloco está comentado, portanto NÃO interfere no frontend nem
nas operações com o Supabase.

Após validação definitiva de licença sanitária usando CRUD.js, este bloco pode
ser removido.

// export async function buscarLicencasAtuaisPorId(empresaId) {
//   if (!empresaId) return [];
//   const client = getSupabase();
//
//   const { data, error } = await client
//     .from('licenca_sanitaria')
//     .select('*')
//     .eq('empresa_id', empresaId)
//     .order('created_at', { ascending: true });
//
//   if (error) throw error;
//   return (data || []).map(mapLicencaFromSupabase);
// }
//
// export async function salvarLicencasAtuais(empresaId, _rev, licencas = []) {
//   if (!empresaId) return null;
//   const client = getSupabase();
//   const payload = montarPayloadLicencas(empresaId, licencas);
//   const resultados = [];
//
//   const { data: existentes, error: erroBusca } = await client
//     .from('licenca_sanitaria')
//     .select('*')
//     .eq('empresa_id', empresaId);
//
//   if (erroBusca) throw erroBusca;
//
//   const existentesPorCevs = new Map();
//   (existentes || []).forEach(row => {
//     const chave = row.numero_cevs || '';
//     if (!existentesPorCevs.has(chave)) existentesPorCevs.set(chave, []);
//     existentesPorCevs.get(chave).push(row);
//   });
//
//   const cevsMantidos = new Set(payload.map(item => item.numero_cevs || ''));
//
//   for (const item of payload) {
//     const { id, idsOrigem = [], ...dados } = item;
//     const candidatos = existentesPorCevs.get(dados.numero_cevs || '') || [];
//     const existentePorId = candidatos.find(row => row.id === id) || null;
//     const registroPrincipal = existentePorId || candidatos[0] || null;
//
//     if (registroPrincipal?.id) {
//       const { data, error } = await client
//         .from('licenca_sanitaria')
//         .update(dados)
//         .eq('id', registroPrincipal.id)
//         .select()
//         .single();
//       if (error) throw error;
//       resultados.push(data);
//
//       // Se versões antigas criaram uma linha por CNAE, remove as duplicadas do mesmo CEVS.
//       const idsDuplicados = candidatos
//         .map(row => row.id)
//         .filter(rowId => rowId && rowId !== registroPrincipal.id);
//
//       if (idsDuplicados.length) {
//         const { error: erroDeleteDuplicados } = await client
//           .from('licenca_sanitaria')
//           .delete()
//           .in('id', idsDuplicados);
//         if (erroDeleteDuplicados) throw erroDeleteDuplicados;
//       }
//     } else {
//       const { data, error } = await client
//         .from('licenca_sanitaria')
//         .insert(dados)
//         .select()
//         .single();
//       if (error) throw error;
//       resultados.push(data);
//     }
//   }
//
//   // Remove licenças que foram excluídas no modal.
//   const idsParaExcluir = (existentes || [])
//     .filter(row => !cevsMantidos.has(row.numero_cevs || ''))
//     .map(row => row.id)
//     .filter(Boolean);
//
//   if (idsParaExcluir.length) {
//     const { error: erroDelete } = await client
//       .from('licenca_sanitaria')
//       .delete()
//       .in('id', idsParaExcluir);
//     if (erroDelete) throw erroDelete;
//   }
//
//   return resultados;
// }
//
================================================================================
*/

/*
================================================================================
FALLBACK / CÓDIGO ANTIGO DE EMPRESAS — NÃO EXECUTAR
================================================================================
Mantido temporariamente apenas para consulta durante os testes da migração para
CRUD.js. Todo este bloco está comentado, portanto NÃO interfere no frontend nem
nas operações com o Supabase.

Após validação definitiva do cadastro de empresa usando CRUD.js, este bloco pode
ser removido.

// Buscar empresas — versão antiga, antes do CRUD.js
export async function buscarEmpresas_ANTIGO_NAO_USAR() {
  const client = getSupabase();

  const { data, error } = await client
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapEmpresaFromSupabase);
}

// Salvar empresa — versão antiga, antes do CRUD.js
export async function salvarEmpresaAtual_ANTIGO_NAO_USAR(empresa) {
  const client = getSupabase();
  const payload = mapEmpresaToSupabase(empresa);
  const id = empresa?.Id || '';

  const operacao = isUuid(id)
    ? client.from('empresas').update(payload).eq('id', id).select().single()
    : client.from('empresas').insert(payload).select().single();

  const { data, error } = await operacao;
  if (error) throw error;
  return mapEmpresaFromSupabase(data);
}
================================================================================
*/
