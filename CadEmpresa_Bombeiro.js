// CadEmpresa_Bombeiro.js
// Módulo isolado para AVCB/CLCB (Bombeiro).
// Não altera Licença Sanitária nem funções globais existentes.

const TABELA_BOMBEIRO = 'bombeiro';

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

export function calcularStatusBombeiro(validade) {
  const data = normalizarDataInput(validade);
  if (!data) return '';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataValidade = new Date(`${data}T00:00:00`);
  if (Number.isNaN(dataValidade.getTime())) return '';

  return dataValidade < hoje ? 'vencido' : 'em vigor';
}

function statusParaTela(status = '') {
  const s = String(status || '').toLowerCase();
  if (s === 'vencido') return 'Vencido';
  if (s === 'em vigor') return 'Em vigor';
  return '';
}

function obterDadosHidden() {
  const validade = el('bombeirosValidade')?.value || '';
  return {
    tipo_licenca: (el('bombeirosTipo')?.value || '').trim(),
    numero: (el('bombeirosNumero')?.value || '').trim(),
    validade: normalizarDataInput(validade),
    status: calcularStatusBombeiro(validade),
    observacoes: el('bombeirosObservacoes')?.value || ''
  };
}

function obterDadosModal() {
  const validade = el('modalBombeirosValidade')?.value || '';
  return {
    tipo_licenca: (el('modalBombeirosTipo')?.value || '').trim(),
    numero: (el('modalBombeirosNumero')?.value || '').trim(),
    validade: normalizarDataInput(validade),
    status: calcularStatusBombeiro(validade),
    observacoes: el('modalBombeirosObservacoes')?.value || ''
  };
}

function obterDadosDaTela() {
  // Para gravação no Supabase, usa somente os campos já confirmados no formulário.
  // O modal só confirma esses campos ao clicar em "Salvar" dentro do próprio modal.
  return obterDadosHidden();
}

function temDados(dados = obterDadosDaTela()) {
  return Boolean(dados.tipo_licenca || dados.numero || dados.validade || dados.observacoes);
}

function preencherCampos(dados = {}) {
  const tipo = dados.tipo_licenca || dados.Tipo || '';
  const numero = dados.numero || dados.Numero || '';
  const validade = normalizarDataInput(dados.validade || dados.Validade || '');
  const status = calcularStatusBombeiro(validade);
  const observacoes = dados.observacoes || dados.Observacoes || '';

  if (el('bombeirosTipo')) el('bombeirosTipo').value = tipo;
  if (el('bombeirosNumero')) el('bombeirosNumero').value = numero;
  if (el('bombeirosValidade')) el('bombeirosValidade').value = validade;
  if (el('bombeirosStatusValor')) el('bombeirosStatusValor').value = status;
  if (el('bombeirosObservacoes')) el('bombeirosObservacoes').value = observacoes;

  if (el('modalBombeirosTipo')) el('modalBombeirosTipo').value = tipo;
  if (el('modalBombeirosNumero')) el('modalBombeirosNumero').value = numero;
  if (el('modalBombeirosValidade')) el('modalBombeirosValidade').value = validade;
  if (el('modalBombeirosStatus')) el('modalBombeirosStatus').value = statusParaTela(status);
  if (el('modalBombeirosObservacoes')) el('modalBombeirosObservacoes').value = observacoes;

  atualizarStatusResumo();
}

function confirmarModalNoFormulario() {
  const dados = obterDadosModal();
  preencherCampos(dados);
}

function atualizarStatusModal() {
  const validade = el('modalBombeirosValidade')?.value || '';
  const status = calcularStatusBombeiro(validade);
  if (el('modalBombeirosStatus')) el('modalBombeirosStatus').value = statusParaTela(status);
}

