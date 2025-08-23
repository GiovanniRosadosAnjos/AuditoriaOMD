// 01_00_formState.js

const form = document.getElementById('formEmpresa');
const btnSalvarNovo = document.getElementById('btnSalvarNovo');
const btnHabilitarEdicao = document.getElementById('btnHabilitarEdicao');
const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');

/**
 * CORRIGIDO: Controla o estado (habilitado/desabilitado) de todos os campos do formulário.
 * @param {boolean} enabled - true para habilitar, false para desabilitar.
 */
export function setFormEnabled(enabled) {
  // Seleciona todos os inputs, textareas, selects e botões DENTRO do formulário
  const fields = form.querySelectorAll('input, textarea, select, button');
  
  fields.forEach(field => {
    // Ignora os botões de ação principais que estão no topo do formulário
    if (field.closest('#formActions')) {
      return;
    }
    // Define o estado de 'disabled' para todos os outros campos
    field.disabled = !enabled;
  });
}

/**
 * Gerencia quais botões de ação são visíveis com base no modo.
 * @param {'novo' | 'consulta' | 'edicao'} mode - O modo atual do formulário.
 */
export function setFormMode(mode) {
  btnSalvarNovo.style.display = 'none';
  btnHabilitarEdicao.style.display = 'none';
  btnSalvarEdicao.style.display = 'none';
  btnCancelarEdicao.style.display = 'none';

  if (mode === 'novo') {
    setFormEnabled(true);
    btnSalvarNovo.style.display = 'inline-block';
  } else if (mode === 'consulta') {
    setFormEnabled(false);
    btnHabilitarEdicao.style.display = 'inline-block';
  } else if (mode === 'edicao') {
    setFormEnabled(true);
    btnSalvarEdicao.style.display = 'inline-block';
    btnCancelarEdicao.style.display = 'inline-block';
  }
}
