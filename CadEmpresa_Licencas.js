// 01_00_LicencasSanitarias.js
// Motor do modal: Gerenciar Licenças Sanitárias
// Rev88: corrigida amarração das observações por linha para evitar conflito entre modais/campos genéricos.

import { normalizarCampoDataBR, normalizarDataInput, dataParaBR } from './utils_data.js';
import { vincularCorCampos, aplicarCorCampos, marcarCampoInvalido } from './utils_cor_campo.js';

const CNAES_PADRAO = [
  {
    subgrupo: 'FABRIL',
    agrupamento: 'INDÚSTRIA DE PRODUTOS PARA A SAÚDE',
    cnae: '2660-4/00',
    descricao: 'FABRICAÇÃO DE APARELHOS ELETROMÉDICOS...'
  },
  {
    subgrupo: 'DISTRIBUIDORA/IMPORTADORA',
    agrupamento: 'COMÉRCIO ATACADISTA DE PRODUTOS PARA A SAÚDE',
    cnae: '4645-1/01',
    descricao: 'COMÉRCIO ATACADISTA DE INSTRUMENTOS E MATERIAIS...'
  },
  {
    subgrupo: 'DISTRIBUIDORA/IMPORTADORA',
    agrupamento: 'COMÉRCIO ATACADISTA DE PRODUTOS PARA A SAÚDE',
    cnae: '4664-8/00',
    descricao: 'COMÉRCIO ATACADISTA DE MÁQUINAS, APARELHOS...'
  }
];

