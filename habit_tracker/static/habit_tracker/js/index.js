document.addEventListener('DOMContentLoaded', function() {

  function toggleTrackingOnClick(el) {
    el.onclick = () => {
      el.classList.toggle('habit-tracked');
    };
  }

  document.querySelectorAll('.fixed-aspect-ratio-circle')
    .forEach(toggleTrackingOnClick);

});