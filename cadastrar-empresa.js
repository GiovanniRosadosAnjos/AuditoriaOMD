const endpoint = 'https://sheetdb.io/api/v1/ygjx7hr6r521t';

const form = document.getElementById('formEmpresa');
const btnRevisar = document.getElementById('btnRevisarCadastro');
const btnNovoCadastro = document.getElementById('btnNovoCadastro');
const modal = document.getElementById('modalEmpresas');
const listaEmpresas = document.getElementById('listaEmpresas');

const contatosContainer = document.getElementById('contatosContainer');
const btnAddContato = document.getElementById('btnAddContato');

// Função para criar um bloco de contato (nome, email, telefone + remover)
function criarContatoItem(nome = '', email = '', telefone = '') {
  const div = document.createElement('div');
  div.className = 'divC-inputs contato-item';

  div.innerHTML = `
    <div class="form-group">
      <label>Nome</label>
      <input type="text" name="contatoNome[]" value="${nome}" />
    </div>
    <div class="form-group">
      <label>E-mail</label>
      <input type="email" name="contatoEmail[]" value="${email}" />
    </div>
    <div class="form-group">
      <label>Telefone</label>
      <input type="tel" name="contatoTelefone[]" value="${telefone}" />
    </div>
    <button type="button" class="btnRemoveContato" style="height: 36px; align-self: flex-end;">-</button>
  `;

  // Botão remover contato
  div.querySelector('.btnRemoveContato').addEventListener('click', () => {
    // Só remove se tiver mais de 1 contato
    if (contatosContainer.querySelectorAll('.contato-item').length > 1) {
      div.remove();
    } else {
      alert('Deve haver pelo menos um contato.');
    }
  });

  return div;
}

// Inicializa evento para adicionar contatos
btnAddContato.addEventListener('click', () => {
  const novoContato = criarContatoItem();
  contatosContainer.appendChild(novoContato);
});

// Limpa todos os campos do formulário e contatos (mantendo um contato vazio)
function limparFormulario() {
  form.reset();
  document.getElementById('idEmpresaRevisao').value = '';
  contatosContainer.innerHTML = '';
  contatosContainer.appendChild(criarContatoItem());
}

// Preenche formulário com dados da empresa e contatos
function preencherFormulario(empresa, contatos = []) {
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

  // Limpa contatos atuais e adiciona os recebidos
  contatosContainer.innerHTML = '';
  if (contatos.length > 0) {
    contatos.forEach(contato => {
      const item = criarContatoItem(contato.nome, contato.email, contato.telefone);
      contatosContainer.appendChild(item);
    });
  } else {
    contatosContainer.appendChild(criarContatoItem());
  }
}

// Evento botão Revisar Cadastro - abre modal com lista de empresas para selecionar
btnRevisar.addEventListener('click', async () => {
  try {
    const response = await fetch(`${endpoint}`);
    if (!response.ok) throw new Error('Erro na requisição: ' + response.status);

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      alert('Nenhuma empresa cadastrada.');
      return;
    }

    // Agrupa os dados pelo ID, pegando apenas o maior Rev
    const empresasMap = new Map();
    data.forEach((empresa) => {
      const id = empresa.Id;
      if (!empresasMap.has(id) || parseInt(empresasMap.get(id).Rev) < parseInt(empresa.Rev)) {
        empresasMap.set(id, empresa);
      }
    });

    listaEmpresas.innerHTML = '';

    empresasMap.forEach((empresa) => {
      const div = document.createElement('div');
      div.textContent = `ID: ${empresa.Id} | Nome: ${empresa.NomeFantasia}`;
      div.classList.add('empresa-item');
      div.addEventListener('dblclick', async () => {
        document.getElementById('idEmpresaRevisao').value = empresa.Id;
        modal.close();

        // Buscar todas as revisões desta empresa para extrair contatos (se existir)
        try {
          const res = await fetch(`${endpoint}/search?Id=${empresa.Id}`);
          const revisoes = await res.json();

          // Pegar a revisão com maior Rev para preencher formulário
          const latest = revisoes.reduce((acc, curr) => (parseInt(curr.Rev) > parseInt(acc.Rev) ? curr : acc), revisoes[0]);

          // Extrair contatos (se estiverem salvos no formato esperado)
          // Aqui, vamos supor que os contatos estão salvos em arrays JSON nas colunas extras, 
          // ou no seu backend você pode implementar isso; por enquanto, deixamos em branco
          // Caso queira, podemos armazenar contatos serializados em uma coluna separada.
          // Por ora, vamos preencher só os campos da empresa:
          preencherFormulario(latest, []); 

        } catch (e) {
          console.error('Erro ao carregar revisões da empresa:', e);
          preencherFormulario(empresa, []);
        }
      });
      listaEmpresas.appendChild(div);
    });

    modal.showModal();

  } catch (error) {
    alert('Erro ao carregar lista de empresas.');
    console.error(error);
  }
});

// Botão novo cadastro limpa formulário para entrada de dados novos
btnNovoCadastro.addEventListener('click', () => {
  limparFormulario();
});

// Submit do formulário - salva (POST) nova empresa ou revisão
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Construir o objeto com dados do formulário
  const idRevisao = document.getElementById('idEmpresaRevisao').value;
  let novoId = 1;
  let novaRev = 0;

  // Pega os contatos preenchidos no formulário
  const nomes = [...document.querySelectorAll('input[name="contatoNome[]"]')].map(i => i.value.trim());
  const emails = [...document.querySelectorAll('input[name="contatoEmail[]"]')].map(i => i.value.trim());
  const telefones = [...document.querySelectorAll('input[name="contatoTelefone[]"]')].map(i => i.value.trim());

  // Monta array de contatos só com os que têm pelo menos um campo preenchido
  const contatos = [];
  for (let i = 0; i < nomes.length; i++) {
    if (nomes[i] || emails[i] || telefones[i]) {
      contatos.push({
        nome: nomes[i],
        email: emails[i],
        telefone: telefones[i]
      });
    }
  }

  try {
    // Buscar IDs para definir o novo ID e a revisão
    const response = await fetch(`${endpoint}`);
    const data = await response.json();

    // Descobrir o maior ID existente
    const idsExistentes = data.map(row => parseInt(row.Id));
    const maxId = idsExistentes.length > 0 ? Math.max(...idsExistentes) : 0;

    if (!idRevisao) {
      // Novo cadastro - cria ID + 1
      novoId = maxId + 1;
      novaRev = 0;
    } else {
      // Revisão de cadastro existente
      novoId = parseInt(idRevisao);
      // Pegar o maior rev dessa empresa e adicionar +1
      const revsDaEmpresa = data.filter(row => parseInt(row.Id) === novoId).map(row => parseInt(row.Rev));
      novaRev = revsDaEmpresa.length > 0 ? Math.max(...revsDaEmpresa) + 1 : 0;
    }

    // Montar objeto para envio (adaptar para os campos do SheetDB)
    // Para contatos, você pode serializar em JSON numa coluna extra (exemplo: "Contatos")
    // Se ainda não tiver essa coluna, pode criar, ou para testes pode ignorar
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
      Contatos: JSON.stringify(contatos)  // suposição de coluna extra para contatos em JSON
    };

    // POST para o SheetDB
    const postResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: empresaObj })
    });

    if (!postResponse.ok) {
      throw new Error('Erro ao salvar os dados');
    }

    alert('Cadastro salvo com sucesso!');
    limparFormulario();

  } catch (error) {
    console.error('Erro ao salvar:', error);
    alert('Erro ao salvar cadastro.');
  }
});
