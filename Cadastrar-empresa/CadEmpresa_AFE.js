// CadEmpresa_AFE.js
// Módulo isolado para AFE (ANVISA).
// Rev89: integração pontual com CRUD.js + limpeza controlada do CRUD antigo como fallback comentado.
// Salva somente no botão principal "Salvar Alterações".

import { buscarRegistros, salvarRegistro } from './CRUD.js';
import { obterUsuarioIdAutenticado } from './utils_auth.js';

const TABELA_AFE = 'afe';

function el(id) {
  return document.getElementById(id);
}

function normalizarDataInput(valor) {
  if (!valor) return '';
  const raw = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  return '';
}

function dataParaBR(data) {
  const d = normalizarDataInput(data);
  if (!d) return '';
  return new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR');
}

function atualizarCNPJConsulta() {
  const destino = el('modalAFECNPJConsulta');
  if (!destino) return;
  const cnpjTela = (el('cnpj')?.value || '').trim();
  destino.textContent = cnpjTela || '-';
}

function obterDadosHidden() {
  return {
    numero: (el('afeNumero')?.value || '').trim(),
    data_autorizacao: normalizarDataInput(el('afeDataAutorizacao')?.value || ''),
    processo: (el('afeProcesso')?.value || '').trim(),
    situacao: (el('afeSituacao')?.value || '').trim(),
    observacoes: el('afeObservacoes')?.value || ''
  };
}

function obterDadosModal() {
  return {
    numero: (el('modalAFENumero')?.value || '').trim(),
    data_autorizacao: normalizarDataInput(el('modalAFEDataAutorizacao')?.value || ''),
    processo: (el('modalAFEProcesso')?.value || '').trim(),
    situacao: (el('modalAFESituacao')?.value || '').trim(),
    observacoes: el('modalAFEObservacoes')?.value || ''
  };
}

function temDados(dados) {
  return Boolean(dados.numero || dados.data_autorizacao || dados.processo || dados.situacao || dados.observacoes);
}

function mapAFEFromSupabase(row = {}) {
  return {
    id: row.id || '',
    empresa_id: row.empresa_id || '',
    numero: row.numero_autorizacao || '',
    data_autorizacao: row.data_autorizacao || '',
    processo: row.numero_processo || '',
    situacao: row.situacao || '',
    observacoes: row.observacoes || '',
    criado_por: row.criado_por || '',
    alterado_por: row.alterado_por || '',
    created_at: row.created_at || '',
    updated_at: row.updated_at || ''
  };
}

function mapAFEToSupabase(dados = {}, empresaId) {
  return {
    empresa_id: empresaId,
    numero_autorizacao: dados.numero || '',
    data_autorizacao: dados.data_autorizacao || null,
    numero_processo: dados.processo || '',
    situacao: dados.situacao || '',
    observacoes: dados.observacoes || ''
  };
}

function atualizarStatusResumo() {
  const span = el('afeStatusResumo');
  if (!span) return;

  const dados = obterDadosHidden();
  if (!temDados(dados)) {
    span.textContent = 'AFE (ANVISA): Não preenchida';
    span.style.color = 'black';
    return;
  }

  let texto = 'AFE (ANVISA):';
  if (dados.numero) texto += ` Nº ${dados.numero}`;
  if (dados.situacao) texto += ` - ${dados.situacao}`;
  if (dados.data_autorizacao) texto += ` (Autorização: ${dataParaBR(dados.data_autorizacao)})`;

  span.textContent = texto;
  span.style.color = dados.situacao === 'Inativa' ? '#c00000' : 'green';
}

function preencherCampos(dados = {}) {
  const numero = dados.numero || dados.Numero || '';
  const dataAutorizacao = normalizarDataInput(dados.data_autorizacao || dados.DataAutorizacao || '');
  const processo = dados.processo || dados.Processo || '';
  const situacao = dados.situacao || dados.Situacao || '';
  const observacoes = dados.observacoes || dados.Observacoes || '';

  if (el('afeNumero')) el('afeNumero').value = numero;
  if (el('afeDataAutorizacao')) el('afeDataAutorizacao').value = dataAutorizacao;
  if (el('afeProcesso')) el('afeProcesso').value = processo;
  if (el('afeSituacao')) el('afeSituacao').value = situacao;
  if (el('afeObservacoes')) el('afeObservacoes').value = observacoes;

  if (el('modalAFENumero')) el('modalAFENumero').value = numero;
  if (el('modalAFEDataAutorizacao')) el('modalAFEDataAutorizacao').value = dataAutorizacao;
  if (el('modalAFEProcesso')) el('modalAFEProcesso').value = processo;
  if (el('modalAFESituacao')) el('modalAFESituacao').value = situacao;
  if (el('modalAFEObservacoes')) el('modalAFEObservacoes').value = observacoes;

  atualizarStatusResumo();
}

