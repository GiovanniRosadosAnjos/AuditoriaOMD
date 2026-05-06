// CadEmpresa_main.js

import { criarContatoItem } from './CadEmpresa_CriarContato.js';
import { inicializarLicencasSanitarias } from './CadEmpresa_Licencas.js';
import { inicializarBombeiro, carregarBombeiroPorEmpresa, salvarBombeiroPorEmpresa, limparBombeiro } from './CadEmpresa_Bombeiro.js';
import { inicializarAFE, carregarAFEPorEmpresa, salvarAFEPorEmpresa, limparAFE } from './CadEmpresa_AFE.js';
import { inicializarSaude, limparSaude } from './CadEmpresa_Saude.js';
import { validarEmpresaAntesSalvar } from './CadEmpresa_ValidarDados.js';
import { inicializarEstadoTela, aplicarEstadoTela, atualizarEstadoPorConteudo } from './CadEmpresa_EstadoTela.js';
import { 
  buscarEmpresas,
  salvarEmpresaAtual,
  salvarEmpresaHistorico,
  salvarContatosEmpresa,
  buscarContatosPorId,
  buscarLicencasAtuaisPorId,
  salvarLicencasAtuais,
  salvarLicencaHistorico
} from './CadEmpresa_SupabaseDados.js';

// --- ELEMENTOS GLOBAIS ---
const form = document.getElementById('formEmpresa');
const contatosContainer = document.getElementById('contatosContainer');
const listaEmpresas = document.getElementById('listaEmpresas');
const modalEmpresas = document.getElementById('modalEmpresas');

// --- BOTÕES ---
const btnConsultar = document.getElementById('btnRevisarCadastro');
const btnCancelarOperacao = document.getElementById('bntCancelarOperacao');
const btnSalvarNovo = document.getElementById('btnSalvarNovo');
const btnHabilitarEdicao = document.getElementById('btnHabilitarEdicao');
const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');

// --- VARIÁVEL GLOBAL PARA ARMAZENAR LICENÇAS TEMPORARIAMENTE ---
let licencaSanitariaStore = [];
let licencaSanitariaRevAtual = '';
let licencaSanitariaSnapshot = '[]';
let bombeirosRevAtual = '';
let bombeirosSnapshot = '{}';

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
  const obs = document.getElementById('observacoes');
  if (obs) obs.value = '';

  contatosContainer.innerHTML = '';
  contatosContainer.appendChild(criarContatoItem('', '', '', '', true, contatosContainer));

  // Limpa Licença Sanitária (agora o array e o status)
  licencaSanitariaStore = [];
  licencaSanitariaRevAtual = '';
  licencaSanitariaSnapshot = '[]';
  atualizarStatusLicencaSanitaria();

  // Limpa Licença de Bombeiros
  document.getElementById('bombeirosTipo').value = '';
  document.getElementById('bombeirosNumero').value = '';
  document.getElementById('bombeirosValidade').value = '';
  document.getElementById('bombeirosStatusValor').value = '';
  document.getElementById('bombeirosObservacoes').value = '';
  bombeirosRevAtual = '';
  bombeirosSnapshot = normalizarBombeirosParaComparacao();
  atualizarStatusBombeiros();
  limparBombeiro();

  limparAFE();
  limparSaude();

  setFormEnabled(true);
  aplicarEstadoTela('vazio');
}



function normalizarDataParaInput(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  const raw = valor.toString().trim();
  if (!raw) return '';

  // Já está no formato aceito pelo input type=date.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Caso venha como dd/mm/aaaa.
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const [, d, m, y] = br;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Caso venha como data/hora ISO ou texto que comece com aaaa-mm-dd.
  const isoInicio = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoInicio) return isoInicio[1];

  // Caso Google Sheets/SheetDB devolva serial numérico de data.
  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const n = Number(raw);
    if (n > 30000 && n < 70000) {
      const base = Date.UTC(1899, 11, 30);
      const dt = new Date(base + n * 86400000);
      return dt.toISOString().slice(0, 10);
    }
  }

  return '';
}

function limparPrefixoNumeroDocumento(valor) {
  return (valor ?? '').toString().trim().replace(/^n\.?\s*º\s*/i, '').trim();
}

