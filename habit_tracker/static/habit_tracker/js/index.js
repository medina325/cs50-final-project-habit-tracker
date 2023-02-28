const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getYear() {
  return parseInt(document.querySelector('[name=year]').value);
}

function getMonth() {
  return parseInt(document.querySelector('[name=month]').value);
}

function getTrackingDates() {
  const [start, end] = [
    ...document.querySelectorAll('span[data-date]')
  ].map(span => span.dataset.date);
  
  for (var arr=[], dt=new Date(start); dt <= new Date(end); dt.setDate(dt.getDate()+1))
  {
    arr.push(
      new Date(dt).toISOString().slice(0, 10)
    );
  }

  return arr;
};

function createHabitRow(habitName, parentDiv, newHabbitButton) {
  let newHabitNameCol = document.createElement('div');

  newHabitNameCol.className = 'habit-column';
  newHabitNameCol.innerText = habitName;

  parentDiv.insertBefore(newHabitNameCol, newHabbitButton);
  const trackingDates = getTrackingDates();
  trackingDates.reverse().forEach(trackingDate => {
    let habitTrackingCircleContainer = document.createElement('div');
    habitTrackingCircleContainer.className = 'flex-circle-container';

    let habitTrackingCircle = document.createElement('div');
    habitTrackingCircle.className = 'fixed-aspect-ratio-circle';
    habitTrackingCircle.dataset.habitName = habitName;
    habitTrackingCircle.dataset.trackingDate = trackingDate;
    habitTrackingCircle.dataset.state = '';

    habitTrackingCircleContainer.appendChild(habitTrackingCircle);
    toggleTrackingOnClick(habitTrackingCircle);
    
    insertAfter(habitTrackingCircleContainer, newHabitNameCol);
  });
}

function insertAfter(newElement, existingElement) {
  existingElement.parentNode.insertBefore(newElement, existingElement.nextSibling);
}

function hideAndCleanModalForm() {
  bootstrap.Modal.getInstance('#newHabitModal').hide();

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
        'year': getYear(),
        'month': getMonth()
      }
    })
  })
  .then(response => {
    const newHabbitButton = document.getElementById('add-new-habit-button');
    newHabitRow = createHabitRow(habitName, newHabbitButton.parentNode, newHabbitButton)
    hideAndCleanModalForm();

    // Create small popup with the response message and a undo option
  })
  .catch(err => {
    throw err;
  });
    
  return false;
}

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
          'name': el.dataset.habitName,
          'year': getYear(),
          'month': getMonth(),
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
    .then(response => {
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

  // Component 1 - Add tracking functionality for every "tracking unit"
  document.querySelectorAll('.fixed-aspect-ratio-circle[data-tracking-date]')
    .forEach(toggleTrackingOnClick);

  // Component 2 - Add new habit
  document.querySelector('#new-habit-form').onsubmit = () => createHabit();
  
});
