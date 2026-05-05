// CadEmpresa_Saude.js
// Módulo isolado para Saúde Ocupacional (PGR / PCMSO).
// Frontend apenas. Sem integração com Supabase nesta revisão.

import { normalizarCampoDataBR, normalizarDataInput, dataParaBR } from './utils_data.js';
import { vincularCorCampos, aplicarCorCampos } from './utils_cor_campo.js';

function el(id) {
  return document.getElementById(id);
}

let registrosSST = [];
let indiceRegistroSST = -1;
let modoEdicaoSST = false;


function obterDadosHidden() {
  return {
    pgr_data_emissao: normalizarDataInput(el('sstPgrDataEmissao')?.value || ''),
    pgr_emitido_por: (el('sstPgrEmitidoPor')?.value || '').trim(),
    pgr_responsavel_tecnico: (el('sstPgrResponsavelTecnico')?.value || '').trim(),
    pgr_crea: (el('sstPgrCREA')?.value || '').trim(),
    pgr_periodo_de: normalizarDataInput(el('sstPgrPeriodoDe')?.value || ''),
    pgr_periodo_ate: normalizarDataInput(el('sstPgrPeriodoAte')?.value || ''),
    pgr_observacoes: el('sstPgrObservacoes')?.value || '',

    pcmso_data_emissao: normalizarDataInput(el('sstPcmsoDataEmissao')?.value || ''),
    pcmso_emitido_por: (el('sstPcmsoEmitidoPor')?.value || '').trim(),
    pcmso_cnae: (el('sstPcmsoCNAE')?.value || '').trim(),
    pcmso_medico_responsavel: (el('sstPcmsoMedicoResponsavel')?.value || '').trim(),
    pcmso_conselho: (el('sstPcmsoConselho')?.value || '').trim(),
    pcmso_especialidade: (el('sstPcmsoEspecialidade')?.value || '').trim(),
    pcmso_periodo_de: normalizarDataInput(el('sstPcmsoPeriodoDe')?.value || ''),
    pcmso_periodo_ate: normalizarDataInput(el('sstPcmsoPeriodoAte')?.value || ''),
    pcmso_observacoes: el('sstPcmsoObservacoes')?.value || ''
  };
}

function obterDadosModal() {
  return {
    pgr_data_emissao: normalizarDataInput(el('modalSSTPgrDataEmissao')?.value || ''),
    pgr_emitido_por: (el('modalSSTPgrEmitidoPor')?.value || '').trim(),
    pgr_responsavel_tecnico: (el('modalSSTPgrResponsavelTecnico')?.value || '').trim(),
    pgr_crea: (el('modalSSTPgrCREA')?.value || '').trim(),
    pgr_periodo_de: normalizarDataInput(el('modalSSTPgrPeriodoDe')?.value || ''),
    pgr_periodo_ate: normalizarDataInput(el('modalSSTPgrPeriodoAte')?.value || ''),
    pgr_observacoes: el('modalSSTPgrObservacoes')?.value || '',

    pcmso_data_emissao: normalizarDataInput(el('modalSSTPcmsoDataEmissao')?.value || ''),
    pcmso_emitido_por: (el('modalSSTPcmsoEmitidoPor')?.value || '').trim(),
    pcmso_cnae: (el('modalSSTPcmsoCNAE')?.value || '').trim(),
    pcmso_medico_responsavel: (el('modalSSTPcmsoMedicoResponsavel')?.value || '').trim(),
    pcmso_conselho: (el('modalSSTPcmsoConselho')?.value || '').trim(),
    pcmso_especialidade: (el('modalSSTPcmsoEspecialidade')?.value || '').trim(),
    pcmso_periodo_de: normalizarDataInput(el('modalSSTPcmsoPeriodoDe')?.value || ''),
    pcmso_periodo_ate: normalizarDataInput(el('modalSSTPcmsoPeriodoAte')?.value || ''),
    pcmso_observacoes: el('modalSSTPcmsoObservacoes')?.value || ''
  };
}

function temDados(dados) {
  return Object.values(dados || {}).some(v => String(v || '').trim());
}

