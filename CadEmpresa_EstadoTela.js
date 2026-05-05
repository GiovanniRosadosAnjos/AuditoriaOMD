// CadEmpresa_EstadoTela.js
// Motor único para controlar visibilidade dos botões da tela de cadastro.

let estadoAtual = 'vazio';
let formMonitorado = null;

const ids = {
  salvarNovo: 'btnSalvarNovo',
  consultar: 'btnRevisarCadastro',
  cancelarOperacao: 'bntCancelarOperacao',
  habilitarEdicao: 'btnHabilitarEdicao',
  salvarEdicao: 'btnSalvarEdicao',
  cancelarEdicao: 'btnCancelarEdicao'
};

function el(id) {
  return document.getElementById(id);
}

function mostrar(id, visivel) {
  const elemento = el(id);
  if (!elemento) return;
  elemento.style.display = visivel ? 'inline-flex' : 'none';
}

function temCampoPreenchido(form) {
  if (!form) return false;

  const campos = [...form.querySelectorAll('input, textarea, select')]
    .filter(campo => campo.type !== 'hidden')
    .filter(campo => !campo.disabled);

  return campos.some(campo => {
    if (campo.type === 'checkbox' || campo.type === 'radio') return campo.checked;
    return (campo.value || '').trim() !== '';
  });
}

export function aplicarEstadoTela(estado) {
  estadoAtual = estado;

  switch (estado) {
    case 'vazio':
      mostrar(ids.salvarNovo, false);
      mostrar(ids.consultar, true);
      mostrar(ids.cancelarOperacao, false);
      mostrar(ids.habilitarEdicao, false);
      mostrar(ids.salvarEdicao, false);
      mostrar(ids.cancelarEdicao, false);
      break;

    case 'digitando':
      mostrar(ids.salvarNovo, true);
      mostrar(ids.consultar, false);
      mostrar(ids.cancelarOperacao, true);
      mostrar(ids.habilitarEdicao, false);
      mostrar(ids.salvarEdicao, false);
      mostrar(ids.cancelarEdicao, false);
      break;

    case 'visualizando':
      mostrar(ids.salvarNovo, false);
      mostrar(ids.consultar, false);
      mostrar(ids.cancelarOperacao, true);
      mostrar(ids.habilitarEdicao, true);
      mostrar(ids.salvarEdicao, false);
      mostrar(ids.cancelarEdicao, false);
      break;

    case 'editando':
      mostrar(ids.salvarNovo, false);
      mostrar(ids.consultar, false);
      mostrar(ids.cancelarOperacao, true);
      mostrar(ids.habilitarEdicao, false);
      mostrar(ids.salvarEdicao, true);
      mostrar(ids.cancelarEdicao, false);
      break;
  }
}

export function atualizarEstadoPorConteudo() {
  if (!formMonitorado) return;
  if (estadoAtual !== 'vazio' && estadoAtual !== 'digitando') return;
  aplicarEstadoTela(temCampoPreenchido(formMonitorado) ? 'digitando' : 'vazio');
}

export function inicializarEstadoTela(form) {
  formMonitorado = form;
  aplicarEstadoTela('vazio');

  if (!formMonitorado) return;

  formMonitorado.addEventListener('input', atualizarEstadoPorConteudo);
  formMonitorado.addEventListener('change', atualizarEstadoPorConteudo);
}

export function obterEstadoTela() {
  return estadoAtual;
}
