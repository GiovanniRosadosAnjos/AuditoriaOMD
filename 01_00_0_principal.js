// 01_00_0_principal.js

import { criarContatoItem } from './01_00_CriarContato.js';
import { buscarEmpresas, salvarEmpresa, salvarContato, buscarContatosPorId, buscarRevisoesPorId } from './01_00_9_enviarDados.js';

// --- ELEMENTOS GLOBAIS ---
const form = document.getElementById('formEmpresa');
const contatosContainer = document.getElementById('contatosContainer');
const listaEmpresas = document.getElementById('listaEmpresas');
const modalEmpresas = document.getElementById('modalEmpresas');

// --- BOTÕES ---
const btnConsultar = document.getElementById('btnRevisarCadastro');
const btnCancelarOperacao = document.getElementById('bntCancelarOperacao');
const btnAddContato = document.getElementById('btnAddContato');
const btnSalvarNovo = document.getElementById('btnSalvarNovo');
const btnHabilitarEdicao = document.getElementById('btnHabilitarEdicao');
const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');

// =================================================================================
// --- LÓGICA DE CONTROLE DO FORMULÁRIO (CONSOLIDADA) ---
// =================================================================================

function setFormEnabled(enabled) {
  form.querySelectorAll('input, button, select, textarea').forEach(field => {
    if (!field.closest('#formActions')) {
      field.disabled = !enabled;
    }
  });
}

function limparFormulario() {
  form.reset();
  document.getElementById('idEmpresaRevisao').value = '';
  contatosContainer.innerHTML = '';
  contatosContainer.appendChild(criarContatoItem('', '', '', '', true, contatosContainer));

  document.getElementById('licencaCEVS').value = '';
  document.getElementById('licencaValidade').value = '';
  document.getElementById('licencaSubgrupo').value = '';

  const licencaStatus = document.getElementById('licencaSanitariaStatus');
  licencaStatus.textContent = 'Licença Sanitária: Não preenchida';
  licencaStatus.style.color = 'black';

  setFormEnabled(true);
  btnSalvarNovo.style.display = 'inline-block';
  btnHabilitarEdicao.style.display = 'none';
  btnSalvarEdicao.style.display = 'none';
  btnCancelarEdicao.style.display = 'none';
}

function preencherFormulario(empresa, contatos) {
  document.getElementById('idEmpresaRevisao').value = empresa.Id || '';
  document.getElementById('nomeFantasia').value = empresa.NomeFantasia || '';
  document.getElementById('razaoSocial').value = empresa.razao || '';
  document.getElementById('cnpj').value = empresa.CNPJ || '';
  document.getElementById('rua').value = empresa.Rua || '';
  document.getElementById('numero').value = empresa.num || '';
  document.getElementById('bairro').value = empresa.bairro || '';
  document.getElementById('cidade').value = empresa.cidade || '';
  document.getElementById('estado').value = empresa.UF || '';
  document.getElementById('pais').value = empresa.pais || '';
  document.getElementById('cep').value = empresa.CEP || '';

  contatosContainer.innerHTML = '';
  if (contatos && contatos.length > 0) {
    contatos.forEach((contato, index) => {
      const exibirLabel = (index === 0);
      contatosContainer.appendChild(criarContatoItem(contato.nome, contato.cargo, contato.email, contato.telefone, exibirLabel, contatosContainer));
    });
  } else {
    contatosContainer.appendChild(criarContatoItem('', '', '', '', true, contatosContainer));
  }

  const cevs = empresa.Licenca_Sanitaria_CEVS || '';
  const validade = empresa.Licenca_Sanitaria_Validade || '';
  const cnae = empresa.Licenca_Sanitaria_CNAE || '';

  document.getElementById('licencaCEVS').value = cevs;
  document.getElementById('licencaValidade').value = validade;
  document.getElementById('licencaSubgrupo').value = cnae;

  const licencaStatus = document.getElementById('licencaSanitariaStatus');
  if (validade) {
    const dataFormatada = new Date(validade + 'T00:00:00').toLocaleDateString('pt-BR');
    licencaStatus.textContent = `Licença Sanitária: Preenchida (Validade: ${dataFormatada})`;
    licencaStatus.style.color = 'green';
  } else if (cevs || cnae) {
    licencaStatus.textContent = 'Licença Sanitária: Preenchida (sem validade)';
    licencaStatus.style.color = 'orange';
  } else {
    licencaStatus.textContent = 'Licença Sanitária: Não preenchida';
    licencaStatus.style.color = 'black';
  }

  setFormEnabled(false);
  btnSalvarNovo.style.display = 'none';
  btnHabilitarEdicao.style.display = 'inline-block';
  btnSalvarEdicao.style.display = 'none';
  btnCancelarEdicao.style.display = 'none';
}