function preencherCampos(dados = {}) {
  const mapa = {
    sstPgrDataEmissao: 'pgr_data_emissao',
    sstPgrEmitidoPor: 'pgr_emitido_por',
    sstPgrResponsavelTecnico: 'pgr_responsavel_tecnico',
    sstPgrCREA: 'pgr_crea',
    sstPgrPeriodoDe: 'pgr_periodo_de',
    sstPgrPeriodoAte: 'pgr_periodo_ate',
    sstPgrObservacoes: 'pgr_observacoes',
    sstPcmsoDataEmissao: 'pcmso_data_emissao',
    sstPcmsoEmitidoPor: 'pcmso_emitido_por',
    sstPcmsoCNAE: 'pcmso_cnae',
    sstPcmsoMedicoResponsavel: 'pcmso_medico_responsavel',
    sstPcmsoConselho: 'pcmso_conselho',
    sstPcmsoEspecialidade: 'pcmso_especialidade',
    sstPcmsoPeriodoDe: 'pcmso_periodo_de',
    sstPcmsoPeriodoAte: 'pcmso_periodo_ate',
    sstPcmsoObservacoes: 'pcmso_observacoes',

    modalSSTPgrDataEmissao: 'pgr_data_emissao',
    modalSSTPgrEmitidoPor: 'pgr_emitido_por',
    modalSSTPgrResponsavelTecnico: 'pgr_responsavel_tecnico',
    modalSSTPgrCREA: 'pgr_crea',
    modalSSTPgrPeriodoDe: 'pgr_periodo_de',
    modalSSTPgrPeriodoAte: 'pgr_periodo_ate',
    modalSSTPgrObservacoes: 'pgr_observacoes',
    modalSSTPcmsoDataEmissao: 'pcmso_data_emissao',
    modalSSTPcmsoEmitidoPor: 'pcmso_emitido_por',
    modalSSTPcmsoCNAE: 'pcmso_cnae',
    modalSSTPcmsoMedicoResponsavel: 'pcmso_medico_responsavel',
    modalSSTPcmsoConselho: 'pcmso_conselho',
    modalSSTPcmsoEspecialidade: 'pcmso_especialidade',
    modalSSTPcmsoPeriodoDe: 'pcmso_periodo_de',
    modalSSTPcmsoPeriodoAte: 'pcmso_periodo_ate',
    modalSSTPcmsoObservacoes: 'pcmso_observacoes'
  };

  Object.entries(mapa).forEach(([id, chave]) => {
    const campo = el(id);
    if (!campo) return;

    const valor = dados[chave] || '';
    const campoDataModal = campo.classList && campo.classList.contains('sst-data-br');
    campo.value = campoDataModal ? dataParaBR(valor) : valor;
  });

  aplicarCorCampos(el('modalSST'));
  atualizarStatusResumo();
}

function atualizarStatusResumo() {
  const span = el('sstStatusResumo');
  if (!span) return;
  const dados = obterDadosHidden();

  if (!temDados(dados)) {
    span.textContent = 'Saúde Ocupacional: Não preenchido';
    span.style.color = 'black';
    return;
  }

  const partes = [];
  if (dados.pgr_periodo_de || dados.pgr_periodo_ate) {
    partes.push(`PGR ${dataParaBR(dados.pgr_periodo_de) || '?'} a ${dataParaBR(dados.pgr_periodo_ate) || '?'}`);
  } else if (dados.pgr_data_emissao || dados.pgr_emitido_por || dados.pgr_observacoes) {
    partes.push('PGR registrado');
  }

  if (dados.pcmso_periodo_de || dados.pcmso_periodo_ate) {
    partes.push(`PCMSO ${dataParaBR(dados.pcmso_periodo_de) || '?'} a ${dataParaBR(dados.pcmso_periodo_ate) || '?'}`);
  } else if (dados.pcmso_data_emissao || dados.pcmso_emitido_por || dados.pcmso_observacoes) {
    partes.push('PCMSO registrado');
  }

  span.textContent = `Saúde Ocupacional: ${partes.length ? partes.join(' | ') : 'registrado'}`;
  span.style.color = 'green';
}

function confirmarModalNoFormulario() {
  preencherCampos(obterDadosModal());
}

function setCamposModalSSTHabilitados(habilitado) {
  const modal = el('modalSST');
  if (!modal) return;
  modal.querySelectorAll('.sst-tabela-comparativa input, .sst-tabela-comparativa textarea').forEach(campo => {
    if (campo.id === 'modalSSTPgrCNAE' || campo.id === 'modalSSTPgrEspecialidade') {
      campo.disabled = true;
      return;
    }
    campo.disabled = !habilitado;
  });
}

function atualizarIndicadorRegistro(texto = 'Registro atual') {
  const indicador = el('sstIndicadorRegistro');
  if (indicador) indicador.textContent = texto;
}

function limparCamposModalSST() {
  preencherCampos({});
}

function obterBotoesSST() {
  return {
    btnNovo: el('btnSSTNovoRegistro'),
    btnEditar: el('btnSSTEditarRegistro'),
    btnAnterior: el('btnSSTAnteriorRegistro'),
    btnProximo: el('btnSSTProximoRegistro')
  };
}

