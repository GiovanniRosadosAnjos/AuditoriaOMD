export function montarTabelaProdutosDinamica(produtos) {
  const produtosTable = document.getElementById('produtosTable');
  const thead = produtosTable.querySelector('thead');
  const tbody = produtosTable.querySelector('tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';

  const campos = [
    { label: 'Nome do DM', id: 'NomeDM' },
    { label: 'Nome Técnico do DM', id: 'NomeTecDM' },
    { label: 'Família', id: 'Familia' },
    { label: 'obs1', id: 'obs1' },
    { label: 'Classe de Risco (ANVISA)', id: 'ClasseRiscoANVISA', tipo: 'select', opcoes: ['I', 'II', 'III', 'IV'] },
    { label: 'Tipo de Obrigação na ANVISA', id: 'Tipo' },
    { label: 'N.º do Registro ou Notificação', id: 'nRegistroOUnotificacao' },
    { label: 'N.º do processo', id: 'nProcessoANVISA' },
    { label: 'Data de Vencimento do Registro', id: 'DataVencReg', tipo: 'date' },
    { label: 'Certificação Compulsória? (SBAC)', id: 'SBAC_Obrigatorio', tipo: 'select', opcoes: ['Sim', 'Não'] },
    { label: 'N.º do Certificado', id: 'SBAC_nCertificado' },
    { label: 'Data de Vencimento Certificado', id: 'SBAC_VencCertificado', tipo: 'date' },
    { label: 'obs2', id: 'obs2' },
    { label: 'obs3', id: 'obs3' },
  ];

  // Cabeçalho
  const trHead = document.createElement('tr');
  trHead.innerHTML = `<th class="coluna1">Grupo</th><th class="coluna2">Campo / Produto</th>`;
  produtos.forEach((_, i) => {
    trHead.innerHTML += `<th>Produto ${i + 1}</th>`;
  });
  thead.appendChild(trHead);

  campos.forEach((campo, idx) => {
    const tr = document.createElement('tr');
    if (idx === 0) tr.innerHTML += `<td rowspan="${campos.length}" class="coluna1">Produto</td>`;
    tr.innerHTML += `<td class="coluna2">${campo.label}</td>`;

    produtos.forEach((produto, i) => {
      const valor = produto[campo.id] || '';
      const td = document.createElement('td');

      if (campo.tipo === 'select') {
        const select = document.createElement('select');
        select.id = `${campo.id}_${i + 1}`;
        select.name = select.id;
        select.innerHTML = `<option value="" disabled selected>Selecione</option>`;
        campo.opcoes.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = campo.id === 'ClasseRiscoANVISA'
            ? `${opt}: ${opt === 'I' ? 'baixo' : opt === 'II' ? 'médio' : opt === 'III' ? 'alto' : 'máximo'} risco`
            : opt;
          if (opt === valor) option.selected = true;
          select.appendChild(option);
        });
        td.appendChild(select);
      } else if (campo.tipo === 'date') {
        const input = document.createElement('input');
        input.type = 'date';
        input.id = `${campo.id}_${i + 1}`;
        input.name = input.id;
        input.value = valor;
        td.appendChild(input);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `${campo.id}_${i + 1}`;
        input.name = input.id;
        input.value = valor;
        td.appendChild(input);
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

export function adicionarColunaProduto() {
  const produtosTable = document.getElementById('produtosTable');
  const thead = produtosTable.querySelector('thead tr');
  const tbody = produtosTable.querySelector('tbody');

  const numProdutos = thead.children.length - 2;
  const novoIndice = numProdutos + 1;

  const th = document.createElement('th');
  th.textContent = `Produto ${novoIndice}`;
  thead.appendChild(th);

  const linhas = tbody.querySelectorAll('tr');

  linhas.forEach((tr) => {
    const td = document.createElement('td');
    const campoLabel = tr.children[1].textContent.trim();
    let input;

    const idBase = campoLabel
      .normalize("NFD")
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '')
      .replace(/\W/g, '')
      .replace(/[()]/g, '')
      .replace(/-/g, '')
      .replace(/:/g, '')
      .replace(/\./g, '');

    const inputId = `${idBase}_${novoIndice}`;

    switch (campoLabel) {
      case 'Classe de Risco (ANVISA)':
        input = document.createElement('select');
        input.id = inputId;
        input.name = inputId;
        ['','I','II','III','IV'].forEach(val => {
          const option = document.createElement('option');
          option.value = val;
          option.text = val === '' ? 'Selecione' : `${val}: ${val === 'I' ? 'baixo risco' : val === 'II' ? 'médio risco' : val === 'III' ? 'alto risco' : 'máximo risco'}`;
          input.appendChild(option);
        });
        break;
      case 'Certificação Compulsória? (SBAC)':
        input = document.createElement('select');
        input.id = inputId;
        input.name = inputId;
        ['','Sim','Não'].forEach(val => {
          const option = document.createElement('option');
          option.value = val;
          option.text = val === '' ? 'Selecione' : val;
          input.appendChild(option);
        });
        break;
      case 'Data de Vencimento do Registro':
      case 'Data de Vencimento Certificado':
        input = document.createElement('input');
        input.type = 'date';
        input.id = inputId;
        input.name = inputId;
        break;
      default:
        input = document.createElement('input');
        input.type = 'text';
        input.id = inputId;
        input.name = inputId;
        break;
    }

    td.appendChild(input);
    tr.appendChild(td);
  });
}

const btnAdicionarProduto = document.getElementById('btnAdicionarProduto');
if (btnAdicionarProduto) {
  btnAdicionarProduto.addEventListener('click', adicionarColunaProduto);
}
