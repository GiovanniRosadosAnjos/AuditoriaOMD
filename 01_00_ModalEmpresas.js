export const ModalEmpresas = {
  preencherListaEmpresas({
    listaEmpresas,
    empresasMap,
    modal,
    contatosContainer,
    preencherFormulario,
    criarContatoItem,
    buscarRevisoesPorId
  }) {
    listaEmpresas.innerHTML = ''; // Limpa o conteúdo do modal

    empresasMap.forEach(empresa => {
      const div = document.createElement('div');
      div.textContent = `ID: ${empresa.Id} | ${empresa.NomeFantasia}`;
      div.classList.add('empresa-item');

      div.addEventListener('dblclick', async () => {
        modal.close();
        document.getElementById('idEmpresaRevisao').value = empresa.Id;

        try {
          const revisoes = await buscarRevisoesPorId(empresa.Id);
          const latest = revisoes.reduce((acc, curr) =>
            parseInt(curr.Rev) > parseInt(acc.Rev) ? curr : acc, revisoes[0]);

          let contatos = [];
          if (latest.Contatos) {
            try {
              contatos = JSON.parse(latest.Contatos);
            } catch {
              contatos = [];
            }
          }

          preencherFormulario(latest, contatos, contatosContainer, criarContatoItem);
        } catch {
          preencherFormulario(empresa, [], contatosContainer, criarContatoItem);
        }
      });

      listaEmpresas.appendChild(div);
    });
  }
};