function atualizarEstadoBotoesSST() {
  const { btnNovo, btnEditar, btnAnterior, btnProximo } = obterBotoesSST();
  const total = registrosSST.length;

  if (btnNovo) btnNovo.disabled = false;
  if (btnEditar) btnEditar.disabled = total === 0;
  if (btnAnterior) btnAnterior.disabled = total <= 1 || indiceRegistroSST <= 0;
  if (btnProximo) btnProximo.disabled = total <= 1 || indiceRegistroSST >= total - 1;

  if (total === 0) {
    atualizarIndicadorRegistro('Nenhum registro cadastrado');
  } else {
    atualizarIndicadorRegistro(`Registro ${indiceRegistroSST + 1} de ${total}`);
  }
}

function travarModalSSTSeNecessario() {
  setCamposModalSSTHabilitados(modoEdicaoSST || registrosSST.length === 0);
}

function carregarRegistroAtualNoModal() {
  if (registrosSST.length === 0 || indiceRegistroSST < 0) {
    limparCamposModalSST();
    return;
  }
  preencherCampos(registrosSST[indiceRegistroSST]);
}

function iniciarEstadoSSTAoAbrir() {
  const dadosAtuais = obterDadosHidden();
  registrosSST = temDados(dadosAtuais) ? [dadosAtuais] : [];
  indiceRegistroSST = registrosSST.length ? 0 : -1;
  modoEdicaoSST = registrosSST.length === 0;
  carregarRegistroAtualNoModal();
  travarModalSSTSeNecessario();
  atualizarEstadoBotoesSST();
}

export function limparSaude() {
  registrosSST = [];
  indiceRegistroSST = -1;
  modoEdicaoSST = false;
  preencherCampos({});
  atualizarEstadoBotoesSST();
}

export function inicializarSaude() {
  const modal = el('modalSST');
  const btnAbrir = el('btnAbrirModalSST');
  const btnCancelar = el('btnCancelarSST');
  const btnSalvar = el('btnSalvarSST');
  const btnNovo = el('btnSSTNovoRegistro');
  const btnEditar = el('btnSSTEditarRegistro');
  const btnAnterior = el('btnSSTAnteriorRegistro');
  const btnProximo = el('btnSSTProximoRegistro');

  if (!modal || !btnAbrir || !btnCancelar || !btnSalvar) return;

  vincularCorCampos(modal);

  modal.querySelectorAll('.sst-data-br').forEach(campo => {
    campo.addEventListener('blur', () => normalizarCampoDataBR(campo));
  });

  btnAbrir.addEventListener('click', () => {
    iniciarEstadoSSTAoAbrir();
    modal.showModal();
  });

  if (btnNovo) {
    btnNovo.addEventListener('click', () => {
      registrosSST.push({});
      indiceRegistroSST = registrosSST.length - 1;
      modoEdicaoSST = true;
      limparCamposModalSST();
      setCamposModalSSTHabilitados(true);
      aplicarCorCampos(modal);
      atualizarEstadoBotoesSST();
      atualizarIndicadorRegistro(`Novo registro (${indiceRegistroSST + 1} de ${registrosSST.length})`);
    });
  }

  if (btnEditar) {
    btnEditar.addEventListener('click', () => {
      if (registrosSST.length === 0) return;
      modoEdicaoSST = true;
      setCamposModalSSTHabilitados(true);
      aplicarCorCampos(modal);
      atualizarIndicadorRegistro(`Editando registro ${indiceRegistroSST + 1} de ${registrosSST.length}`);
    });
  }

  if (btnAnterior) {
    btnAnterior.addEventListener('click', () => {
      if (indiceRegistroSST <= 0) return;
      registrosSST[indiceRegistroSST] = obterDadosModal();
      indiceRegistroSST -= 1;
      modoEdicaoSST = false;
      carregarRegistroAtualNoModal();
      travarModalSSTSeNecessario();
      atualizarEstadoBotoesSST();
    });
  }

  if (btnProximo) {
    btnProximo.addEventListener('click', () => {
      if (indiceRegistroSST >= registrosSST.length - 1) return;
      registrosSST[indiceRegistroSST] = obterDadosModal();
      indiceRegistroSST += 1;
      modoEdicaoSST = false;
      carregarRegistroAtualNoModal();
      travarModalSSTSeNecessario();
      atualizarEstadoBotoesSST();
    });
  }

  atualizarEstadoBotoesSST();

  btnCancelar.addEventListener('click', () => modal.close());

  btnSalvar.addEventListener('click', () => {
    const datasValidas = Array.from(modal.querySelectorAll('.sst-data-br')).every(campo => normalizarCampoDataBR(campo));
    if (!datasValidas) return;

    const dados = obterDadosModal();
    if (indiceRegistroSST >= 0) {
      registrosSST[indiceRegistroSST] = dados;
    } else if (temDados(dados)) {
      registrosSST.push(dados);
      indiceRegistroSST = 0;
    }

    confirmarModalNoFormulario();
    modoEdicaoSST = false;
    atualizarEstadoBotoesSST();
    modal.close();
  });

  atualizarStatusResumo();
}
