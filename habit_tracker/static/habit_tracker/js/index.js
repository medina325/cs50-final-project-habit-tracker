function getCurrentHabitTrackerYear() {
  return parseInt(document.querySelector('[name=year]').value);
}

function getCurrentHabitTrackerMonth() {
  return parseInt(document.querySelector('[name=month]').value);
}

function hideAndCleanModalForm(modalId) {
  bootstrap.Modal.getInstance(modalId).hide();
  
  document.querySelector('#input-habit-name').value = '';
  document.querySelectorAll('.form-check-input').forEach((input) => {
    input.checked = false;
  });
}

const scrollYear = (value) => {
  const currentYearElement = document.querySelector('#habit-tracker-year');
  const selectedYear = parseInt(currentYearElement.innerText);
  currentYearElement.innerHTML = selectedYear + value;
}

const switchHabitTrackerMonthYear = (event) => {
  if (event.target && event.target.matches('.btn-month')) {
      let currentYearElement = document.querySelector('#habit-tracker-year');
      const year = currentYearElement.innerText;
      const month = event.target.dataset.month;
      const baseURL = window.location.origin;
      window.location.href = new URL(`${baseURL}/${year}/${month}`);
  }
};

const readyUpdateHabitModal = el => {
  el.onclick = () => {
    const habitName = el.dataset.habit;
    const habitId = el.dataset.habitId;
    document.getElementById('update-habit-form').dataset.hxTarget = `[data-habit-id="${habitId}"]`;
    document.querySelector('input[name=habit_id_update]').value = habitId;
    document.querySelector('#input-update-habit-name').value = habitName;
    document.querySelector('input[name=old_name]').value = habitName;
  }
};

function createToast(toastEl, elOptions) {
  let options = elOptions || {
    animation: true,
    autohide: true,
    delay: 5000
  }

  return new bootstrap.Toast(toastEl, options);
}

const fillUpToastAndShow = (message, toastRole, options) => {
  document.querySelector(`#habit-toast-${toastRole}__message`).innerText = message;
  let toastEl = document.querySelector(`#habit-toast-${toastRole}`);
  let toaster = createToast(toastEl, options);

  toaster.show();
};

const isValidStatusCode = (status) => {
  const regex = /^2\d{2}$/;
  return regex.test(status.toString());
};

const isValidEvent = (event) => {
  const responseHeader = event.detail.xhr.getResponseHeader('hx-trigger');
  if (responseHeader === null) {
    return false;
  }

  const validEvents = ['habitCreated']; // TODO Melhorar essa parte

  const eventName = Object.keys(JSON.parse(responseHeader))[0];
  return validEvents.includes(eventName);
}

const handleHabitEvent = (event, modalSelector) => {
  hideAndCleanModalForm(modalSelector);

  const message = event.detail.value;
  if (message) {
    fillUpToastAndShow(message, 'success');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Initializing Bootstrap 5 Tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // Defining click handlers for scrolling through the years
  document.querySelector('[data-year-scroll="next"]').onclick = () => scrollYear(1);
  document.querySelector('[data-year-scroll="previous"]').onclick = () => scrollYear(-1);

  // Defining handlers for picking the month and year for the habit tracker
  document.getElementById('months-container').addEventListener('click', switchHabitTrackerMonthYear);

  // Ready edit modal
  document.querySelectorAll('[data-role="update-habit"]').forEach(readyUpdateHabitModal);

  // Event listeners for HTMX responses
  document.addEventListener('habitCreated', (event) => {
    handleHabitEvent(event, '#newHabitModal');
  });

  document.addEventListener('habitUpdated', (event) => {
    handleHabitEvent(event, '#updateHabitModal');
  });

  document.addEventListener('habitDeleted', (event) => {
    const habitName = event.detail.value;
    const habitRow = document.querySelector(`.habit-tracker-row[data-habit="${habitName}"]`);
    habitRow.style.animationPlayState = 'running';
    habitRow.addEventListener('animationend', () => {
      fillUpToastAndShow(`Habit ${habitName} deleted`, 'undo-delete');
      habitRow.remove();
    });
  });

  document.addEventListener('htmx:responseError', function(event) {
      const error_message = event.detail.xhr.response;
      
      if (error_message) {
        fillUpToastAndShow(error_message, 'fail');
      }
  });

  document.addEventListener('htmx:afterRequest', function(event) {
    if (!isValidStatusCode(event.detail.xhr.status) || !isValidEvent(event)) return;

    const createdHabitName = event.detail.xhr.getResponseHeader('hx-habit-name');
    const updateModalBtn = document.querySelector(
      `[data-role="update-habit"][data-habit="${createdHabitName}"]`
    );
    readyUpdateHabitModal(updateModalBtn); // updateModalBtn.onclick = readyUpdateHabitModal;
  });
});
