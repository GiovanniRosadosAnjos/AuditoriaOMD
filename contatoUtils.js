// contatoUtils.js

// Função para criar um item de contato (com evento de remoção)
export function criarContatoItem(nome = '', email = '', telefone = '', exibirLabel = false, contatosContainer) {
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
      // Atualiza o primeiro contato para exibir os labels
      const primeiroContato = contatosContainer.querySelector('.contato-item');
      if (primeiroContato) {
        const nomeInput = primeiroContato.querySelector('input[name="contatoNome[]"]').value;
        const emailInput = primeiroContato.querySelector('input[name="contatoEmail[]"]').value;
        const telefoneInput = primeiroContato.querySelector('input[name="contatoTelefone[]"]').value;
        // Recria o primeiro contato com labels exibidos
        primeiroContato.innerHTML = criarContatoItem(nomeInput, emailInput, telefoneInput, true, contatosContainer).innerHTML;
      }
    } else {
      alert('Deve haver pelo menos um contato.');
    }
  });

  return div;
}
