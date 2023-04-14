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


const createTrackingUnits = (habit) => {
  const trackingDates = getTrackingDates();
  const currentMonth = getCurrentHabitTrackerMonth();
  let trackingUnits = '';

  trackingDates.forEach(date => {
    const disabledClass = currentMonth != date.getUTCMonth() + 1 ? 'disabled': '';
    const isoDate = date.toISOString().slice(0, 10);

    trackingUnits = `
        ${trackingUnits}
        <div class="tracking-unit-container">
            <div class="tracking-unit rounded-circle ${disabledClass}" data-habit="${habit}" data-tracking-date="${isoDate}" data-state="notTracked"></div>
        </div>
    `;
  });

  return trackingUnits;
};

function createHabitRow(habitId, habitName) {
  let habitRow = document.createElement('div');
  habitRow.className = 'habit-tracker-row';
  habitRow.dataset.habitId = habitId;
  habitRow.innerHTML = `
    <div class="habit-column">
      <div class="habit-name" data-habit="${habitName}">
        ${habitName}
      </div>
      <div class="hover-habit">
        <button type="button" class="btn btn-dark border" data-role="update-habit" data-habit="${habitName}" data-bs-toggle="modal" data-bs-target="#updateHabitModal">
          <i class="bi bi-pencil-square" style="color: var(--color-background-dark-2);"></i>
        </button>
          <button type="submit" class="btn btn-dark border" data-role="delete-habit" data-habit="${habitId}">
            <i class="bi bi-trash3" style="color: red;"></i>
          </button>
      </div>
    </div>
    ${createTrackingUnits(habitName)}
  `;

  habitRow.querySelectorAll('.tracking-unit[data-tracking-date]')
  .forEach(toggleTrackingOnClick);
  habitRow.querySelectorAll('[data-role="update-habit"]').forEach(readyUpdateHabitModal);
  habitRow.querySelectorAll('button[data-role="delete-habit"]').forEach(deleteHabitWithUndoOption);

  return habitRow;
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
      'X-CSRFToken': getCSRFToken()
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
    const newHabitRow = createHabitRow(response.data.id, habitName);

    const habitTracker = document.querySelector('#container')

    const habitRows = document.querySelectorAll('.habit-tracker-row');
    const lastRow = habitRows[habitRows.length - 1];
    habitTracker.insertBefore(newHabitRow, lastRow);

    hideAndCleanModalForm('#newHabitModal');
    fillUpToastAndShow(response.message, 'success');
  })
  .catch(response => {
    response.json().then(response => {
      fillUpToastAndShow(response.message, 'fail');
    });
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
      'X-CSRFToken': getCSRFToken()
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

    let trackingUnits = document.querySelectorAll(`.tracking-unit[data-habit=${oldHabitName}]`);
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
};

const deleteHabitWithUndoOption = el => {
  el.onclick = () => {
    const habitId = el.dataset.habit;
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

  // Component 6 - Delete habit
  document.querySelectorAll('button[data-role="delete-habit"]').forEach(deleteHabitWithUndoOption);
});
