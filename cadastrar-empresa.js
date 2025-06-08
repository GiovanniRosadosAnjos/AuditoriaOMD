document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formEmpresa');
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

  radioBrasil.addEventListener('change', atualizarObrigatoriedadeCNPJ);
  radioExterior.addEventListener('change', atualizarObrigatoriedadeCNPJ);

  atualizarObrigatoriedadeCNPJ();

  form.addEventListener('submit', (e) => {
    if (radioBrasil.checked && cnpjInput.value.trim() === '') {
      e.preventDefault();
      alert('O campo CNPJ é obrigatório quando a localização é Brasil.');
      cnpjInput.focus();
    } else {
      e.preventDefault(); // evita o reload da página
      alert('Empresa cadastrada com sucesso!');
      // aqui você pode resetar o form ou enviar os dados via AJAX
    }
  });
});
