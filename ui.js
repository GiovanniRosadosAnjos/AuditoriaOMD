// Referência de elementos
const form = document.getElementById('formEmpresa');
const btnRevisar = document.getElementById('btnRevisarCadastro');
const btnNovoCadastro = document.getElementById('btnNovoCadastro');
const modal = document.getElementById('modalEmpresas');
const listaEmpresas = document.getElementById('listaEmpresas');
const contatosContainer = document.getElementById('contatosContainer');
const btnAddContato = document.getElementById('btnAddContato');

// Função para criar um contato
function criarContatoItem(nome = '', email = '', telefone = '', exibirLabel = false) {
  const div = document.createElement('div');
  div.className = 'divC-inputs contato-item';

  div.innerHTML = `
    <div class="form-group">
      ${exibirLabel ? '<label>Nome</label>' : ''}
      <input type="text" name="contatoNome[]" value="${nome}" />
    </div>
    <div class="form-group">
      ${exibirLabel ? '<label>E-mail</label>' : ''}
      <input type="email" name="contatoEmail[]" value="${email}" />
    </div>
    <div class="form-group">
      ${exibirLabel ? '<label>Telefone</label>' : ''}
      <input type="tel" name="contatoTelefone[]" value="${telefone}" />
    </div>
    <button type="button" class="btnRemoveContato" style="height: 36px; align-self: flex-end;">-</button>
  `;

  div.querySelector('.btnRemoveContato').addEventListener('click', () => {
    if (contatosContainer.querySelectorAll('.contato-item').length > 1) {
      div.remove();
      const primeiroContato = contatosContainer.querySelector('.contato-item');
      if (primeiroContato) {
        const nomeInput = primeiroContato.querySelector('input[name="contatoNome[]"]').value;
        const emailInput = primeiroContato.querySelector('input[name="contatoEmail[]"]').value;
        const telefoneInput = primeiroContato.querySelector('input[name="contatoTelefone[]"]').value;
        primeiroContato.innerHTML = criarContatoItem(nomeInput, emailInput, telefoneInput, true).innerHTML;
      }
    } else {
      alert('Deve haver pelo menos um contato.');
    }
  });

  return div;
}

// Limpa o formulário
function limparFormulario() {
  form.reset();
  document.getElementById('idEmpresaRevisao').value = '';
  contatosContainer.innerHTML = '';
  contatosContainer.appendChild(criarContatoItem('', '', '', true));
}

// Preenche formulário com dados
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

  contatosContainer.innerHTML = '';
  if (contatos.length > 0) {
    contatos.forEach((c, i) => {
      contatosContainer.appendChild(criarContatoItem(c.nome, c.email, c.telefone, i === 0));
    });
  } else {
    contatosContainer.appendChild(criarContatoItem('', '', '', true));
  }
}

// Adiciona contato
btnAddContato.addEventListener('click', () => {
  contatosContainer.appendChild(criarContatoItem());
});

// Revisar cadastro
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

          preencherFormulario(latest, contatos);

        } catch {
          preencherFormulario(empresa, []);
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

// Novo cadastro
btnNovoCadastro.addEventListener('click', () => {
  limparFormulario();
});

// Salvar dados
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