function preencherFormulario(empresa, contatos, licencas, bombeirosAtual = null) {
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
  const obs = document.getElementById('observacoes');
  if (obs) obs.value = empresa.observacoes || '';

  contatosContainer.innerHTML = '';
  if (contatos && contatos.length > 0) {
    contatos.forEach((contato, index) => {
      const exibirLabel = (index === 0);
      contatosContainer.appendChild(criarContatoItem(contato.nome, contato.cargo, contato.email, contato.telefone, exibirLabel, contatosContainer, contato.id || ''));
    });
  } else {
    contatosContainer.appendChild(criarContatoItem('', '', '', '', true, contatosContainer));
  }

  licencaSanitariaStore = licencas || [];
  licencaSanitariaRevAtual = empresa.LicencaSanitaria_Rev || '';
  licencaSanitariaSnapshot = normalizarLicencasParaComparacao(licencaSanitariaStore);
  atualizarStatusLicencaSanitaria();

  const tipoBombeiros = bombeirosAtual?.Tipo || empresa.Bombeiros_Tipo || '';
  const numeroBombeiros = limparPrefixoNumeroDocumento(bombeirosAtual?.Numero || empresa.Bombeiros_Numero || '');
  const validadeBombeiros = normalizarDataParaInput(bombeirosAtual?.Validade || empresa.Bombeiros_Validade || '');
  bombeirosRevAtual = empresa.Bombeiros_Rev || bombeirosAtual?.Bombeiros_Rev || '';
  document.getElementById('bombeirosTipo').value = tipoBombeiros;
  document.getElementById('bombeirosNumero').value = numeroBombeiros;
  document.getElementById('bombeirosValidade').value = validadeBombeiros;
  document.getElementById('bombeirosStatusValor').value = calcularStatusBombeiros(validadeBombeiros);
  bombeirosSnapshot = normalizarBombeirosParaComparacao();
  atualizarStatusBombeiros();

  setFormEnabled(false);
  aplicarEstadoTela('visualizando');
}


function normalizarLicencasParaComparacao(licencas = []) {
  return JSON.stringify((Array.isArray(licencas) ? licencas : [])
    .map(licenca => ({
      cevs: (licenca.cevs || '').trim(),
      validade: licenca.validade || '',
      cnaes: (Array.isArray(licenca.cnaes) ? licenca.cnaes : (licenca.cnae ? [licenca.cnae] : []))
        .map(cnae => (cnae || '').trim())
        .filter(Boolean)
        .sort(),
      observacoes: (licenca.observacoes || licenca.Observacoes || '').trim()
    }))
    .filter(licenca => licenca.cevs || licenca.validade || licenca.cnaes.length || licenca.observacoes)
    .sort((a, b) => `${a.cevs}|${a.validade}|${a.cnaes.join(';')}|${a.observacoes}`.localeCompare(`${b.cevs}|${b.validade}|${b.cnaes.join(';')}|${b.observacoes}`))
  );
}



function obterBombeirosDoFormulario() {
  return {
    tipo: document.getElementById('bombeirosTipo')?.value.trim() || '',
    numero: document.getElementById('bombeirosNumero')?.value.trim() || '',
    validade: document.getElementById('bombeirosValidade')?.value || '',
    status: document.getElementById('bombeirosStatusValor')?.value || calcularStatusBombeiros(document.getElementById('bombeirosValidade')?.value || ''),
    observacoes: document.getElementById('bombeirosObservacoes')?.value || ''
  };
}

function normalizarBombeirosParaComparacao(bombeiros = null) {
  const b = bombeiros || obterBombeirosDoFormulario();
  return JSON.stringify({
    tipo: (b.tipo || b.Tipo || '').trim(),
    numero: (b.numero || b.Numero || '').trim(),
    validade: b.validade || b.Validade || '',
    observacoes: (b.observacoes || b.Observacoes || '').trim()
  });
}

