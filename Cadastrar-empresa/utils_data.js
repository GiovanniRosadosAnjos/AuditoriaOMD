// utils_data.js
// Utilitários reutilizáveis para datas em formato brasileiro.
// Padrão visual: dd/mm/aaaa.
// Padrão interno/DB: aaaa-mm-dd.

import { marcarCampoInvalido, atualizarCorCampo } from './utils_cor_campo.js';

export function prepararDataDigitada(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return '';

  const somenteNumeros = texto.replace(/\D/g, '');
  if (somenteNumeros.length === 8) {
    return `${somenteNumeros.slice(0, 2)}/${somenteNumeros.slice(2, 4)}/${somenteNumeros.slice(4)}`;
  }

  return texto;
}

export function dataBRValida(valor) {
  const texto = prepararDataDigitada(valor);
  if (!texto) return true;

  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;

  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  const data = new Date(ano, mes - 1, dia);

  return data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia;
}

export function normalizarCampoDataBR(campo) {
  if (!campo) return true;

  const texto = prepararDataDigitada(campo.value);
  if (!texto) {
    campo.value = '';
    campo.classList.remove('campo-data-invalida');
    atualizarCorCampo(campo);
    return true;
  }

  if (!dataBRValida(texto)) {
    campo.classList.add('campo-data-invalida');
    marcarCampoInvalido(campo, 'Data inválida. Use dd/mm/aaaa.', 'data');
    return false;
  }

  campo.value = texto;
  campo.classList.remove('campo-data-invalida');
  atualizarCorCampo(campo);
  return true;
}

export function normalizarDataInput(valor) {
  if (!valor) return '';
  const raw = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];

  const texto = prepararDataDigitada(raw);
  const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br && dataBRValida(texto)) {
    return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  }

  return '';
}

export function dataParaBR(data) {
  const d = normalizarDataInput(data);
  if (!d) return '';
  return new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR');
}
