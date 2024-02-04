const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getCurrentHabitTrackerYear() {
  return parseInt(document.querySelector('[name=year]').value);
}

function getCurrentHabitTrackerMonth() {
  return parseInt(document.querySelector('[name=month]').value);
}

const getCSRFToken = () => {
  return document.querySelector('input[name=csrfmiddlewaretoken]').value;
}

function getTrackingDates() {
  const [start, end] = [
    ...document.querySelectorAll('span[data-date]')
  ].map(span => span.dataset.date);
  
  for (var arr=[], dt=new Date(start); dt <= new Date(end); dt.setDate(dt.getDate()+1))
  {
    arr.push(
      new Date(dt)
    );
  }

  return arr;
};

function insertAfter(newElement, existingElement) {
  existingElement.parentNode.insertBefore(newElement, existingElement.nextSibling);
}

function hideAndCleanModalForm(modalId) {
  bootstrap.Modal.getInstance(modalId).hide();
  
  document.querySelector('#input-habit-name').value = '';
  document.querySelectorAll('.form-check-input').forEach((input) => {
    input.checked = false;
  });
}

const scrollYears = el => {
  el.onclick = () => {
    let currentYearElement = document.querySelector('#habit-tracker-year');
    const selectedYear = parseInt(currentYearElement.innerText);

    if (el.dataset.yearScroll == 'next')
      currentYearElement.innerHTML = selectedYear + 1;
    else if (el.dataset.yearScroll == 'previous')
      currentYearElement.innerHTML = selectedYear - 1;
  }
};

const switchHabitTrackerMonthYear = el => {
  el.onclick = () => {
    let currentYearElement = document.querySelector('#habit-tracker-year');
    const year = currentYearElement.innerText;
    const month = el.dataset.month;
    const baseURL = window.location.origin;
    window.location.href = new URL(`${baseURL}/${year}/${month}`);
  }
};

const readyUpdateHabitModal = el => {
  el.onclick = () => {
    const habitName = el.dataset.habit;
    const habitId = el.dataset.habitId;
    document.querySelector('input[name=habitId').value = habitId;
    document.querySelector('#input-update-habit-name').value = habitName;
    document.querySelector('input[name=oldHabitName]').value = habitName;
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

function updateHabit() {
  let trackingWeekdays = {}
  document.querySelectorAll('.form-check-input').forEach(radio => {
    trackingWeekdays[radio.value] = radio.checked;
  })
  
  const newHabitName = document.querySelector('#input-update-habit-name').value;
  const oldHabitName = document.querySelector('input[name=oldHabitName]').value;
  const habitId = document.querySelector('input[name=habitId]').value;
  
  fetch('/update_habit', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken()
    },
    mode: "same-origin",
    body: JSON.stringify({
      data: {
        'habit_id': habitId,
        'old_name': oldHabitName,
        'new_name': newHabitName,
        'weekdays': trackingWeekdays,
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
    let habitEl = document.querySelector(`.habit-name[data-habit="${oldHabitName}"]`);
    habitEl.dataset.habit = newHabitName;
    habitEl.innerText = newHabitName;

    let editBtn = document.querySelector(`button[data-habit="${oldHabitName}"`);
    editBtn.dataset.habit = newHabitName;

    let trackingUnits = document.querySelectorAll(`.tracking-unit[data-habit="${oldHabitName}"]`);
    trackingUnits.forEach(el => {
      el.dataset.habit = newHabitName;
      toggleTrackingOnClick(el);
    });

    hideAndCleanModalForm('#updateHabitModal');
    fillUpToastAndShow(response.message, 'success');
  })
  .catch(response => {
    response.json().then(response => {
      fillUpToastAndShow(response.message, 'fail');
    });
  });

  return false;
};

const toggleTrackingOnClick = el => {
  el.onclick = () => {
    const stateMap = {
      tracked: {
        url: '/untrack_habit',
        toggleState: 'notTracked'
      },
      notTracked: {
        url: '/track_habit',
        toggleState: 'tracked'
      }
    };
  
    const {url, toggleState} = stateMap[el.dataset.state]
  
    fetch(url, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken()
      },
      mode: "same-origin",
      body: JSON.stringify({
        data: {
          'habit_id': el.dataset.habitId,
          'name': el.dataset.habit,
          'date': el.dataset.trackingDate,
        }
      })  
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .then(() => {
      el.dataset.state = toggleState;
      el.classList.add('tracking-unit-animation');

      el.addEventListener('animationend', () => {
        el.classList.remove('tracking-unit-animation');
        toggleTrackingOnClick(el);
      });
    })
    .catch(response => {
      response.json().then(response => {
        fillUpToastAndShow(response.message, 'fail');
      })
    });
  };
};

const deleteHabitWithUndoOption = el => {
  el.onclick = () => {
    const habitId = el.dataset.habitId;
    fetch(`/delete_habit/${habitId}`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken()
      },
      mode: "same-origin"
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .then(response => {
      const habitRow = document.querySelector(`.habit-tracker-row[data-habit-id="${habitId}"]`);
      habitRow.style.animationPlayState = 'running';
      habitRow.addEventListener('animationend', () => {
        document.querySelector('#habit-toast-undo-delete__message').innerText = response.message;
        const toastEl = document.querySelector('#habit-toast-undo-delete');
        const toaster = new bootstrap.Toast(toastEl);
        toaster.show();
  
        habitRow.remove();
      });
    })
    .catch(response => {
      response.json().then(response => {
        fillUpToastAndShow(response.message, 'fail');
      });
    });
  };
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

document.addEventListener('DOMContentLoaded', function() {
  // Initializing Tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // Component 3 - Scroll through the years
  document.querySelectorAll('.year-scroller').forEach(scrollYears);

  // Component 4 - Pick a month/year for the habit tracker
  document.querySelectorAll('.btn-month').forEach(switchHabitTrackerMonthYear);

  // Component 5 - Ready edit modal and actually edit habit
  document.querySelectorAll('[data-role="update-habit"]').forEach(readyUpdateHabitModal);
  document.querySelector('#update-habit-submit-btn').onclick = updateHabit;

  // Component 6 - Delete habit
  document.querySelectorAll('button[data-role="delete-habit"]').forEach(deleteHabitWithUndoOption);

  document.addEventListener('htmx:afterRequest', function(event) {
    if (!isValidStatusCode(event.detail.xhr.status) || !isValidEvent(event)) return;

    const createdHabitName = event.detail.xhr.getResponseHeader('hx-habit-name');
    const updateModalBtn = document.querySelector(
      `[data-role="update-habit"][data-habit="${createdHabitName}"]`
    );
    readyUpdateHabitModal(updateModalBtn); // updateModalBtn.onclick = readyUpdateHabitModal;

    const deleteModalBtn = document.querySelector(
      `[data-role="delete-habit"][data-habit="${createdHabitName}"]`
    );
    deleteHabitWithUndoOption(deleteModalBtn); // deleteModalBtn.onclick = deleteHabitWithUndoOption;
  });

  document.addEventListener('habitCreated', function(event) {
    hideAndCleanModalForm('#newHabitModal');
    
    const message = event.detail.value;
    if (message) {
      fillUpToastAndShow(message, 'success');
    }
  });

  document.addEventListener('htmx:responseError', function(event) {
      const error_message = event.detail.xhr.response;
      
      if (error_message) {
          fillUpToastAndShow(error_message, 'fail');
      }
  });
});
