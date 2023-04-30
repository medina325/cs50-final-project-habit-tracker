const storeTheme = theme => {
  fetch('/store_theme', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken()
    },
    mode: "same-origin",
    body: JSON.stringify({
      data: {
        'theme': theme
      }
    })
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  })
  .then(response => {
    applyTheme(theme);
    fillUpToastAndShow(response.message, 'success');
  })
  .catch(response => {
    response.json().then(response => {
      fillUpToastAndShow(response.message, 'fail');
    });
  });
};

const applyTheme = (theme) => {
  document.querySelector('body').className = theme;
};

document.addEventListener('DOMContentLoaded', function() {
  const colorThemes = document.querySelectorAll('input[name="theme"]');
  
  colorThemes.forEach((option) => {
    option.addEventListener('click', () => {
      storeTheme(option.id);
    });
  })
})
