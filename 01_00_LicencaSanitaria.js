// 01_00_LicencaSanitaria.js

// Função principal que será exportada
export function inicializarLicencaSanitaria() {
  // Elementos do formulário principal
  const btnAbrirModal = document.getElementById('btnAbrirModalLicenca');
  const licencaStatus = document.getElementById('licencaSanitariaStatus');
  const hiddenCEVS = document.getElementById('licencaCEVS');
  const hiddenValidade = document.getElementById('licencaValidade');
  const hiddenSubgrupo = document.getElementById('licencaSubgrupo');

  // Elementos do Modal
  const modal = document.getElementById('modalLicencaSanitaria');
  const modalCEVS = document.getElementById('modalLicencaCEVS');
  const modalValidade = document.getElementById('modalLicencaValidade');
  const modalSubgrupo = document.getElementById('modalLicencaSubgrupo');
  const btnSalvarLicenca = document.getElementById('btnSalvarLicenca');
  const btnCancelarLicenca = document.getElementById('btnCancelarLicenca');
  
  // Seleciona todas as células com a classe 'cnae-cell'
  const cnaeCells = modal.querySelectorAll('.cnae-cell');

  // 1. Lógica para ABRIR o modal
  btnAbrirModal.addEventListener('click', () => {
    modalCEVS.value = hiddenCEVS.value;
    modalValidade.value = hiddenValidade.value;
    modalSubgrupo.value = hiddenSubgrupo.value;
    modal.showModal();
  });

  // 2. Lógica para CANCELAR (fechar o modal)
  btnCancelarLicenca.addEventListener('click', () => {
    modal.close();
  });

  // 3. Lógica para SALVAR os dados do modal no formulário principal
  btnSalvarLicenca.addEventListener('click', () => {
    const cevs = modalCEVS.value.trim();
    const validade = modalValidade.value;
    const subgrupo = modalSubgrupo.value.trim();

    hiddenCEVS.value = cevs;
    hiddenValidade.value = validade;
    hiddenSubgrupo.value = subgrupo;

    if (validade) {
      const dataFormatada = new Date(validade + 'T00:00:00').toLocaleDateString('pt-BR');
      licencaStatus.textContent = `Licença Sanitária: Preenchida (Validade: ${dataFormatada})`;
      licencaStatus.style.color = 'green';
    } else if (cevs || subgrupo) {
      licencaStatus.textContent = 'Licença Sanitária: Preenchida (sem validade)';
      licencaStatus.style.color = 'orange';
    } else {
      licencaStatus.textContent = 'Licença Sanitária: Não preenchida';
      licencaStatus.style.color = 'black';
    }

    modal.close();
  });

  // 4. NOVA LÓGICA: Duplo clique para preencher o Subgrupo
  cnaeCells.forEach(cell => {
    cell.addEventListener('dblclick', () => {
      // Pega o conteúdo de texto da célula e remove espaços extras
      const fullText = cell.textContent.trim();
      
      // Extrai apenas o código CNAE (a primeira "palavra" do texto)
      const cnaeCode = fullText.split(' ')[0];
      
      // Coloca o código extraído no campo de input
      modalSubgrupo.value = cnaeCode;
    });
  });
}
