const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getCurrentHabitTrackerYear() {
  return parseInt(document.querySelector('[name=year]').value);
}

function getCurrentHabitTrackerMonth() {
  return parseInt(document.querySelector('[name=month]').value);
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

function createHabitRow(habitName, parentDiv, newHabbitButton) {
  const currentMonth = getCurrentHabitTrackerMonth();

  let newHabitNameCol = document.createElement('div');
  
  newHabitNameCol.className = 'habit-column';
  newHabitNameCol.innerText = habitName;

  parentDiv.insertBefore(newHabitNameCol, newHabbitButton);
  const trackingDates = getTrackingDates();
  trackingDates.reverse().forEach(trackingDate => {
    let habitTrackingCircleContainer = document.createElement('div');
    habitTrackingCircleContainer.className = 'tracking-unit-container';
    
    let habitTrackingCircle = document.createElement('div');
    
    const disabledClass = currentMonth != trackingDate.getUTCMonth() + 1 ? 'disabled': '';
    habitTrackingCircle.className = `tracking-unit rounded-circle ${disabledClass}`;

    habitTrackingCircle.dataset.habitName = habitName;
    habitTrackingCircle.dataset.trackingDate = trackingDate.toISOString().slice(0, 10);
    habitTrackingCircle.dataset.state = 'notTracked';

    habitTrackingCircleContainer.appendChild(habitTrackingCircle);
    toggleTrackingOnClick(habitTrackingCircle);
    
    insertAfter(habitTrackingCircleContainer, newHabitNameCol);
  });
}

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

function createHabit() {
  let trackingWeekdays = {}
  document.querySelectorAll('.form-check-input').forEach(radio => {
    trackingWeekdays[radio.value] = radio.checked;
  })

  const habitName = document.querySelector('#input-habit-name').value
  
  fetch('/create_habit', {
    method: 'POST',
    headers: {
      'X-CSRFToken': document.querySelector('input[name=csrfmiddlewaretoken]').value
    },
    mode: "same-origin",
    body: JSON.stringify({
      data: {
        'name': habitName,
        'weekdays': trackingWeekdays,
        'year': getCurrentHabitTrackerYear(),
        'month': getCurrentHabitTrackerMonth()
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
    const newHabbitButton = document.getElementById('add-new-habit-button');
    newHabitRow = createHabitRow(habitName, newHabbitButton.parentNode, newHabbitButton)

    hideAndCleanModalForm('#newHabitModal');
    fillUpToastAndShow(response.message, 'success');
  })
  .catch(err => {
    throw err;
  });
    
  return false;
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
  
  fetch('/update_habit', {
    method: 'POST',
    headers: {
      'X-CSRFToken': document.querySelector('input[name=csrfmiddlewaretoken]').value
    },
    mode: "same-origin",
    body: JSON.stringify({
      data: {
        'old_name': oldHabitName,
        'new_name': newHabitName,
        'weekdays': trackingWeekdays,
        'year': getCurrentHabitTrackerYear(),
        'month': getCurrentHabitTrackerMonth()
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
    let habitEl = document.querySelector(`.habit-name[data-habit=${oldHabitName}]`);
    habitEl.dataset.habit = newHabitName;
    habitEl.innerText = newHabitName;

    let editBtn = document.querySelector(`button[data-habit=${oldHabitName}`);
    editBtn.dataset.habit = newHabitName;

    let trackingUnit = document.querySelector(`.tracking-unit[data-habit=${oldHabitName}]`);
    trackingUnit.dataset.habit = newHabitName;

    hideAndCleanModalForm('#updateHabitModal');
    fillUpToastAndShow(response.message, 'success');
  })
  .catch(response => {
    response.json().then(response => {
      hideAndCleanModalForm('#updateHabitModal');
      fillUpToastAndShow(response.message, 'fail');
    });
  });

  return false;
};

function toggleTrackingOnClick(el) {
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

  el.onclick = () => {
    fetch(url, {
      method: 'POST',
      mode: "same-origin",
      body: JSON.stringify({
        data: {
          'name': el.dataset.habit,
          'year': getCurrentHabitTrackerYear(),
          'month': getCurrentHabitTrackerMonth(),
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
      toggleTrackingOnClick(el);
    })
    .catch(response => {
      response.json().then(json_response => {
        return json_response.error;
      })
    });
  };
}

document.addEventListener('DOMContentLoaded', function() {
  // Initializing Tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // Component 1 - Add tracking functionality for every "tracking unit"
  document.querySelectorAll('.tracking-unit[data-tracking-date]')
    .forEach(toggleTrackingOnClick);

  // Component 2 - Add new habit
  document.querySelector('#new-habit-submit-btn').onclick = createHabit;

  // Component 3 - Scroll through the years
  document.querySelectorAll('.year-scroller').forEach(scrollYears);

  // Component 4 - Pick a month/year for the habit tracker
  document.querySelectorAll('.btn-month').forEach(switchHabitTrackerMonthYear);

  // Component 5 - Ready edit modal and actually edit habit
  document.querySelectorAll('[data-role="update-habit"]').forEach(readyUpdateHabitModal);
  document.querySelector('#update-habit-submit-btn').onclick = updateHabit;
});
