// CRUD.js
// Motor CRUD genérico e leve para Supabase.
// Objetivo: padronizar operações de dados sem refatorar tudo de uma vez.
// Nesta revisão o arquivo foi apenas criado. A integração será feita entidade por entidade.

function obterClienteSupabase() {
  const client = window.supabaseClient || null;
  if (!client) {
    throw new Error('Supabase não configurado. Verifique CadEmpresa_SupabaseClient.js.');
  }
  return client;
}

export function isUuid(valor = '') {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(valor || '').trim());
}

export function limparPayload(payload = {}) {
  const limpo = {};
  Object.entries(payload || {}).forEach(([chave, valor]) => {
    if (valor === undefined) return;
    limpo[chave] = valor;
  });
  return limpo;
}

export async function buscarRegistros(tabela, opcoes = {}) {
  const client = obterClienteSupabase();
  const {
    select = '*',
    filtros = [],
    orderBy = null,
    ascending = true,
    limit = null,
    mapper = row => row
  } = opcoes;

  let query = client.from(tabela).select(select);

  filtros.forEach(filtro => {
    const { campo, operador = 'eq', valor } = filtro || {};
    if (!campo || valor === undefined) return;
    if (typeof query[operador] !== 'function') {
      throw new Error(`Operador Supabase não suportado: ${operador}`);
    }
    query = query[operador](campo, valor);
  });

  if (orderBy) query = query.order(orderBy, { ascending });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapper);
}

export async function buscarRegistroPorId(tabela, id, opcoes = {}) {
  if (!isUuid(id)) return null;
  const client = obterClienteSupabase();
  const { select = '*', mapper = row => row } = opcoes;

  const { data, error } = await client
    .from(tabela)
    .select(select)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapper(data) : null;
}

export async function inserirRegistro(tabela, payload, opcoes = {}) {
  const client = obterClienteSupabase();
  const { select = '*', mapper = row => row } = opcoes;

  const { data, error } = await client
    .from(tabela)
    .insert(limparPayload(payload))
    .select(select)
    .single();

  if (error) throw error;
  return mapper(data);
}

export async function atualizarRegistro(tabela, id, payload, opcoes = {}) {
  if (!isUuid(id)) {
    throw new Error(`ID inválido para update em ${tabela}.`);
  }

  const client = obterClienteSupabase();
  const { select = '*', mapper = row => row } = opcoes;

  const { data, error } = await client
    .from(tabela)
    .update(limparPayload(payload))
    .eq('id', id)
    .select(select)
    .single();

  if (error) throw error;
  return mapper(data);
}

export async function salvarRegistro(tabela, payload, opcoes = {}) {
  const {
    id = payload?.id || payload?.Id || '',
    select = '*',
    mapper = row => row,
    removerIdDoPayload = true
  } = opcoes;

  const dados = { ...(payload || {}) };
  if (removerIdDoPayload) {
    delete dados.id;
    delete dados.Id;
  }

  if (isUuid(id)) {
    return atualizarRegistro(tabela, id, dados, { select, mapper });
  }

  return inserirRegistro(tabela, dados, { select, mapper });
}

export async function excluirRegistrosPorIds(tabela, ids = []) {
  const idsValidos = (Array.isArray(ids) ? ids : []).filter(isUuid);
  if (!idsValidos.length) return { count: 0 };

  const client = obterClienteSupabase();
  const { error } = await client
    .from(tabela)
    .delete()
    .in('id', idsValidos);

  if (error) throw error;
  return { count: idsValidos.length };
}

export async function sincronizarFilhosPorEmpresa(tabela, empresaId, lista = [], opcoes = {}) {
  if (!isUuid(empresaId)) return [];

  const {
    campoEmpresa = 'empresa_id',
    mapperToDb = item => item,
    mapperFromDb = row => row,
    select = '*',
    permitirExcluirAusentes = true,
    payloadExtraInsert = {}
  } = opcoes;

  const existentes = await buscarRegistros(tabela, {
    select: 'id',
    filtros: [{ campo: campoEmpresa, valor: empresaId }]
  });

  const idsMantidos = new Set();
  const resultados = [];

  for (const item of (Array.isArray(lista) ? lista : [])) {
    const itemId = item?.id || item?.Id || '';
    const payload = {
      ...mapperToDb(item),
      [campoEmpresa]: empresaId
    };

    if (isUuid(itemId)) {
      idsMantidos.add(itemId);
      const atualizado = await atualizarRegistro(tabela, itemId, payload, { select, mapper: mapperFromDb });
      resultados.push(atualizado);
    } else {
      const inserido = await inserirRegistro(tabela, { ...payload, ...payloadExtraInsert }, { select, mapper: mapperFromDb });
      if (inserido?.id) idsMantidos.add(inserido.id);
      resultados.push(inserido);
    }
  }

  if (permitirExcluirAusentes) {
    const idsParaExcluir = existentes
      .map(row => row.id)
      .filter(id => id && !idsMantidos.has(id));
    await excluirRegistrosPorIds(tabela, idsParaExcluir);
  }

  return resultados;
}
