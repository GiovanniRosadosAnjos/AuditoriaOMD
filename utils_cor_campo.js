// utils_cor_campo.js
// Utilitário visual reutilizável para campos de entrada.
// Regra de prioridade:
// 1) inválido = vermelho
// 2) preenchido = branco
// 3) vazio = amarelo

function garantirIdCampo(campo) {
  if (!campo) return '';
  if (!campo.id) {
    const seq = document.querySelectorAll('[data-utils-campo-id]').length + 1;
    campo.id = `campo_auto_${Date.now()}_${seq}`;
    campo.dataset.utilsCampoId = campo.id;
  }
  return campo.id;
}

function obterAvisoCampo(campo, tipo = 'geral') {
  if (!campo) return null;
  const campoId = garantirIdCampo(campo);
  if (!campoId) return null;

  const avisoId = `${campoId}_aviso_${tipo}`;
  let aviso = document.getElementById(avisoId);

  if (!aviso) {
    aviso = document.createElement('div');
    aviso.id = avisoId;
    aviso.className = 'campo-aviso-validacao';
    campo.insertAdjacentElement('afterend', aviso);
  }

  return aviso;
}

export function limparAvisosCampo(campo) {
  if (!campo) return;
  const campoId = garantirIdCampo(campo);
  if (!campoId) return;
  document.querySelectorAll(`[id^="${campoId}_aviso_"]`).forEach(aviso => {
    aviso.style.display = 'none';
    aviso.textContent = '';
  });
}

export function marcarCampoInvalido(campo, mensagem = 'Campo inválido.', tipo = 'geral') {
  if (!campo) return;
  campo.classList.add('campo-invalido');
  campo.classList.remove('campo-preenchido', 'campo-vazio');
  campo.title = mensagem;

  const aviso = obterAvisoCampo(campo, tipo);
  if (aviso) {
    aviso.textContent = mensagem;
    aviso.style.display = 'block';
  }
}

export function atualizarCorCampo(campo) {
  if (!campo) return;
  if (campo.disabled || campo.readOnly) return;

  campo.classList.remove('campo-invalido');
  campo.title = '';
  limparAvisosCampo(campo);

  if (String(campo.value || '').trim()) {
    campo.classList.add('campo-preenchido');
    campo.classList.remove('campo-vazio');
  } else {
    campo.classList.add('campo-vazio');
    campo.classList.remove('campo-preenchido');
  }
}

export function aplicarCorCampos(container) {
  const base = container || document;
  base.querySelectorAll('input, textarea, select').forEach(campo => atualizarCorCampo(campo));
}

export function vincularCorCampos(container) {
  const base = container || document;
  base.querySelectorAll('input, textarea, select').forEach(campo => {
    if (campo.dataset.corCampoVinculada === '1') return;
    campo.dataset.corCampoVinculada = '1';
    campo.addEventListener('input', () => atualizarCorCampo(campo));
    campo.addEventListener('change', () => atualizarCorCampo(campo));
    campo.addEventListener('blur', () => atualizarCorCampo(campo));
  });
  aplicarCorCampos(base);
}
