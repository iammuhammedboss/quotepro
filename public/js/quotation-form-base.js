// public/js/quotation-form-base.js
// Core toggle functionality for form sections

function initializeToggleSections() {
  const toggles = document.querySelectorAll('.toggle-section');

  toggles.forEach(toggle => {
    const targetId = toggle.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);

    if (!targetEl) return;

    // Initial state check
    if (toggle.checked) {
      targetEl.classList.remove('hidden');
    } else {
      targetEl.classList.add('hidden');
    }

    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        targetEl.classList.remove('hidden');
      } else {
        targetEl.classList.add('hidden');
      }
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initializeToggleSections();
});