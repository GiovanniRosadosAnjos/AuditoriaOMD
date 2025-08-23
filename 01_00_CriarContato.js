// 01_00_CriarContato.js

export function criarContatoItem(nome = '', cargo = '', email = '', telefone = '', exibirLabel = false, contatosContainer) {
  const div = document.createElement('div');
  div.className = 'contato-item';

  // --- LÓGICA CORRIGIDA ---
  // Cria os labels separadamente para maior clareza.
  const labelNome = exibirLabel ? '<label>Nome</label>' : '';
  const labelCargo = exibirLabel ? '<label>Cargo</label>' : '';
  const labelEmail = exibirLabel ? '<label>E-mail</label>' : '';
  const labelTelefone = exibirLabel ? '<label>Telefone</label>' : '';

  div.innerHTML = `
    <div class="form-group" style="flex: 2;">
      ${labelNome}
      <input type="text" name="contatoNome[]" value="${nome}" />
    </div>
    <div class="form-group" style="flex: 2;">
      ${labelCargo}
      <input type="text" name="contatoCargo[]" value="${cargo}" />
    </div>
    <div class="form-group" style="flex: 3;">
      ${labelEmail}
      <input type="email" name="contatoEmail[]" value="${email}" />
    </div>
    <div class="form-group" style="flex: 2;">
      ${labelTelefone}
      <input type="tel" name="contatoTelefone[]" value="${telefone}" />
    </div>
    <button type="button" class="btnRemoveContato">-</button>
  `;

  div.querySelector('.btnRemoveContato').addEventListener('click', () => {
    // A lógica de remoção não precisa de alteração, mas é mantida.
    if (contatosContainer.querySelectorAll('.contato-item').length > 1) {
      div.remove();
      const primeiroContato = contatosContainer.querySelector('.contato-item');
      // Garante que o primeiro item sempre tenha labels.
      if (primeiroContato && !primeiroContato.querySelector('label')) {
        const nomeInput = primeiroContato.querySelector('input[name="contatoNome[]"]').value;
        const cargoInput = primeiroContato.querySelector('input[name="contatoCargo[]"]').value;
        const emailInput = primeiroContato.querySelector('input[name="contatoEmail[]"]').value;
        const telefoneInput = primeiroContato.querySelector('input[name="contatoTelefone[]"]').value;
        const novoContato = criarContatoItem(nomeInput, cargoInput, emailInput, telefoneInput, true, contatosContainer);
        contatosContainer.replaceChild(novoContato, primeiroContato);
      }
    } else {
      alert('Deve haver pelo menos um contato.');
    }
  });

  return div;
}