function atualizarStatusResumo() {
  const span = el('bombeirosStatus');
  if (!span) return;

  const tipo = el('bombeirosTipo')?.value || '';
  const numero = el('bombeirosNumero')?.value || '';
  const validade = el('bombeirosValidade')?.value || '';
  const status = calcularStatusBombeiro(validade);

  if (el('bombeirosStatusValor')) el('bombeirosStatusValor').value = status;

  if (!tipo && !numero && !validade) {
    span.textContent = 'Licença de Bombeiros: Não preenchida';
    span.style.color = 'black';
    return;
  }

  let texto = `Licença de Bombeiros: ${tipo || 'Tipo não informado'}`;
  if (numero) texto += ` - Nº ${numero}`;
  if (validade) texto += ` (Validade: ${new Date(`${validade}T00:00:00`).toLocaleDateString('pt-BR')}`;
  if (validade && status) texto += ` - ${statusParaTela(status)}`;
  if (validade) texto += ')';

  span.textContent = texto;
  span.style.color = status === 'vencido' ? '#c00000' : 'green';
}

export async function buscarBombeiroPorEmpresa(empresaId) {
  if (!empresaId) return null;
  const client = getSupabase();

  const { data, error } = await client
    .from(TABELA_BOMBEIRO)
    .select('*')
    .eq('empresa_id', empresaId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function carregarBombeiroPorEmpresa(empresaId) {
  if (!empresaId) {
    limparBombeiro();
    return null;
  }

  const data = await buscarBombeiroPorEmpresa(empresaId);
  if (data) preencherCampos(data);
  else limparBombeiro();
  return data;
}

export async function salvarBombeiroPorEmpresa(empresaId) {
  if (!empresaId) throw new Error('empresa_id não informado para salvar Bombeiro.');

  const dados = obterDadosDaTela();
  if (!temDados(dados)) return null;

  const client = getSupabase();
  const payload = {
    empresa_id: empresaId,
    tipo_licenca: dados.tipo_licenca,
    numero: dados.numero,
    validade: dados.validade || null,
    status: dados.status || null,
    observacoes: dados.observacoes || ''
  };

  const existente = await buscarBombeiroPorEmpresa(empresaId);

  if (existente?.id) {
    const { data, error } = await client
      .from(TABELA_BOMBEIRO)
      .update(payload)
      .eq('id', existente.id)
      .select()
      .single();
    if (error) throw error;
    preencherCampos(data);
    return data;
  }

  const { data, error } = await client
    .from(TABELA_BOMBEIRO)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  preencherCampos(data);
  return data;
}

export function limparBombeiro() {
  preencherCampos({ tipo_licenca: '', numero: '', validade: '', observacoes: '' });
}

export function inicializarBombeiro() {
  const modal = el('modalBombeiros');
  const modalTipo = el('modalBombeirosTipoConsulta');
  const btnAbrir = el('btnAbrirModalBombeiros');
  const btnCancelar = el('btnCancelarBombeiros');
  const btnSalvar = el('btnSalvarBombeiros');
  const btnFecharTipo = el('btnFecharModalBombeirosTipo');
  const inputTipo = el('modalBombeirosTipo');
  const inputValidade = el('modalBombeirosValidade');
  const inputNumero = el('modalBombeirosNumero');
  const observacoes = el('modalBombeirosObservacoes');

  if (!modal || !modalTipo || !btnAbrir || !btnCancelar || !btnSalvar || !inputTipo) return;

  btnAbrir.addEventListener('click', () => {
    preencherCampos({
      tipo_licenca: el('bombeirosTipo')?.value || '',
      numero: el('bombeirosNumero')?.value || '',
      validade: el('bombeirosValidade')?.value || '',
      observacoes: el('bombeirosObservacoes')?.value || ''
    });
    modal.showModal();
  });

  btnCancelar.addEventListener('click', () => modal.close());
  btnFecharTipo?.addEventListener('click', () => modalTipo.close());

  inputTipo.addEventListener('dblclick', () => modalTipo.showModal());

  modalTipo.querySelectorAll('tbody tr[data-tipo]').forEach(tr => {
    tr.addEventListener('dblclick', () => {
      inputTipo.value = tr.dataset.tipo || '';
      modalTipo.close();
      atualizarStatusModal();
    });
  });

  inputValidade?.addEventListener('input', atualizarStatusModal);
  inputValidade?.addEventListener('change', atualizarStatusModal);

  btnSalvar.addEventListener('click', () => {
    confirmarModalNoFormulario();
    modal.close();
  });

  atualizarStatusResumo();
}