function atualizarStatusBombeiros() {
  const bombeirosStatus = document.getElementById('bombeirosStatus');
  const hiddenStatus = document.getElementById('bombeirosStatusValor');
  if (!bombeirosStatus) return;
  const b = obterBombeirosDoFormulario();
  const statusCalculado = calcularStatusBombeiros(b.validade);
  if (hiddenStatus) hiddenStatus.value = statusCalculado;

  if (b.tipo && b.numero) {
    let statusText = `Licença Bombeiros: ${b.tipo} - Nº ${b.numero}`;
    if (b.validade) {
      const dataFormatada = new Date(b.validade + 'T00:00:00').toLocaleDateString('pt-BR');
      statusText += ` (Validade: ${dataFormatada}`;
      if (statusCalculado) statusText += ` - ${statusCalculado}`;
      statusText += ')';
    }
    bombeirosStatus.textContent = statusText;
    bombeirosStatus.style.color = statusCalculado === 'Vencido' ? '#c00000' : 'green';
  } else {
    bombeirosStatus.textContent = 'Licença de Bombeiros: Não preenchida';
    bombeirosStatus.style.color = 'black';
  }
}

function normalizarValorHistorico(valor) {
  return (valor ?? '').toString();
}

function gerarHistoricoEmpresa(antes = {}, depois = {}, rev) {
  const campos = [
    'NomeFantasia', 'razao', 'CNPJ', 'Rua', 'num', 'bairro', 'cidade', 'UF', 'pais', 'CEP', 'observacoes',
    'LicencaSanitaria_Rev', 'Bombeiros_Rev'
  ];
  const dataHora = new Date().toLocaleString('pt-BR');
  const linhas = [];

  campos.forEach(campo => {
    const valorAnterior = normalizarValorHistorico(antes[campo]);
    const valorNovo = normalizarValorHistorico(depois[campo]);
    if (valorAnterior !== valorNovo) {
      linhas.push({
        Id: depois.Id?.toString() || '',
        Rev: rev?.toString() || '',
        Campo: campo,
        Valor_Anterior: valorAnterior,
        Valor_Novo: valorNovo,
        DataHora: dataHora,
        Responsavel: ''
      });
    }
  });

  return linhas;
}

function proximaRev(valorAtual) {
  const n = parseInt(valorAtual);
  return Number.isFinite(n) ? n + 1 : 0;
}

function calcularStatusBombeiros(validade) {
  if (!validade) return '';
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataValidade = new Date(`${validade}T00:00:00`);
  if (Number.isNaN(dataValidade.getTime())) return '';
  return dataValidade < hoje ? 'Vencido' : 'Em vigor';
}

// =================================================================================
// --- LÓGICA DE EVENTOS ---
// =================================================================================

