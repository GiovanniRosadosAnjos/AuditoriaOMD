// Limpa o formulário

function limparFormulario(form, contatosContainer, criarContatoItem) {
  form.reset();
  document.getElementById('idEmpresaRevisao').value = '';
  contatosContainer.innerHTML = '';
  contatosContainer.appendChild(criarContatoItem('', '', '', '', true, contatosContainer));
}

export { limparFormulario };
