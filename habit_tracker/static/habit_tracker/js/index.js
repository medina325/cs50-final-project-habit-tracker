function toggleTrackingOnClick(el) {
  el.onclick = () => {
    el.classList.toggle('habit-tracked');
  };
}

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function createHabitRow(habitName, parentDiv, newHabbitButton) {
  let newHabitNameCol = document.createElement('div');

  newHabitNameCol.className = 'habit-column';
  newHabitNameCol.innerText = habitName;

  parentDiv.insertBefore(newHabitNameCol, newHabbitButton);

  weekdays.forEach((weekday) => {
    let habitTrackingCircleContainer = document.createElement('div');
    habitTrackingCircleContainer.className = 'flex-circle-container';

    let habitTrackingCircle = document.createElement('div');
    habitTrackingCircle.className = 'fixed-aspect-ratio-circle';

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
        'year': parseInt(document.querySelector('[name=year]').value),
        'month': parseInt(document.querySelector('[name=month]').value)
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
    console.log('What is the problem??')
    throw err;
  });
    
  return false;
};

document.addEventListener('DOMContentLoaded', function() {

  // Component 1 - Day habit tracker
  document.querySelectorAll('.fixed-aspect-ratio-circle')
    .forEach(toggleTrackingOnClick);

  // Component 2 - Add new habit
  document.querySelector('#new-habit-form').onsubmit = () => createHabit();
  
});
