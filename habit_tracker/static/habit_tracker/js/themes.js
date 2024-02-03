const storeTheme = async (theme) => {
  try {
    const response = await fetch('/store_theme', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken(),
        'Content-Type': 'application/json'
      },
      mode: "same-origin",
      body: JSON.stringify({
        data: {
          'theme': theme
        }
      })
    });

    const responseData = await response.json();
    response.ok && applyTheme(theme);

    const status = response.ok ? 'success' : 'fail';
    fillUpToastAndShow(responseData.message, status);
  } catch (error) {
    fillUpToastAndShow('An error occurred', 'fail');
  }
};


const applyTheme = (theme) => {
  document.querySelector('body').className = theme;
  
  const favicon = document.querySelector('link[rel=icon]');
  favicon.href = favicon.href.replace(/-(\w+)\.ico/g, `-${theme}.ico`);

  const logo = document.querySelector('img[class=logo]');
  logo.src = logo.src.replace(/-(\w+)\.ico/g, `-${theme}.ico`);
};

document.addEventListener('DOMContentLoaded', function() {
  const colorThemes = document.querySelectorAll('input[name="theme"]');
  
  colorThemes.forEach((option) => {
    option.addEventListener('click', () => {
      storeTheme(option.id);
    });
  })
})
