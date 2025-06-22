
// 01_00_preencherForm.js --- Nome antigo: // formularioUtils.js

export function preencherFormulario(empresa, contatos = [], contatosContainer, criarContatoItem) {
  
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
      contatosContainer.appendChild(criarContatoItem(c.nome, c.cargo, c.email, c.telefone, i === 0, contatosContainer));
    });
  } else {
    contatosContainer.appendChild(criarContatoItem('', '', '', '', true, contatosContainer));
  }
}