export function inicializarLicencasSanitarias({ getStore, setStore, atualizarStatus }) {
  const modal = document.getElementById('modalGerenciarLicencas');
  const btnAbrir = document.getElementById('btnAbrirModalLicenca');
  const btnCancelar = document.getElementById('btnCancelarModalLicencas');
  const btnSalvar = document.getElementById('btnSalvarModalLicencas');
  const tbodyLicencas = document.getElementById('licencasSanitariasTbody');
  const tbodyCnae = document.getElementById('licencasCnaeTbody');
  const modalCnaeConsulta = document.getElementById('modalLicencasCnaeConsulta');
  const btnFecharModalCnae = document.getElementById('btnFecharModalLicencasCnae');
  const observacoesModal = document.getElementById('licencasObservacoesModal');

  if (!modal || !btnAbrir || !btnCancelar || !btnSalvar || !tbodyLicencas || !tbodyCnae || !modalCnaeConsulta || !btnFecharModalCnae || !observacoesModal) return;

  let linhaAtiva = null;
  let inputCnaeAtivo = null;
  let licencasSnapshotModal = [];

  const clonarLicencas = (lista = []) => JSON.parse(JSON.stringify(Array.isArray(lista) ? lista : []));

  const salvarObservacoesLinhaAtiva = () => {
    if (linhaAtiva) linhaAtiva.dataset.observacoes = observacoesModal.value.trim();
  };

  const carregarObservacoesLinhaAtiva = () => {
    observacoesModal.value = linhaAtiva?.dataset.observacoes || '';
  };

  const selecionarLinha = (tr) => {
    if (!tr) return;
    if (linhaAtiva && linhaAtiva !== tr) salvarObservacoesLinhaAtiva();
    linhaAtiva = tr;
    destacarLinhaAtiva(tr);
    carregarObservacoesLinhaAtiva();
  };

  const separarCnaes = (valor = '') => String(valor || '')
    .split(';')
    .map(cnae => cnae.trim())
    .filter(Boolean);

  const normalizarCnaes = (licenca = {}) => {
    if (Array.isArray(licenca.cnaeItens) && licenca.cnaeItens.length) {
      const itens = licenca.cnaeItens.flatMap(item => {
        const partes = separarCnaes(item.cnae || item.CNAE || '');
        return partes.length
          ? partes.map(cnae => ({ id: item.id || '', cnae }))
          : [{ id: item.id || '', cnae: '' }];
      });
      return itens.length ? itens : [{ id: '', cnae: '' }];
    }
    if (Array.isArray(licenca.cnaes)) {
      return licenca.cnaes.flatMap(cnae => separarCnaes(cnae).map(valor => ({ id: licenca.id || '', cnae: valor })));
    }
    if (licenca.cnae) return separarCnaes(licenca.cnae).map(cnae => ({ id: licenca.id || '', cnae }));
    return [{ id: '', cnae: '' }];
  };

  const criarGrupoCnae = (valor = '', id = '') => {
    const grupo = document.createElement('div');
    grupo.className = 'lic-cnae-grupo';
    grupo.innerHTML = `
      <input type="text" class="lic-cnae" placeholder="Dê duplo clique para consultar" readonly>
      <button type="button" class="btnCnaeLinha" title="Adicionar CNAE">+</button>
    `;

    grupo.dataset.id = id || '';

    const input = grupo.querySelector('.lic-cnae');
    input.value = valor || '';

    input.addEventListener('focus', () => {
      inputCnaeAtivo = input;
      selecionarLinha(grupo.closest('tr'));
    });
    input.addEventListener('click', () => {
      inputCnaeAtivo = input;
      selecionarLinha(grupo.closest('tr'));
    });

    input.addEventListener('dblclick', () => {
      inputCnaeAtivo = input;
      selecionarLinha(grupo.closest('tr'));
      renderizarTabelaCnae();
      modalCnaeConsulta.showModal();
    });

    return grupo;
  };

  const atualizarBotoesCnae = (td) => {
    const grupos = [...td.querySelectorAll('.lic-cnae-grupo')];
    grupos.forEach((grupo, index) => {
      const btn = grupo.querySelector('.btnCnaeLinha');
      const primeiraLinha = index === 0;

      // Rev30: o botão + fica na primeira linha do CEVS;
      // as linhas adicionais recebem o botão de excluir, inclusive quando vazias.
      btn.textContent = primeiraLinha ? '+' : '−';
      btn.title = primeiraLinha ? 'Adicionar CNAE neste CEVS' : 'Remover este CNAE';
      btn.classList.toggle('btnCnaeAdd', primeiraLinha);
      btn.classList.toggle('btnCnaeRemove', !primeiraLinha);
      btn.onclick = () => {
        if (primeiraLinha) {
          td.appendChild(criarGrupoCnae());
        } else {
          grupo.remove();
          if (!td.querySelector('.lic-cnae-grupo')) td.appendChild(criarGrupoCnae());
        }
        atualizarBotoesCnae(td);
        sincronizarStorePelaTabela();
      };
    });
  };

  const destacarLinhaAtiva = (tr) => {
    tbodyLicencas.querySelectorAll('tr').forEach(r => r.classList.remove('linha-ativa'));
    if (tr) tr.classList.add('linha-ativa');
  };

  const criarLinhaLicenca = (licenca = {}) => {
    const tr = document.createElement('tr');
    tr.className = 'licenca-sanitaria-row';
    tr.dataset.observacoes = licenca.observacoes || licenca.Observacoes || '';
    tr.innerHTML = `
      <td><input type="text" class="lic-cevs" placeholder="Digite o Nº CEVS"></td>
      <td><input type="text" class="lic-validade campo-data-br" placeholder="dd/mm/aaaa" inputmode="numeric"></td>
      <td class="licenca-cnaes"></td>
      <td class="licenca-acoes"></td>
    `;

    tr.querySelector('.lic-cevs').value = licenca.cevs || '';
    tr.querySelector('.lic-validade').value = dataParaBR(licenca.validade || licenca.Validade || '');

    const tdCnaes = tr.querySelector('.licenca-cnaes');
    normalizarCnaes(licenca).forEach(item => tdCnaes.appendChild(criarGrupoCnae(item.cnae, item.id)));
    atualizarBotoesCnae(tdCnaes);

    ['focusin', 'click'].forEach(evt => {
      tr.addEventListener(evt, (e) => {
        selecionarLinha(tr);
        if (e.target.classList?.contains('lic-cnae')) inputCnaeAtivo = e.target;
      });
    });

    tr.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', sincronizarStorePelaTabela);
      input.addEventListener('change', sincronizarStorePelaTabela);
    });

    vincularCorCampos(tr);
    tr.querySelectorAll('.lic-validade').forEach(input => {
      input.addEventListener('blur', () => {
        normalizarCampoDataBR(input);
        sincronizarStorePelaTabela();
      });
    });
    aplicarCorCampos(tr);

    return tr;
  };

  const atualizarBotoesLicenca = () => {
    const linhas = [...tbodyLicencas.querySelectorAll('tr')];
    linhas.forEach((tr) => {
      const td = tr.querySelector('.licenca-acoes');
      td.innerHTML = '';

      const grupo = document.createElement('div');
      grupo.className = 'licenca-acoes-grupo';

      const btnAdd = document.createElement('button');
      btnAdd.type = 'button';
      btnAdd.className = 'btnLicencaAdd';
      btnAdd.textContent = '+';
      btnAdd.title = 'Adicionar novo CEVS abaixo';
      btnAdd.addEventListener('click', () => {
        salvarObservacoesLinhaAtiva();
        const novaLinha = criarLinhaLicenca();
        tr.insertAdjacentElement('afterend', novaLinha);
        selecionarLinha(novaLinha);
        atualizarBotoesLicenca();
        sincronizarStorePelaTabela();
      });

      const btnRemove = document.createElement('button');
      btnRemove.type = 'button';
      btnRemove.className = 'btnLicencaRemove';
      btnRemove.textContent = '−';
      btnRemove.title = 'Remover este CEVS';
      btnRemove.addEventListener('click', () => {
        salvarObservacoesLinhaAtiva();
        const eraAtiva = linhaAtiva === tr;
        tr.remove();
        if (!tbodyLicencas.children.length) tbodyLicencas.appendChild(criarLinhaLicenca());
        if (eraAtiva) selecionarLinha(tbodyLicencas.querySelector('tr'));
        atualizarBotoesLicenca();
        sincronizarStorePelaTabela();
      });

      grupo.appendChild(btnAdd);
      grupo.appendChild(btnRemove);
      td.appendChild(grupo);
    });
  };

  const renderizarLicencas = () => {
    tbodyLicencas.innerHTML = '';
    const licencas = getStore();
    if (Array.isArray(licencas) && licencas.length) {
      licencas.forEach(licenca => tbodyLicencas.appendChild(criarLinhaLicenca(licenca)));
    } else {
      tbodyLicencas.appendChild(criarLinhaLicenca());
    }
    linhaAtiva = tbodyLicencas.querySelector('tr');
    inputCnaeAtivo = linhaAtiva?.querySelector('.lic-cnae') || null;
    destacarLinhaAtiva(linhaAtiva);
    carregarObservacoesLinhaAtiva();
    atualizarBotoesLicenca();
    vincularCorCampos(tbodyLicencas);
    aplicarCorCampos(tbodyLicencas);
  };

  function sincronizarStorePelaTabela() {
    salvarObservacoesLinhaAtiva();
    const licencas = [...tbodyLicencas.querySelectorAll('tr')]
      .map(tr => {
        const cnaeItens = [...tr.querySelectorAll('.lic-cnae-grupo')]
          .map(grupo => ({
            id: grupo.dataset.id || '',
            cnae: grupo.querySelector('.lic-cnae')?.value.trim() || ''
          }))
          .filter(item => item.cnae);
        const cnaes = cnaeItens.map(item => item.cnae);
        return {
          cevs: tr.querySelector('.lic-cevs')?.value.trim() || '',
          validade: normalizarDataInput(tr.querySelector('.lic-validade')?.value || ''),
          cnaeItens,
          cnaes,
          cnae: cnaes.join('; '),
          observacoes: tr.dataset.observacoes || ''
        };
      })
      .filter(licenca => licenca.cevs || licenca.validade || licenca.cnaes.length);

    setStore(licencas);
  }

  const renderizarTabelaCnae = () => {
    tbodyCnae.innerHTML = '';
    CNAES_PADRAO.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'cnae-row-selector';
      tr.dataset.cnae = item.cnae;
      tr.innerHTML = `
        <td>${item.subgrupo}</td>
        <td>${item.agrupamento}</td>
        <td><strong>${item.cnae}</strong> ${item.descricao}</td>
      `;
      tr.addEventListener('dblclick', () => {
        const destinoInput = inputCnaeAtivo || linhaAtiva?.querySelector('.lic-cnae') || tbodyLicencas.querySelector('.lic-cnae');
        if (!destinoInput) return;
        selecionarLinha(destinoInput.closest('tr'));
        destinoInput.value = item.cnae;
        aplicarCorCampos(destinoInput.closest('tr'));
        sincronizarStorePelaTabela();
        modalCnaeConsulta.close();
      });
      tbodyCnae.appendChild(tr);
    });
  };



  const focarPrimeiroErro = () => {
    const erro = tbodyLicencas.querySelector('.campo-invalido');
    if (erro) erro.focus();
  };

  const validarLicencasAntesSalvar = () => {
    const linhas = [...tbodyLicencas.querySelectorAll('tr')];

    if (!linhas.length) {
      alert('Inclua ao menos uma licença sanitária ou clique em Cancelar.');
      return false;
    }

    for (const tr of linhas) {
      const cevs = tr.querySelector('.lic-cevs');
      const validade = tr.querySelector('.lic-validade');
      const cnaes = [...tr.querySelectorAll('.lic-cnae')];

      if (!cevs.value.trim()) {
        marcarCampoInvalido(cevs, 'Preencha o Nº CEVS antes de salvar.', 'obrigatorio');
        focarPrimeiroErro();
        return false;
      }

      if (!validade.value.trim()) {
        marcarCampoInvalido(validade, 'Preencha a validade antes de salvar.', 'obrigatorio');
        focarPrimeiroErro();
        return false;
      }

      if (!normalizarCampoDataBR(validade)) {
        focarPrimeiroErro();
        return false;
      }

      if (!cnaes.length) {
        alert('Inclua ao menos um CNAE antes de salvar.');
        return false;
      }

      for (const cnae of cnaes) {
        if (!cnae.value.trim()) {
          marcarCampoInvalido(cnae, 'Preencha o CNAE antes de salvar. Use duplo clique no campo para consultar.', 'obrigatorio');
          focarPrimeiroErro();
          return false;
        }
      }
    }

    return true;
  };

  observacoesModal.addEventListener('input', () => {
    salvarObservacoesLinhaAtiva();
    sincronizarStorePelaTabela();
  });

  btnFecharModalCnae.addEventListener('click', () => {
    modalCnaeConsulta.close();
  });

  btnAbrir.addEventListener('click', () => {
    licencasSnapshotModal = clonarLicencas(getStore());
    renderizarLicencas();
    renderizarTabelaCnae();
    modal.showModal();
  });

  btnCancelar.addEventListener('click', () => {
    setStore(clonarLicencas(licencasSnapshotModal));
    atualizarStatus();
    modal.close();
  });

  btnSalvar.addEventListener('click', () => {
    if (!validarLicencasAntesSalvar()) return;
    salvarObservacoesLinhaAtiva();
    sincronizarStorePelaTabela();
    atualizarStatus();
    modal.close();
  });
}