async function salvarDadosDoFormulario() {
  const idRevisao = document.getElementById('idEmpresaRevisao').value;
  const contatoIds = [...document.querySelectorAll('input[name="contatoId[]"]')].map(i => i.value.trim());
  const nomes = [...document.querySelectorAll('input[name="contatoNome[]"]')].map(i => i.value.trim());
  const cargos = [...document.querySelectorAll('input[name="contatoCargo[]"]')].map(i => i.value.trim());
  const emails = [...document.querySelectorAll('input[name="contatoEmail[]"]')].map(i => i.value.trim());
  const telefones = [...document.querySelectorAll('input[name="contatoTelefone[]"]')].map(i => i.value.trim());
  const contatos = [];
  for (let i = 0; i < nomes.length; i++) {
    if (nomes[i] || cargos[i] || emails[i] || telefones[i]) {
      contatos.push({ id: contatoIds[i] || '', nome: nomes[i], cargo: cargos[i], email: emails[i], telefone: telefones[i] });
    }
  }

  try {
    const empresasAtuais = await buscarEmpresas();
    const empresaAnterior = idRevisao
      ? (empresasAtuais.find(r => r.Id === idRevisao) || {})
      : {};

    const licencaSnapshotAtual = normalizarLicencasParaComparacao(licencaSanitariaStore);
    const temLicencaAtual = licencaSnapshotAtual !== '[]';
    const licencaAlterada = licencaSnapshotAtual !== licencaSanitariaSnapshot;
    const deveCriarRevLicenca = temLicencaAtual && (!idRevisao || licencaAlterada || !licencaSanitariaRevAtual);
    const novaRevLicenca = deveCriarRevLicenca ? proximaRev(licencaSanitariaRevAtual) : licencaSanitariaRevAtual;
    const licencaRevParaEmpresa = temLicencaAtual ? novaRevLicenca.toString() : '';

    const bombeirosAtual = obterBombeirosDoFormulario();
    const bombeirosSnapshotAtual = normalizarBombeirosParaComparacao(bombeirosAtual);
    const temBombeirosAtual = bombeirosSnapshotAtual !== JSON.stringify({ tipo: '', numero: '', validade: '', observacoes: '' });
    const bombeirosAlterado = bombeirosSnapshotAtual !== bombeirosSnapshot;
    const deveCriarRevBombeiros = temBombeirosAtual && (!idRevisao || bombeirosAlterado || !bombeirosRevAtual);
    const novaRevBombeiros = deveCriarRevBombeiros ? proximaRev(bombeirosRevAtual) : bombeirosRevAtual;
    const bombeirosRevParaEmpresa = temBombeirosAtual ? novaRevBombeiros.toString() : '';

    const empresaObj = {
      Id: idRevisao || '',
      Rev: '',
      NomeFantasia: document.getElementById('nomeFantasia').value,
      razao: document.getElementById('razaoSocial').value,
      CNPJ: document.getElementById('cnpj').value,
      Rua: document.getElementById('rua').value,
      num: document.getElementById('numero').value,
      bairro: document.getElementById('bairro').value,
      cidade: document.getElementById('cidade').value,
      UF: document.getElementById('estado').value,
      pais: document.getElementById('pais').value,
      CEP: document.getElementById('cep').value,
      observacoes: document.getElementById('observacoes')?.value || '',
      LicencaSanitaria_Rev: licencaRevParaEmpresa,
      Bombeiros_Rev: bombeirosRevParaEmpresa
    };

    const validacao = validarEmpresaAntesSalvar(empresaObj, empresasAtuais, idRevisao);
    if (!validacao.ok) {
      alert(validacao.mensagem);
      validacao.campo?.focus();
      return;
    }

    const empresaSalva = await salvarEmpresaAtual(empresaObj);
    const novoId = empresaSalva.Id;
    const novaRevEmpresa = '';

    // Histórico de nome fantasia / razão social / CNPJ é gravado automaticamente pelo trigger empresas_hist.
    const historicoEmpresa = gerarHistoricoEmpresa(empresaAnterior, { ...empresaObj, Id: novoId }, novaRevEmpresa);
    if (historicoEmpresa.length) {
      await salvarEmpresaHistorico(historicoEmpresa);
    }

    await salvarContatosEmpresa(novoId, contatos);

    if (deveCriarRevLicenca) {
      await salvarLicencasAtuais(novoId, novaRevLicenca, licencaSanitariaStore);
      await salvarLicencaHistorico(novoId, novaRevLicenca, licencaSanitariaStore, JSON.parse(licencaSanitariaSnapshot || '[]'));
    }

    let avisoBombeiro = '';
    try {
      await salvarBombeiroPorEmpresa(novoId);
    } catch (erroBombeiro) {
      console.error('Erro ao salvar Bombeiro/AVCB:', erroBombeiro);
      avisoBombeiro = '\n\nAtenção: empresa/licença sanitária foram salvas, mas houve erro ao salvar Bombeiro/AVCB.';
    }

    let avisoAFE = '';
    try {
      await salvarAFEPorEmpresa(novoId);
    } catch (erroAFE) {
      console.error('Erro ao salvar AFE:', erroAFE);
      avisoAFE = '\n\nAtenção: empresa/licença sanitária/AVCB foram salvos, mas houve erro ao salvar AFE.';
    }

    alert('Cadastro salvo com sucesso!' + avisoBombeiro + avisoAFE);
    limparFormulario();
  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert(err?.message || 'Erro ao salvar cadastro. Verifique a integração com o Supabase.');
  }
}

form.addEventListener('submit', e => e.preventDefault());
btnSalvarNovo.addEventListener('click', salvarDadosDoFormulario);
btnSalvarEdicao.addEventListener('click', salvarDadosDoFormulario);
btnCancelarOperacao.addEventListener('click', limparFormulario);

