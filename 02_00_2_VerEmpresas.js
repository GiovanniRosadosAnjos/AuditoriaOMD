import { montarTabelaProdutosDinamica } from './02_00_3_ProdutosDinamicos.js'

const endpointBase = 'https://sheetdb.io/api/v1/ygjx7hr6r521t';
const modalEmpresas = document.getElementById('modalEmpresas');
const btnAbrirModal = document.getElementById('btnAbrirModalEmpresas');
const tabelaEmpresasBody = document.querySelector('#tabelaEmpresas tbody');




btnAbrirModal.addEventListener('click', async () => {
  tabelaEmpresasBody.innerHTML = '';
  limparTabelaProdutos();

  try {
    const res = await fetch(`${endpointBase}?sheet=Empresa`);
    if (!res.ok) throw new Error('Erro na resposta da API');
    const empresas = await res.json();

    if (empresas.length === 0) {
      tabelaEmpresasBody.innerHTML = '<tr><td colspan="3">Nenhuma empresa encontrada.</td></tr>';
    } else {
      empresas.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${emp.Id || ''}</td>
          <td>${emp.Rev || ''}</td>
          <td>${emp.NomeFantasia || ''}</td>
        `;
        tr.style.cursor = 'pointer';
        tr.title = 'Dê duplo clique para ver os produtos desta empresa';
        tr.addEventListener('dblclick', () => mostrarProdutosDaEmpresa(emp.Id, emp.Rev));
        tabelaEmpresasBody.appendChild(tr);
      });
    }

    modalEmpresas.showModal();
  } catch (error) {
    tabelaEmpresasBody.innerHTML = `<tr><td colspan="3">Erro ao buscar empresas: ${error.message}</td></tr>`;
    modalEmpresas.showModal();
  }
});

async function mostrarProdutosDaEmpresa(idEmpresa, revEmpresa) {
  modalEmpresas.close();

  try {
    const res = await fetch(`${endpointBase}?sheet=DM`);
    if (!res.ok) throw new Error('Erro na resposta da API');
    const produtos = await res.json();
    const produtosFiltrados = produtos.filter(p => p.Id === String(idEmpresa) && p.Rev === String(revEmpresa));

    if (produtosFiltrados.length === 0) {
      limparTabelaProdutos();
      alert('Nenhum produto encontrado para esta empresa/revisão.');
      return;
    }

    montarTabelaProdutosDinamica(produtosFiltrados);

    await preencherDivA(idEmpresa, revEmpresa);
  } catch (error) {
    alert(`Erro ao carregar produtos: ${error.message}`);
  }
}

async function preencherDivA(id, rev) {
  document.getElementById('id').value = id;
  document.getElementById('rev').value = rev;

  try {
    const res = await fetch(`${endpointBase}?sheet=Empresa`);
    if (!res.ok) throw new Error('Erro ao buscar dados da empresa');
    const empresas = await res.json();

    const empresa = empresas.find(e => e.Id === String(id) && e.Rev === String(rev));

    document.getElementById('nomeFantasia').value = empresa?.NomeFantasia || '';
    document.getElementById('cnpj').value = empresa?.CNPJ || '';
  } catch (error) {
    console.error('Erro ao preencher dados da empresa:', error);
    document.getElementById('nomeFantasia').value = '';
    document.getElementById('cnpj').value = '';
  }
}

function limparTabelaProdutos() {
  const produtosTable = document.getElementById('produtosTable');
  const thead = produtosTable.querySelector('thead');
  const tbody = produtosTable.querySelector('tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';
}

// IMPORTANTE: a função montarTabelaProdutosDinamica(produtos) deve estar exportada e importada corretamente
// para atualizar a tabela dinâmica na divB conforme o código anterior.

