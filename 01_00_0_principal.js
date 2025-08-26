// 01_00_0_principal.js

import { criarContatoItem } from './01_00_CriarContato.js';
// --- IMPORTAÇÃO CORRIGIDA ---
import { 
  buscarEmpresas, 
  salvarEmpresa, 
  salvarContato, 
  buscarContatosPorId, 
  buscarRevisoesPorId,
  salvarLicenca // <-- Importa a nova função
} from './01_00_9_enviarDados.js';

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

// --- VARIÁVEL GLOBAL PARA ARMAZENAR LICENÇAS TEMPORARIAMENTE ---
let licencaSanitariaStore = [];

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

  // Limpa Licença Sanitária (agora o array e o status)
  licencaSanitariaStore = [];
  const licencaStatus = document.getElementById('licencaSanitariaStatus');
  licencaStatus.textContent = 'Licença Sanitária: Não preenchida';
  licencaStatus.style.color = 'black';

  // Limpa Licença de Bombeiros
  document.getElementById('bombeirosTipo').value = '';
  document.getElementById('bombeirosNumero').value = '';
  document.getElementById('bombeirosValidade').value = '';
  const bombeirosStatus = document.getElementById('bombeirosStatus');
  bombeirosStatus.textContent = 'Licença de Bombeiros: Não preenchida';
  bombeirosStatus.style.color = 'black';

  setFormEnabled(true);
  btnSalvarNovo.style.display = 'inline-block';
  btnHabilitarEdicao.style.display = 'none';
  btnSalvarEdicao.style.display = 'none';
  btnCancelarEdicao.style.display = 'none';
}

