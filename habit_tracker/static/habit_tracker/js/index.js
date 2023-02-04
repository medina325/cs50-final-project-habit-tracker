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
  const inputs = [...document.querySelectorAll('#new-habit-form input')];

  let trackingWeekdays = {}
  document.querySelectorAll('.form-check-input').forEach(radio => {
    trackingWeekdays[radio.value] = radio.checked;
  })
  
  fetch('/create_habit', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        'habit_name': document.querySelector('#input-habit-name').value,
        'weekdays': trackingWeekdays
      }
    })
  })
  .then(response => {
    const newHabbitButton = document.getElementById('add-new-habit-button');
    newHabitRow = createHabitRow(inputs[0].value, newHabbitButton.parentNode, newHabbitButton)
    hideAndCleanModalForm();

    // Create small popup with the response message and a undo option
  })
  .catch(response => {
    console.log('What is the problem??')
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
