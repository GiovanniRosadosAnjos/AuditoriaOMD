import { criarContatoItem } from './contatoUtils.js';
import { preencherFormulario } from './formularioUtils.js';

// Referência de elementos
const btnRevisar = document.getElementById('btnRevisarCadastro');
const btnNovoCadastro = document.getElementById('btnNovoCadastro');
const btnAddContato = document.getElementById('btnAddContato');

const form = document.getElementById('formEmpresa');                    // div: A, B e C
const modal = document.getElementById('modalEmpresas');
const listaEmpresas = document.getElementById('listaEmpresas');
const contatosContainer = document.getElementById('contatosContainer'); // div C

// Limpa o formulário
function limparFormulario() {
  form.reset();
  document.getElementById('idEmpresaRevisao').value = '';
  contatosContainer.innerHTML = '';
  contatosContainer.appendChild(criarContatoItem('', '', '', true, contatosContainer));
}

// Evento para adicionar novo contato
btnAddContato.addEventListener('click', () => {
  contatosContainer.appendChild(criarContatoItem('', '', '', false, contatosContainer));
});

// Evento para revisar cadastro
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

    listaEmpresas.innerHTML = '';
    empresasMap.forEach(empresa => {
      const div = document.createElement('div');
      div.textContent = `ID: ${empresa.Id} | Nome: ${empresa.NomeFantasia}`;
      div.classList.add('empresa-item');

      div.addEventListener('dblclick', async () => {
        modal.close();
        document.getElementById('idEmpresaRevisao').value = empresa.Id;

        try {
          const revisoes = await buscarRevisoesPorId(empresa.Id);
          const latest = revisoes.reduce((acc, curr) => parseInt(curr.Rev) > parseInt(acc.Rev) ? curr : acc, revisoes[0]);

          let contatos = [];
          if (latest.Contatos) {
            try {
              contatos = JSON.parse(latest.Contatos);
            } catch {
              contatos = [];
            }
          }

          // Chamada da função modularizada preenchendo o formulário
          preencherFormulario(latest, contatos, contatosContainer, criarContatoItem);

        } catch {
          // Caso erro na busca das revisões, preenche com dados da empresa básica
          preencherFormulario(empresa, [], contatosContainer, criarContatoItem);
        }
      });

      listaEmpresas.appendChild(div);
    });

    modal.showModal();
  } catch (e) {
    alert('Erro ao carregar lista de empresas.');
    console.error(e);
  }
});

// Evento para novo cadastro - limpa o formulário
btnNovoCadastro.addEventListener('click', () => {
  limparFormulario();
});

// Evento para salvar dados
form.addEventListener('submit', async e => {
  e.preventDefault();

  const idRevisao = document.getElementById('idEmpresaRevisao').value;

  const nomes = [...document.querySelectorAll('input[name="contatoNome[]"]')].map(i => i.value.trim());
  const emails = [...document.querySelectorAll('input[name="contatoEmail[]"]')].map(i => i.value.trim());
  const telefones = [...document.querySelectorAll('input[name="contatoTelefone[]"]')].map(i => i.value.trim());

  const contatos = [];
  for (let i = 0; i < nomes.length; i++) {
    if (nomes[i] || emails[i] || telefones[i]) {
      contatos.push({ nome: nomes[i], email: emails[i], telefone: telefones[i] });
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
      CEP: document.getElementById('cep').value,
      Contatos: JSON.stringify(contatos)
    };

    await salvarEmpresa(empresaObj);
    alert('Cadastro salvo com sucesso!');
    limparFormulario();
  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro ao salvar cadastro.');
  }
});
