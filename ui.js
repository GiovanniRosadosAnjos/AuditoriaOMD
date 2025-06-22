import { criarContatoItem } from './01_00_CriarContato.js';
import { preencherFormulario } from './01_00_preencherForm.js';
import { limparFormulario } from './01_00_LimparForm.js';
import { ModalEmpresas } from './01_00_ModalEmpresas.js';

const btnRevisar = document.getElementById('btnRevisarCadastro');
const bntCancelarOperacao = document.getElementById('bntCancelarOperação');
const btnAddContato = document.getElementById('btnAddContato');
const form = document.getElementById('formEmpresa');
const contatosContainer = document.getElementById('contatosContainer');
const listaEmpresas = document.getElementById('listaEmpresas');
const modal = document.getElementById('modalEmpresas');

btnAddContato.addEventListener('click', () => {
  contatosContainer.appendChild(criarContatoItem('', '', '', '', false, contatosContainer));
});

btnRevisar.addEventListener('click', async () => {
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

    ModalEmpresas.preencherListaEmpresas({
      listaEmpresas,
      empresasMap,
      modal,
      contatosContainer,
      preencherFormulario,
      criarContatoItem,
      buscarRevisoesPorId
    });

    modal.showModal();
  } catch (e) {
    alert('Erro ao carregar lista de empresas.');
    console.error(e);
  }
});

bntCancelarOperacao.addEventListener('click', () => {
  limparFormulario(form, contatosContainer, criarContatoItem);
});

form.addEventListener('submit', async e => {
  e.preventDefault();

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
    const idsExistentes = data.map(row => parseInt(row.Id));
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
      Id: novoId.toString(),
      Rev: novaRev.toString(),
      NomeFantasia: document.getElementById('nomeFantasia').value,
      razao: document.getElementById('razaoSocial').value,
      CNPJ: document.getElementById('cnpj').value,
      Rua: document.getElementById('rua').value,
      num: document.getElementById('numero').value,
      bairro: document.getElementById('bairro').value,
      cidade: document.getElementById('cidade').value,
      UF: document.getElementById('estado').value,
      pais: document.getElementById('pais').value,
      CEP: document.getElementById('cep').value
    };

    await salvarEmpresa(empresaObj);

    const dataHoraAtual = new Date().toLocaleString();
    for (const c of contatos) {
      const contatoObj = {
        Id: novoId.toString(),
        Rev: novaRev.toString(),
        nome: c.nome,
        funcao: c.cargo,
        email: c.email,
        telefone: c.telefone,
        dataCadastro: dataHoraAtual
      };
      await salvarContato(contatoObj);
    }

    alert('Cadastro salvo com sucesso!');
    limparFormulario(form, contatosContainer, criarContatoItem);
  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro ao salvar cadastro.');
  }
});

// Função auxiliar para salvar na aba Contato
async function salvarContato(dados) {
  const res = await fetch('https://sheetdb.io/api/v1/ygjx7hr6r521t?sheet=Contato', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: dados })
  });
  if (!res.ok) throw new Error('Erro ao salvar contato');
  return await res.json();
}

// Função para buscar contatos na aba Contato por Id
async function buscarContatosPorId(id) {
  const res = await fetch(`https://sheetdb.io/api/v1/ygjx7hr6r521t/search?Id=${id}&sheet=Contato`);
  if (!res.ok) throw new Error('Erro ao buscar contatos');
  return await res.json();
}

// Sobrescreve a função preencherListaEmpresas do ModalEmpresas para incluir carregamento de contatos
ModalEmpresas.preencherListaEmpresas = function({
  listaEmpresas,
  empresasMap,
  modal,
  contatosContainer,
  preencherFormulario,
  criarContatoItem,
  buscarRevisoesPorId
}) {
  listaEmpresas.innerHTML = '';

  empresasMap.forEach(empresa => {
    const div = document.createElement('div');
    div.textContent = `ID: ${empresa.Id} | ${empresa.NomeFantasia}`;
    div.classList.add('empresa-item');

    div.addEventListener('dblclick', async () => {
      modal.close();
      document.getElementById('idEmpresaRevisao').value = empresa.Id;

      try {
        const revisoes = await buscarRevisoesPorId(empresa.Id);
        const latest = revisoes.reduce((acc, curr) =>
          parseInt(curr.Rev) > parseInt(acc.Rev) ? curr : acc, revisoes[0]);

        let contatos = [];
        try {
          const contatosRaw = await buscarContatosPorId(empresa.Id);
          if (Array.isArray(contatosRaw) && contatosRaw.length > 0) {
            const maxRev = Math.max(...contatosRaw.map(c => parseInt(c.Rev)));
            contatos = contatosRaw.filter(c => parseInt(c.Rev) === maxRev).map(c => ({
              nome: c.nome || '',
              cargo: c.funcao || '',
              email: c.email || '',
              telefone: c.telefone || ''
            }));
          }
        } catch {
          contatos = [];
        }

        preencherFormulario(latest, contatos, contatosContainer, criarContatoItem);
      } catch {
        preencherFormulario(empresa, [], contatosContainer, criarContatoItem);
      }
    });

    listaEmpresas.appendChild(div);
  });
};