btnHabilitarEdicao.addEventListener('click', () => {
  setFormEnabled(true);
  aplicarEstadoTela('editando');
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
    const empresasArray = [...data];
    empresasArray.sort((a, b) => a.NomeFantasia.localeCompare(b.NomeFantasia));

    const renderizarLista = (empresasParaRenderizar) => {
        listaEmpresas.innerHTML = '';
        empresasParaRenderizar.forEach(empresa => {
            const div = document.createElement('div');
            div.textContent = `${(empresa.NomeFantasia || '').padEnd(40, ' ')} | ID: ${(empresa.Id || '').slice(0, 8)}`;
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
                                .map(c => ({ id: c.id || '', nome: c.nome || '', cargo: c.cargo || c.funcao || '', email: c.email || '', telefone: c.telefone || '' }));
                        }

                        const licencasRaw = await buscarLicencasAtuaisPorId(selectedRevision.Id);
                        if (Array.isArray(licencasRaw)) {
                            const mapaLicencas = new Map();
                            licencasRaw.forEach(l => {
                                const chave = `${l.CEVS || ''}||${l.Validade || ''}`;
                                if (!mapaLicencas.has(chave)) {
                                    mapaLicencas.set(chave, {
                                        cevs: l.CEVS || '',
                                        validade: normalizarDataParaInput(l.Validade || ''),
                                        cnaeItens: [],
                                        cnaes: [],
                                        observacoes: l.Observacoes || l.observacoes || ''
                                    });
                                }
                                const itemMapaLicenca = mapaLicencas.get(chave);
                                if ((l.Observacoes || l.observacoes) && !itemMapaLicenca.observacoes) {
                                    itemMapaLicenca.observacoes = l.Observacoes || l.observacoes || '';
                                }
                                if (l.CNAE) {
                                    const cnaesDaLinha = String(l.CNAE || '')
                                        .split(';')
                                        .map(cnae => cnae.trim())
                                        .filter(Boolean);
                                    cnaesDaLinha.forEach(cnae => {
                                        itemMapaLicenca.cnaeItens.push({ id: l.id || '', cnae });
                                        itemMapaLicenca.cnaes.push(cnae);
                                    });
                                }
                            });
                            licencas = [...mapaLicencas.values()].map(l => ({
                                ...l,
                                cnae: l.cnaes.join('; ')
                            }));
                        }
                    } catch (e) { 
                        console.error("Erro ao buscar dados relacionados:", e);
                    }
                    preencherFormulario(selectedRevision, contatos, licencas, null);
                    try {
                      await carregarBombeiroPorEmpresa(selectedRevision.Id);
                    } catch (erroBombeiro) {
                      console.error('Erro ao carregar Bombeiro/AVCB:', erroBombeiro);
                    }
                    try {
                      await carregarAFEPorEmpresa(selectedRevision.Id);
                    } catch (erroAFE) {
                      console.error('Erro ao carregar AFE:', erroAFE);
                    }
                } catch (e) {
                    console.error("Erro ao buscar detalhes da empresa:", e);
                    preencherFormulario(empresa, [], [], null);
                    try {
                      await carregarBombeiroPorEmpresa(empresa.Id);
                    } catch (erroBombeiro) {
                      console.error('Erro ao carregar Bombeiro/AVCB:', erroBombeiro);
                    }
                    try {
                      await carregarAFEPorEmpresa(empresa.Id);
                    } catch (erroAFE) {
                      console.error('Erro ao carregar AFE:', erroAFE);
                    }
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

function atualizarStatusLicencaSanitaria() {
  const licencaStatus = document.getElementById('licencaSanitariaStatus');
  if (!licencaStatus) return;
  if (licencaSanitariaStore.length > 0) {
    licencaStatus.textContent = `Licença Sanitária: ${licencaSanitariaStore.length} licença(s) registrada(s).`;
    licencaStatus.style.color = 'green';
  } else {
    licencaStatus.textContent = 'Licença Sanitária: Não preenchida';
    licencaStatus.style.color = 'black';
  }
}

function inicializarModais() {
  inicializarLicencasSanitarias({
    getStore: () => licencaSanitariaStore,
    setStore: (novaLista) => { licencaSanitariaStore = novaLista; },
    atualizarStatus: atualizarStatusLicencaSanitaria
  });

  inicializarBombeiro();
  inicializarAFE();
  inicializarSaude();

  document.getElementById('btnFecharModalEmpresas').addEventListener('click', () => modalEmpresas.close());
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarEstadoTela(form);
  inicializarModais();
  limparFormulario();
});