function confirmarModalNoFormulario() {
  preencherCampos(obterDadosModal());
}

export async function buscarAFEPorEmpresa(empresaId) {
  if (!empresaId) return null;

  const registros = await buscarRegistros(TABELA_AFE, {
    filtros: [{ campo: 'empresa_id', valor: empresaId }],
    orderBy: 'created_at',
    ascending: false,
    limit: 1,
    mapper: mapAFEFromSupabase
  });

  return registros[0] || null;
}

export async function carregarAFEPorEmpresa(empresaId) {
  if (!empresaId) {
    limparAFE();
    return null;
  }

  const data = await buscarAFEPorEmpresa(empresaId);
  if (data) preencherCampos(data);
  else limparAFE();
  return data;
}

export async function salvarAFEPorEmpresa(empresaId) {
  if (!empresaId) throw new Error('empresa_id não informado para salvar AFE.');

  const dados = obterDadosHidden();
  if (!temDados(dados)) return null;

  const existente = await buscarAFEPorEmpresa(empresaId);
  const payload = mapAFEToSupabase(dados, empresaId);
  const userId = await obterUsuarioIdAutenticado();

  if (existente?.id) {
    payload.alterado_por = userId;
    payload.updated_at = new Date().toISOString();
  } else {
    payload.criado_por = userId;
  }

  const salvo = await salvarRegistro(TABELA_AFE, payload, {
    id: existente?.id || '',
    mapper: mapAFEFromSupabase
  });

  await carregarAFEPorEmpresa(empresaId);
  return salvo;
}

export function limparAFE() {
  preencherCampos({ numero: '', data_autorizacao: '', processo: '', situacao: '', observacoes: '' });
}

export function inicializarAFE() {
  const modal = el('modalAFE');
  const btnAbrir = el('btnAbrirModalAFE');
  const btnCancelar = el('btnCancelarAFE');
  const btnSalvar = el('btnSalvarAFE');

  if (!modal || !btnAbrir || !btnCancelar || !btnSalvar) return;

  btnAbrir.addEventListener('click', () => {
    preencherCampos(obterDadosHidden());
    atualizarCNPJConsulta();
    modal.showModal();
  });

  btnCancelar.addEventListener('click', () => modal.close());

  btnSalvar.addEventListener('click', () => {
    confirmarModalNoFormulario();
    modal.close();
  });

  atualizarStatusResumo();
}

