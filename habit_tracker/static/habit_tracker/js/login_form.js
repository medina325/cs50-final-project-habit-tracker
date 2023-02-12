document.addEventListener('DOMContentLoaded', function() {

  let toggles = document.querySelectorAll('a[data-toggle]');
  let forms = [...toggles].map(el => document.querySelector(`#${el.dataset.toggle}`));

  toggles.forEach(toggle => {
    toggle.onclick = () => {
      const formId = toggle.dataset.toggle;
      
      let otherForm = [...forms].filter(form => form.id != formId);
      otherForm[0].classList.replace('active', 'inactive');

      document.querySelector(`#${formId}`).classList.replace('inactive', 'active');
    }
  });

});
