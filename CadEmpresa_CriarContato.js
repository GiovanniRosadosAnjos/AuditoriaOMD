// CadEmpresa_CriarContato.js

function escaparValorContato(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function criarContatoItem(nome = '', cargo = '', email = '', telefone = '', exibirLabel = false, contatosContainer, id = '') {
  const div = document.createElement('div');
  div.className = 'contato-item';
  div.dataset.contatoId = id || '';

  const labelNome = exibirLabel ? '<label>Nome</label>' : '';
  const labelCargo = exibirLabel ? '<label>Cargo</label>' : '';
  const labelEmail = exibirLabel ? '<label>E-mail</label>' : '';
  const labelTelefone = exibirLabel ? '<label>Telefone</label>' : '';
  const tipoBotao = exibirLabel ? 'add' : 'remove';
  const textoBotao = exibirLabel ? '+' : '-';
  const classeBotao = exibirLabel ? 'btnAddContatoLinha' : 'btnRemoveContato';
  const tituloBotao = exibirLabel ? 'Adicionar contato' : 'Remover contato';

  div.innerHTML = `
    <input type="hidden" name="contatoId[]" value="${escaparValorContato(id)}" />
    <div class="form-group" style="flex: 2;">
      ${labelNome}
      <input type="text" name="contatoNome[]" value="${escaparValorContato(nome)}" />
    </div>
    <div class="form-group" style="flex: 2;">
      ${labelCargo}
      <input type="text" name="contatoCargo[]" value="${escaparValorContato(cargo)}" />
    </div>
    <div class="form-group" style="flex: 3;">
      ${labelEmail}
      <input type="email" name="contatoEmail[]" value="${escaparValorContato(email)}" />
    </div>
    <div class="form-group" style="flex: 2;">
      ${labelTelefone}
      <input type="tel" name="contatoTelefone[]" value="${escaparValorContato(telefone)}" />
    </div>
    <button type="button" class="${classeBotao}" data-acao="${tipoBotao}" title="${tituloBotao}">${textoBotao}</button>
  `;

  const botaoLinha = div.querySelector('button[data-acao]');

  botaoLinha.addEventListener('click', () => {
    const acao = botaoLinha.dataset.acao;

    if (acao === 'add') {
      contatosContainer.appendChild(criarContatoItem('', '', '', '', false, contatosContainer, ''));
      return;
    }

    if (contatosContainer.querySelectorAll('.contato-item').length > 1) {
      div.remove();
      const primeiroContato = contatosContainer.querySelector('.contato-item');

      if (primeiroContato && !primeiroContato.querySelector('label')) {
        const nomeInput = primeiroContato.querySelector('input[name="contatoNome[]"]').value;
        const cargoInput = primeiroContato.querySelector('input[name="contatoCargo[]"]').value;
        const emailInput = primeiroContato.querySelector('input[name="contatoEmail[]"]').value;
        const telefoneInput = primeiroContato.querySelector('input[name="contatoTelefone[]"]').value;
        const idInput = primeiroContato.querySelector('input[name="contatoId[]"]')?.value || '';
        const novoContato = criarContatoItem(nomeInput, cargoInput, emailInput, telefoneInput, true, contatosContainer, idInput);
        contatosContainer.replaceChild(novoContato, primeiroContato);
      }
    } else {
      alert('Deve haver pelo menos um contato.');
    }
  });

  return div;
}