function preencherFormulario(empresa, contatos, licencas) {
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

  licencaSanitariaStore = licencas || [];
  const licencaStatus = document.getElementById('licencaSanitariaStatus');
  if (licencaSanitariaStore.length > 0) {
    licencaStatus.textContent = `Licença Sanitária: ${licencaSanitariaStore.length} licença(s) registrada(s).`;
    licencaStatus.style.color = 'green';
  } else {
    licencaStatus.textContent = 'Licença Sanitária: Não preenchida';
    licencaStatus.style.color = 'black';
  }

  const tipoBombeiros = empresa.Bombeiros_Tipo || '';
  const numeroBombeiros = empresa.Bombeiros_Numero || '';
  const validadeBombeiros = empresa.Bombeiros_Validade || '';
  document.getElementById('bombeirosTipo').value = tipoBombeiros;
  document.getElementById('bombeirosNumero').value = numeroBombeiros;
  document.getElementById('bombeirosValidade').value = validadeBombeiros;
  const bombeirosStatus = document.getElementById('bombeirosStatus');
  if (tipoBombeiros && numeroBombeiros) {
      let statusText = `Licença Bombeiros: ${tipoBombeiros} - Nº ${numeroBombeiros}`;
      if (validadeBombeiros) {
          const dataFormatada = new Date(validadeBombeiros + 'T00:00:00').toLocaleDateString('pt-BR');
          statusText += ` (Validade: ${dataFormatada})`;
      }
      bombeirosStatus.textContent = statusText;
      bombeirosStatus.style.color = 'green';
  } else {
      bombeirosStatus.textContent = 'Licença de Bombeiros: Não preenchida';
      bombeirosStatus.style.color = 'black';
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
      CEP: document.getElementById('cep').value, 
      Bombeiros_Tipo: document.getElementById('bombeirosTipo').value,
      Bombeiros_Numero: document.getElementById('bombeirosNumero').value,
      Bombeiros_Validade: document.getElementById('bombeirosValidade').value
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

    // ===================================================================
    // --- LÓGICA DE SALVAMENTO CORRIGIDA ---
    // Usa a função 'salvarLicenca' importada.
    for (const licenca of licencaSanitariaStore) {
        const licencaObj = {
            Id: novoId.toString(),
            Rev: novaRev.toString(),
            CEVS: licenca.cevs,
            Validade: licenca.validade,
            CNAE: licenca.cnae
        };
        await salvarLicenca(licencaObj);
    }
    // ===================================================================

    alert('Cadastro salvo com sucesso!');
    limparFormulario();
  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro ao salvar cadastro.');
  }
}

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
                    const selectedRevision = empresa; 
                    let contatos = [];
                    let licencas = [];
                    try {
                        const contatosRaw = await buscarContatosPorId(selectedRevision.Id);
                        if (Array.isArray(contatosRaw)) {
                            contatos = contatosRaw
                                .filter(c => c.Rev === selectedRevision.Rev)
                                .map(c => ({ nome: c.nome || '', cargo: c.funcao || '', email: c.email || '', telefone: c.telefone || '' }));
                        }
                        
                        // --- LÓGICA DE BUSCA DE LICENÇAS CORRIGIDA ---
                        const licencasRaw = await fetch(`https://sheetdb.io/api/v1/ygjx7hr6r521t/search?Id=${selectedRevision.Id}&sheet=LicencaSanitaria` ).then(res => res.json());
                        if (Array.isArray(licencasRaw)) {
                            licencas = licencasRaw
                                .filter(l => l.Rev === selectedRevision.Rev)
                                .map(l => ({ cevs: l.CEVS, validade: l.Validade, cnae: l.CNAE }));
                        }
                    } catch (e) { 
                        console.error("Erro ao buscar dados relacionados:", e);
                    }
                    preencherFormulario(selectedRevision, contatos, licencas);
                } catch (e) {
                    console.error("Erro ao buscar detalhes da empresa:", e);
                    preencherFormulario(empresa, [], []);
                }
            });
            listaEmpresas.appendChild(div);
        });
    };

    const filtroInput = document.getElementById('filtroEmpresa');
    const onFiltroInput = () => {
        const termoBusca = filtroInput.value.toLowerCase();
        const empresasFiltradas = empresasArray.filter(empresa =>
            empresa.NomeFantasia.toLowerCase().includes(termoBusca)
        );
        renderizarLista(empresasFiltradas);
    };
    filtroInput.value = '';
    filtroInput.removeEventListener('input', onFiltroInput);
    filtroInput.addEventListener('input', onFiltroInput);

    renderizarLista(empresasArray);
    modalEmpresas.showModal();

  } catch (e) {
    alert('Erro ao carregar lista de empresas.');
    console.error(e);
  }
});