/*
================================================================================
FALLBACK / CÓDIGO ANTIGO DE AFE — NÃO EXECUTAR
Mantido temporariamente apenas para consulta e rollback manual.
O fluxo ativo da Rev89 usa CRUD.js.
Remover após validação exaustiva do front-end x DB.
================================================================================

// CadEmpresa_AFE.js
// Módulo isolado para AFE (ANVISA).
// Integração isolada com Supabase. Salva somente no botão principal "Salvar Alterações".

const TABELA_AFE = 'afe';

function getSupabase() {
  const client = window.supabaseClient || null;
  if (!client) throw new Error('Supabase não configurado.');
  return client;
}

function el(id) {
  return document.getElementById(id);
}

function normalizarDataInput(valor) {
  if (!valor) return '';
  const raw = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  return '';
}

function dataParaBR(data) {
  const d = normalizarDataInput(data);
  if (!d) return '';
  return new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR');
}

function atualizarCNPJConsulta() {
  const destino = el('modalAFECNPJConsulta');
  if (!destino) return;
  const cnpjTela = (el('cnpj')?.value || '').trim();
  destino.textContent = cnpjTela || '-';
}

function obterDadosHidden() {
  return {
    numero: (el('afeNumero')?.value || '').trim(),
    data_autorizacao: normalizarDataInput(el('afeDataAutorizacao')?.value || ''),
    processo: (el('afeProcesso')?.value || '').trim(),
    situacao: (el('afeSituacao')?.value || '').trim(),
    observacoes: el('afeObservacoes')?.value || ''
  };
}

function obterDadosModal() {
  return {
    numero: (el('modalAFENumero')?.value || '').trim(),
    data_autorizacao: normalizarDataInput(el('modalAFEDataAutorizacao')?.value || ''),
    processo: (el('modalAFEProcesso')?.value || '').trim(),
    situacao: (el('modalAFESituacao')?.value || '').trim(),
    observacoes: el('modalAFEObservacoes')?.value || ''
  };
}

function temDados(dados) {
  return Boolean(dados.numero || dados.data_autorizacao || dados.processo || dados.situacao || dados.observacoes);
}

function atualizarStatusResumo() {
  const span = el('afeStatusResumo');
  if (!span) return;

  const dados = obterDadosHidden();
  if (!temDados(dados)) {
    span.textContent = 'AFE (ANVISA): Não preenchida';
    span.style.color = 'black';
    return;
  }

  let texto = 'AFE (ANVISA):';
  if (dados.numero) texto += ` Nº ${dados.numero}`;
  if (dados.situacao) texto += ` - ${dados.situacao}`;
  if (dados.data_autorizacao) texto += ` (Autorização: ${dataParaBR(dados.data_autorizacao)})`;

  span.textContent = texto;
  span.style.color = dados.situacao === 'Inativa' ? '#c00000' : 'green';
}

function preencherCampos(dados = {}) {
  const numero = dados.numero || dados.Numero || '';
  const dataAutorizacao = normalizarDataInput(dados.data_autorizacao || dados.DataAutorizacao || '');
  const processo = dados.processo || dados.Processo || '';
  const situacao = dados.situacao || dados.Situacao || '';
  const observacoes = dados.observacoes || dados.Observacoes || '';

  if (el('afeNumero')) el('afeNumero').value = numero;
  if (el('afeDataAutorizacao')) el('afeDataAutorizacao').value = dataAutorizacao;
  if (el('afeProcesso')) el('afeProcesso').value = processo;
  if (el('afeSituacao')) el('afeSituacao').value = situacao;
  if (el('afeObservacoes')) el('afeObservacoes').value = observacoes;

  if (el('modalAFENumero')) el('modalAFENumero').value = numero;
  if (el('modalAFEDataAutorizacao')) el('modalAFEDataAutorizacao').value = dataAutorizacao;
  if (el('modalAFEProcesso')) el('modalAFEProcesso').value = processo;
  if (el('modalAFESituacao')) el('modalAFESituacao').value = situacao;
  if (el('modalAFEObservacoes')) el('modalAFEObservacoes').value = observacoes;

  atualizarStatusResumo();
}

function confirmarModalNoFormulario() {
  preencherCampos(obterDadosModal());
}


export async function buscarAFEPorEmpresa(empresaId) {
  if (!empresaId) return null;
  const client = getSupabase();

  const { data, error } = await client
    .from(TABELA_AFE)
    .select('*')
    .eq('empresa_id', empresaId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function carregarAFEPorEmpresa(empresaId) {
  if (!empresaId) {
    limparAFE();
    return null;
  }

  const data = await buscarAFEPorEmpresa(empresaId);
  if (data) preencherCampos({
    numero: data.numero_autorizacao || '',
    data_autorizacao: data.data_autorizacao || '',
    processo: data.numero_processo || '',
    situacao: data.situacao || '',
    observacoes: data.observacoes || ''
  });
  else limparAFE();
  return data;
}

export async function salvarAFEPorEmpresa(empresaId) {
  if (!empresaId) throw new Error('empresa_id não informado para salvar AFE.');

  const dados = obterDadosHidden();
  if (!temDados(dados)) return null;

  const client = getSupabase();
  const payload = {
    empresa_id: empresaId,
    numero_autorizacao: dados.numero,
    data_autorizacao: dados.data_autorizacao || null,
    numero_processo: dados.processo,
    situacao: dados.situacao,
    observacoes: dados.observacoes || ''
  };

  const existente = await buscarAFEPorEmpresa(empresaId);

  if (existente?.id) {
    const { data, error } = await client
      .from(TABELA_AFE)
      .update({ ...payload, alterado_por: userId, updated_at: new Date().toISOString() })
      .eq('id', existente.id)
      .select()
      .single();
    if (error) throw error;
    await carregarAFEPorEmpresa(empresaId);
    return data;
  }

  const { data, error } = await client
    .from(TABELA_AFE)
    .insert({ ...payload, criado_por: userId })
    .select()
    .single();

  if (error) throw error;
  await carregarAFEPorEmpresa(empresaId);
  return data;
}

export function limparAFE() {
  preencherCampos({ numero: '', data_autorizacao: '', processo: '', situacao: '', observacoes: '' });
}

export function inicializarAFE() {
  const modal = el('modalAFE');
  const btnAbrir = el('btnAbrirModalAFE');
  const btnCancelar = el('btnCancelarAFE');
  const btnSalvar = el('btnSalvarAFE');

  if (!modal || !btnAbrir || !btnCancelar || !btnSalvar) return;

  btnAbrir.addEventListener('click', () => {
    preencherCampos(obterDadosHidden());
    atualizarCNPJConsulta();
    modal.showModal();
  });

  btnCancelar.addEventListener('click', () => modal.close());

  btnSalvar.addEventListener('click', () => {
    confirmarModalNoFormulario();
    modal.close();
  });

  atualizarStatusResumo();
}


================================================================================
FIM DO FALLBACK / CÓDIGO ANTIGO DE AFE
================================================================================
*/
