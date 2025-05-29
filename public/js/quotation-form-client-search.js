// quotation-form-client-search.js

let activeNameField = null;
let activePhoneField = null;
let activeTriggerField = null;
let selectedResultIndex = -1;
let debounceTimeout = null;

function openClientSearch(nameId = 'client-name', phoneId = 'client-phone') {
  activeNameField = document.getElementById(nameId);
  activePhoneField = document.getElementById(phoneId);

  // Track focus origin
  if (document.activeElement === activeNameField) {
    activeTriggerField = activeNameField;
  } else if (document.activeElement === activePhoneField) {
    activeTriggerField = activePhoneField;
  }

  const modal = document.getElementById('client-search-modal');
  if (modal) modal.classList.remove('hidden');

  document.getElementById('client-search-input').value = '';
  document.getElementById('client-search-results').innerHTML = '';
  document.getElementById('client-search-input').focus();
  selectedResultIndex = -1;
}

function closeClientSearch() {
  const modal = document.getElementById('client-search-modal');
  if (modal) modal.classList.add('hidden');

  // Restore focus and tab order
  setTimeout(() => {
    if (activeTriggerField) {
      activeTriggerField.setAttribute('tabindex', '-1');
      activeTriggerField.focus();
      setTimeout(() => {
        activeTriggerField.removeAttribute('tabindex');
      }, 50);
    }
  }, 50);

  activeNameField = null;
  activePhoneField = null;
  activeTriggerField = null;
  selectedResultIndex = -1;
}

function loadClientResults(query) {
  fetch(`/api/clients/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      const resultsBox = document.getElementById('client-search-results');
      resultsBox.innerHTML = '';
      selectedResultIndex = -1;

      if (!data.results || data.results.length === 0) {
        resultsBox.innerHTML = '<p class="text-gray-500">No clients found.</p>';
        return;
      }

      data.results.forEach((client, i) => {
        const div = document.createElement('div');
        div.className = 'result-item border px-2 py-1 rounded hover:bg-gray-100 cursor-pointer';
        div.textContent = `${client.name} (${client.phone})`;
        div.dataset.index = i;
        div.addEventListener('click', () => selectClient(client));
        resultsBox.appendChild(div);
      });
    })
    .catch(() => {
      document.getElementById('client-search-results').innerHTML = '<p class="text-red-500">Error loading clients.</p>';
    });
}

function highlightResult(index) {
  const items = document.querySelectorAll('#client-search-results .result-item');
  items.forEach(item => item.classList.remove('bg-blue-100'));
  if (items[index]) {
    items[index].classList.add('bg-blue-100');
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

function selectHighlightedResult() {
  const items = document.querySelectorAll('#client-search-results .result-item');
  if (selectedResultIndex >= 0 && selectedResultIndex < items.length) {
    items[selectedResultIndex].click();
  }
}

function selectClient(client) {
  if (activeNameField) activeNameField.value = client.name;
  if (activePhoneField) activePhoneField.value = client.phone;
  closeClientSearch();
}

window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('client-search-input');
  const resultsBox = document.getElementById('client-search-results');

  if (input) {
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (query.length >= 1) {
          loadClientResults(query);
        } else {
          resultsBox.innerHTML = '';
        }
      }, 200);
    });

    input.addEventListener('keydown', e => {
      const items = document.querySelectorAll('#client-search-results .result-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectedResultIndex < items.length - 1) {
          selectedResultIndex++;
          highlightResult(selectedResultIndex);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedResultIndex > 0) {
          selectedResultIndex--;
          highlightResult(selectedResultIndex);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectHighlightedResult();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeClientSearch();
      }
    });
  }
});