function inicializarModais() {
  const modalGerenciarLicencas = document.getElementById('modalGerenciarLicencas');
  const btnAbrirModalLicenca = document.getElementById('btnAbrirModalLicenca');
  const btnFecharModalLicencas = document.getElementById('btnFecharModalLicencas');
  const listaLicencasContainer = document.getElementById('listaLicencasContainer');
  const cevsInput = document.getElementById('licencaCEVS_input');
  const validadeInput = document.getElementById('licencaValidade_input');
  const cnaeInput = document.getElementById('licencaCNAE_input');
  const btnAdicionarLicencaNaLista = document.getElementById('btnAdicionarLicencaNaLista');
  const cnaeRows = modalGerenciarLicencas.querySelectorAll('.cnae-row-selector');

  const renderizarListaLicencas = () => {
    listaLicencasContainer.innerHTML = '';
    licencaSanitariaStore.forEach((licenca, index) => {
      const div = document.createElement('div');
      div.className = 'item-na-lista';
      
      // Formata a data para exibição, se ela existir
      const dataFormatada = licenca.validade ? new Date(licenca.validade + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
      
      div.textContent = `CEVS: ${licenca.cevs}, Validade: ${dataFormatada}, CNAE: ${licenca.cnae}`;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remover';
      removeBtn.onclick = () => {
        licencaSanitariaStore.splice(index, 1);
        renderizarListaLicencas();
      };
      div.appendChild(removeBtn);
      listaLicencasContainer.appendChild(div);
    });
  };

  btnAbrirModalLicenca.addEventListener('click', () => {
    renderizarListaLicencas();
    modalGerenciarLicencas.showModal();
  });

  btnFecharModalLicencas.addEventListener('click', () => {
    const licencaStatus = document.getElementById('licencaSanitariaStatus');
    if (licencaSanitariaStore.length > 0) {
        licencaStatus.textContent = `Licença Sanitária: ${licencaSanitariaStore.length} licença(s) registrada(s).`;
        licencaStatus.style.color = 'green';
    } else {
        licencaStatus.textContent = 'Licença Sanitária: Não preenchida';
        licencaStatus.style.color = 'black';
    }
    modalGerenciarLicencas.close();
  });

  btnAdicionarLicencaNaLista.addEventListener('click', () => {
    if (!cevsInput.value && !cnaeInput.value) {
      alert('Preencha pelo menos o CEVS ou o CNAE.');
      return;
    }
    licencaSanitariaStore.push({
      cevs: cevsInput.value,
      validade: validadeInput.value, // Salva como AAAA-MM-DD
      cnae: cnaeInput.value
    });
    cevsInput.value = '';
    validadeInput.value = '';
    cnaeInput.value = '';
    renderizarListaLicencas();
  });

  cnaeRows.forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('dblclick', () => {
      cnaeInput.value = row.getAttribute('data-cnae');
    });
  });

  const btnAbrirModalBombeiros = document.getElementById('btnAbrirModalBombeiros');
  const bombeirosStatus = document.getElementById('bombeirosStatus');
  const hiddenBombeirosTipo = document.getElementById('bombeirosTipo');
  const hiddenBombeirosNumero = document.getElementById('bombeirosNumero');
  const hiddenBombeirosValidade = document.getElementById('bombeirosValidade');
  const modalBombeiros = document.getElementById('modalBombeiros');
  const modalBombeirosTipo = document.getElementById('modalBombeirosTipo');
  const modalBombeirosNumero = document.getElementById('modalBombeirosNumero');
  const modalBombeirosValidade = document.getElementById('modalBombeirosValidade');
  const btnSalvarBombeiros = document.getElementById('btnSalvarBombeiros');
  const btnCancelarBombeiros = document.getElementById('btnCancelarBombeiros');
  const bombeirosTipoRows = modalBombeiros.querySelectorAll('tr[data-tipo]');
  
  bombeirosTipoRows.forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('dblclick', () => {
      const tipo = row.getAttribute('data-tipo');
      modalBombeirosTipo.value = tipo;
    });
  });

  btnAbrirModalBombeiros.addEventListener('click', () => {
    modalBombeirosTipo.value = hiddenBombeirosTipo.value;
    modalBombeirosNumero.value = hiddenBombeirosNumero.value;
    modalBombeirosValidade.value = hiddenBombeirosValidade.value;
    modalBombeiros.showModal();
  });
  btnCancelarBombeiros.addEventListener('click', () => modalBombeiros.close());
  btnSalvarBombeiros.addEventListener('click', () => {
    const tipo = modalBombeirosTipo.value;
    const numero = modalBombeirosNumero.value.trim();
    const validade = modalBombeirosValidade.value;
    hiddenBombeirosTipo.value = tipo;
    hiddenBombeirosNumero.value = numero;
    hiddenBombeirosValidade.value = validade;
    if (tipo && numero) {
        let statusText = `Licença Bombeiros: ${tipo} - Nº ${numero}`;
        if (validade) {
            const dataFormatada = new Date(validade + 'T00:00:00').toLocaleDateString('pt-BR');
            statusText += ` (Validade: ${dataFormatada})`;
        }
        bombeirosStatus.textContent = statusText;
        bombeirosStatus.style.color = 'green';
    } else {
        bombeirosStatus.textContent = 'Licença de Bombeiros: Não preenchida';
        bombeirosStatus.style.color = 'black';
    }
    modalBombeiros.close();
  });

  document.getElementById('btnFecharModalEmpresas').addEventListener('click', () => modalEmpresas.close());
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarModais();
  limparFormulario();
});
