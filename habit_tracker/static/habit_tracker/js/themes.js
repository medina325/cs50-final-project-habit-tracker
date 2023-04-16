const storeTheme = theme => {
  localStorage.setItem('theme', theme);
};

const applyTheme = () => {
  const theme = localStorage.getItem('theme');
  const radioEl = document.querySelector(`#${theme}`);

  if (!radioEl) {
    document.querySelector('body').classList.add(`${theme}`);
    return;
  }

  radioEl.checked = true;
};

document.addEventListener('DOMContentLoaded', function() {
  const colorThemes = document.querySelectorAll('input[name="theme"]');
  
  colorThemes.forEach((option) => {
    option.addEventListener('click', () => {
      storeTheme(option.id);
    });
  })

  applyTheme();
})
