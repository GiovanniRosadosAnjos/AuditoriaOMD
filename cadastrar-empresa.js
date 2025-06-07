document.getElementById('formEmpresa').addEventListener('submit', function(e) { e.preventDefault(); alert('Empresa cadastrada com sucesso!'); });


document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const radioBrasil = document.getElementById('brasil');
  const radioExterior = document.getElementById('exterior');
  const cnpjInput = document.getElementById('cnpj');

  function atualizarObrigatoriedadeCNPJ() {
    if (radioBrasil.checked) {
      cnpjInput.setAttribute('required', 'required');
    } else {
      cnpjInput.removeAttribute('required');
    }
  }

  // Atualiza obrigatoriedade sempre que o radio mudar
  radioBrasil.addEventListener('change', atualizarObrigatoriedadeCNPJ);
  radioExterior.addEventListener('change', atualizarObrigatoriedadeCNPJ);

  // Também já define o estado inicial ao carregar a página
  atualizarObrigatoriedadeCNPJ();

  form.addEventListener('submit', (e) => {
    // Se Brasil está selecionado e o CNPJ está vazio, impede o envio e mostra alerta
    if (radioBrasil.checked && cnpjInput.value.trim() === '') {
      e.preventDefault();
      alert('O campo CNPJ é obrigatório quando a localização é Brasil.');
      cnpjInput.focus();
    }
  });
});