// =================================================================================
// --- LÓGICA DE EVENTOS ---
// =================================================================================

async function salvarDadosDoFormulario() {
  const idRevisao = document.getElementById('idEmpresaRevisao').value;
  const nomes = [...document.querySelectorAll('input[name="contatoNome[]"]')].map(i => i.value.trim());
  const cargos = [...document.querySelectorAll('input[name="contatoCargo[]"]')].map(i => i.value.trim());
  const emails = [...document.querySelectorAll('input[name="contatoEmail[]"]')].map(i => i.value.trim());
  const telefones = [...document.querySelectorAll('input[name="contatoTelefone[]"]')].map(i => i.value.trim());
  const contatos = [];
  for (let i = 0; i < nomes.length; i++) {
    if (nomes[i] || cargos[i] || emails[i] || telefones[i]) {
      contatos.push({ nome: nomes[i], cargo: cargos[i], email: emails[i], telefone: telefones[i] });
    }
  }
  try {
    const data = await buscarEmpresas();
    const idsExistentes = data.map(row => parseInt(row.Id)).filter(id => !isNaN(id));
    const maxId = idsExistentes.length > 0 ? Math.max(...idsExistentes) : 0;
    let novoId, novaRev;
    if (!idRevisao) {
      novoId = maxId + 1;
      novaRev = 0;
    } else {
      novoId = parseInt(idRevisao);
      const revs = data.filter(r => parseInt(r.Id) === novoId).map(r => parseInt(r.Rev));
      novaRev = revs.length > 0 ? Math.max(...revs) + 1 : 0;
    }
    const empresaObj = {
      Id: novoId.toString(), Rev: novaRev.toString(), NomeFantasia: document.getElementById('nomeFantasia').value,
      razao: document.getElementById('razaoSocial').value, CNPJ: document.getElementById('cnpj').value,
      Rua: document.getElementById('rua').value, num: document.getElementById('numero').value,
      bairro: document.getElementById('bairro').value, cidade: document.getElementById('cidade').value,
      UF: document.getElementById('estado').value, pais: document.getElementById('pais').value,
      CEP: document.getElementById('cep').value, Licenca_Sanitaria_CEVS: document.getElementById('licencaCEVS').value,
      Licenca_Sanitaria_Validade: document.getElementById('licencaValidade').value, Licenca_Sanitaria_CNAE: document.getElementById('licencaSubgrupo').value
    };
    await salvarEmpresa(empresaObj);
    const dataHoraAtual = new Date().toLocaleString();
    for (const c of contatos) {
      const contatoObj = {
        Id: novoId.toString(), Rev: novaRev.toString(), nome: c.nome, funcao: c.cargo,
        email: c.email, telefone: c.telefone, dataCadastro: dataHoraAtual
      };
      await salvarContato(contatoObj);
    }
    alert('Cadastro salvo com sucesso!');
    limparFormulario();
  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro ao salvar cadastro.');
  }
}

// --- EVENT LISTENERS ---

form.addEventListener('submit', e => e.preventDefault());
btnSalvarNovo.addEventListener('click', salvarDadosDoFormulario);
btnSalvarEdicao.addEventListener('click', salvarDadosDoFormulario);
btnAddContato.addEventListener('click', () => {
  contatosContainer.appendChild(criarContatoItem('', '', '', '', false, contatosContainer));
});
btnCancelarOperacao.addEventListener('click', limparFormulario);

btnHabilitarEdicao.addEventListener('click', () => {
  setFormEnabled(true);
  btnSalvarNovo.style.display = 'none';
  btnHabilitarEdicao.style.display = 'none';
  btnSalvarEdicao.style.display = 'inline-block';
  btnCancelarEdicao.style.display = 'inline-block';
});

btnCancelarEdicao.addEventListener('click', () => {
  limparFormulario();
  alert("Edição cancelada. O formulário foi limpo.");
});

