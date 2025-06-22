// 01_00_LimparForm.js  

// nome antigo: "cad-empr-limparForm.js"

function limparFormulario(form, contatosContainer, criarContatoItem) {
  form.reset();
  document.getElementById('idEmpresaRevisao').value = '';
  contatosContainer.innerHTML = '';
  contatosContainer.appendChild(criarContatoItem('', '', '', '', true, contatosContainer));
}

export { limparFormulario };



