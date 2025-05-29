let unitBox = null;
let unitInput = null;
let currentRowIndex = null;
let debounceTimer = null;
let unitResults = [];
let unitSelectedIndex = -1;

function showUnitSuggestions(input, rowIndex) {
  unitInput = input;
  currentRowIndex = rowIndex;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const query = input.value.trim();
    loadUnitSuggestions(query);
  }, 200);
}

function loadUnitSuggestions(query) {
  fetch(`/api/units/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.results || data.results.length === 0) {
        hideUnitBox();
        return;
      }
      unitResults = data.results;
      renderUnitBox(unitResults, unitInput);
    })
    .catch(() => hideUnitBox());
}

function renderUnitBox(units, input) {
  if (!unitBox) unitBox = document.getElementById('unit-suggestion-box');
  if (!unitBox) return;

  unitBox.innerHTML = '';
  unitBox.classList.remove('hidden');

  const rect = input.getBoundingClientRect();
  unitBox.style.position = 'absolute';
  unitBox.style.top = `${window.scrollY + rect.bottom}px`;
  unitBox.style.left = `${window.scrollX + rect.left}px`;
  unitBox.style.width = `${rect.width}px`;
  unitBox.style.zIndex = 9999;

  unitSelectedIndex = -1;

  units.forEach((unit, i) => {
    const div = document.createElement('div');
    div.className = 'unit-item px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm';
    div.textContent = unit.unit;
    div.dataset.index = i;
    div.addEventListener('click', () => selectUnit(unit.unit));
    unitBox.appendChild(div);
  });
}

function selectUnit(unitText) {
  if (unitInput) {
    unitInput.value = unitText;
    unitInput.dispatchEvent(new Event('change'));
    if (typeof updateItemField === 'function') {
  updateItemField(currentRowIndex, 'unit', unitText);
}

  }
  hideUnitBox();
}

function hideUnitBox() {
  if (unitBox) {
    unitBox.classList.add('hidden');
    unitBox.innerHTML = '';
  }
  unitInput = null;
  currentRowIndex = null;
  unitResults = [];
  unitSelectedIndex = -1;
}

function highlightUnit(index) {
  const items = document.querySelectorAll('#unit-suggestion-box .unit-item');
  items.forEach(item => item.classList.remove('bg-blue-100'));
  if (items[index]) {
    items[index].classList.add('bg-blue-100');
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

function selectHighlightedUnit() {
  if (unitResults[unitSelectedIndex]) {
    selectUnit(unitResults[unitSelectedIndex].unit);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  unitBox = document.getElementById('unit-suggestion-box');

  document.addEventListener('click', (e) => {
    if (unitBox && !unitBox.contains(e.target) && e.target !== unitInput) {
      hideUnitBox();
    }
  });

  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input') && e.target.closest('td')) {
      const td = e.target.closest('td');
      const index = Array.from(document.querySelectorAll('#items-body tr')).findIndex(tr => tr.contains(td));
      if (td.cellIndex === 3 && index !== -1) {
        showUnitSuggestions(e.target, index);
      } else {
        hideUnitBox();
      }
    } else {
      hideUnitBox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!unitBox || unitBox.classList.contains('hidden')) return;
    const items = document.querySelectorAll('#unit-suggestion-box .unit-item');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (unitSelectedIndex < items.length - 1) {
        unitSelectedIndex++;
        highlightUnit(unitSelectedIndex);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (unitSelectedIndex > 0) {
        unitSelectedIndex--;
        highlightUnit(unitSelectedIndex);
      }
    } else if (e.key === 'Enter') {
      if (unitSelectedIndex >= 0) {
        e.preventDefault();
        selectHighlightedUnit();
      }
    } else if (e.key === 'Escape') {
      hideUnitBox();
    }
  });
});