btnConsultar.addEventListener('click', async () => {
  try {
    const data = await buscarEmpresas();
    if (!Array.isArray(data) || data.length === 0) {
      alert('Nenhuma empresa cadastrada.');
      return;
    }
    const empresasMap = new Map();
    data.forEach(empresa => {
      const id = empresa.Id;
      if (!empresasMap.has(id) || parseInt(empresasMap.get(id).Rev) < parseInt(empresa.Rev)) {
        empresasMap.set(id, empresa);
      }
    });
    
    const empresasArray = Array.from(empresasMap.values());
    empresasArray.sort((a, b) => a.NomeFantasia.localeCompare(b.NomeFantasia));

    const renderizarLista = (empresasParaRenderizar) => {
        listaEmpresas.innerHTML = '';
        empresasParaRenderizar.forEach(empresa => {
            const div = document.createElement('div');
            div.textContent = `${empresa.NomeFantasia.padEnd(40, ' ')} | ID: ${empresa.Id.padStart(2, '0')} | Rev: ${empresa.Rev.padStart(2, '0')}`;
            div.classList.add('empresa-item');
            div.style.fontFamily = 'monospace';
            div.style.whiteSpace = 'pre';
            div.addEventListener('dblclick', async () => {
                modalEmpresas.close();
                try {
                    // A empresa selecionada já é a revisão correta
                    const selectedRevision = empresa; 
                    let contatos = [];
                    try {
                        const contatosRaw = await buscarContatosPorId(selectedRevision.Id);
                        if (Array.isArray(contatosRaw) && contatosRaw.length > 0) {
                            // --- LÓGICA CORRIGIDA AQUI ---
                            // Filtra os contatos para que a Rev seja IGUAL à da empresa selecionada
                            contatos = contatosRaw
                                .filter(c => c.Rev === selectedRevision.Rev)
                                .map(c => ({ nome: c.nome || '', cargo: c.funcao || '', email: c.email || '', telefone: c.telefone || '' }));
                        }
                    } catch { contatos = []; }
                    preencherFormulario(selectedRevision, contatos);
                } catch (e) {
                    console.error("Erro ao buscar detalhes da empresa:", e);
                    preencherFormulario(empresa, []);
                }
            });
            listaEmpresas.appendChild(div);
        });
    };

    renderizarLista(empresasArray);
    const filtroInput = document.getElementById('filtroEmpresa');
    filtroInput.value = '';
    filtroInput.addEventListener('input', () => {
        const termoBusca = filtroInput.value.toLowerCase();
        const empresasFiltradas = empresasArray.filter(empresa =>
            empresa.NomeFantasia.toLowerCase().includes(termoBusca)
        );
        renderizarLista(empresasFiltradas);
    });

    modalEmpresas.showModal();
  } catch (e) {
    alert('Erro ao carregar lista de empresas.');
    console.error(e);
  }
});

// --- LÓGICA DO MODAL DE LICENÇA ---
function inicializarLicencaSanitaria() {
  const btnAbrirModal = document.getElementById('btnAbrirModalLicenca');
  const licencaStatus = document.getElementById('licencaSanitariaStatus');
  const hiddenCEVS = document.getElementById('licencaCEVS');
  const hiddenValidade = document.getElementById('licencaValidade');
  const hiddenSubgrupo = document.getElementById('licencaSubgrupo');

  const modal = document.getElementById('modalLicencaSanitaria');
  const modalCEVS = document.getElementById('modalLicencaCEVS');
  const modalValidade = document.getElementById('modalLicencaValidade');
  const modalSubgrupo = document.getElementById('modalLicencaSubgrupo');
  const btnSalvarLicenca = document.getElementById('btnSalvarLicenca');
  const btnCancelarLicenca = document.getElementById('btnCancelarLicenca');
  const cnaeCells = modal.querySelectorAll('.cnae-cell');

  btnAbrirModal.addEventListener('click', () => {
    modalCEVS.value = hiddenCEVS.value;
    modalValidade.value = hiddenValidade.value;
    modalSubgrupo.value = hiddenSubgrupo.value;
    modal.showModal();
  });

  btnCancelarLicenca.addEventListener('click', () => modal.close());
  document.getElementById('btnFecharModalEmpresas').addEventListener('click', () => modalEmpresas.close());

  btnSalvarLicenca.addEventListener('click', () => {
    const cevs = modalCEVS.value.trim();
    const validade = modalValidade.value;
    const subgrupo = modalSubgrupo.value.trim();

    hiddenCEVS.value = cevs;
    hiddenValidade.value = validade;
    hiddenSubgrupo.value = subgrupo;

    if (validade) {
      const dataFormatada = new Date(validade + 'T00:00:00').toLocaleDateString('pt-BR');
      licencaStatus.textContent = `Licença Sanitária: Preenchida (Validade: ${dataFormatada})`;
      licencaStatus.style.color = 'green';
    } else if (cevs || subgrupo) {
      licencaStatus.textContent = 'Licença Sanitária: Preenchida (sem validade)';
      licencaStatus.style.color = 'orange';
    } else {
      licencaStatus.textContent = 'Licença Sanitária: Não preenchida';
      licencaStatus.style.color = 'black';
    }

    modal.close();
  });

  cnaeCells.forEach(cell => {
    cell.addEventListener('dblclick', () => {
      const fullText = cell.textContent.trim();
      const cnaeCode = fullText.split(' ')[0];
      modalSubgrupo.value = cnaeCode;
    });
  });
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
  inicializarLicencaSanitaria();
  limparFormulario();
});
