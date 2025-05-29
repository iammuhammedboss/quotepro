// 🔥 FIXED quotation-form-scope-search.js with Auto-Grow
console.log('✅ Loaded latest scope search with auto-grow fix');

let activeScopeRowIndex = null;
let selectedScopeIndex = -1;

function openScopeSearch(rowIndex) {
  activeScopeRowIndex = rowIndex;
  const modal = document.getElementById('scope-search-modal');
  const input = document.getElementById('scope-search-input');
  const results = document.getElementById('scope-search-results');

  if (!modal || !input || !results) return;

  modal.classList.remove('hidden');
  modal.style.zIndex = '9999';

  input.value = '';
  input.focus();
  results.innerHTML = '';
  loadScopeSearchResults('');
}

function closeSearchModal(type) {
  const modal = document.getElementById(`${type}-search-modal`);
  if (modal) modal.classList.add('hidden');

  if (type === 'scope') {
    activeScopeRowIndex = null;
    selectedScopeIndex = -1;
  }
}

function loadScopeSearchResults(query) {
  fetch(`/api/scope/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      const box = document.getElementById('scope-search-results');
      box.innerHTML = '';

      if (!data.results || data.results.length === 0) {
        box.innerHTML = '<p class="text-gray-500">No matches found.</p>';
        return;
      }

      selectedScopeIndex = -1;

      data.results.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'scope-result px-2 py-1 rounded hover:bg-gray-100 cursor-pointer';
        div.textContent = item.scope || '';
        div.dataset.index = i;
        div.addEventListener('click', () => selectScope(item));
        box.appendChild(div);
      });
    })
    .catch(() => {
      document.getElementById('scope-search-results').innerHTML = '<p class="text-red-500">Error loading results.</p>';
    });
}

function selectScope(item) {
  const row = document.querySelectorAll('#scope-body tr')[activeScopeRowIndex];
  if (row) {
    const textarea = row.querySelector('textarea.auto-grow');
    if (textarea) {
      // ✅ UPDATE VALUE AND TRIGGER AUTO-GROW
      textarea.value = item.scope || '';
      
      // ✅ TRIGGER AUTO-GROW IMMEDIATELY
      if (typeof autoGrow === 'function') {
        setTimeout(() => autoGrow(textarea), 10);
      }
      
      // ✅ UPDATE THE DATA MODEL
      if (typeof updateScopeRow === 'function') {
        updateScopeRow(activeScopeRowIndex, textarea.value);
      }
    }
  }
  closeSearchModal('scope');
}

function highlightScopeItem(index) {
  const items = document.querySelectorAll('.scope-result');
  if (!items.length) return;
  items.forEach(item => item.classList.remove('bg-blue-100'));
  if (items[index]) {
    items[index].classList.add('bg-blue-100');
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('scope-search-input');

  if (!input) return;

  input.addEventListener('input', () => {
    const val = input.value.trim();
    loadScopeSearchResults(val.length >= 1 ? val : '');
  });

  input.addEventListener('keydown', (e) => {
    const items = document.querySelectorAll('.scope-result');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedScopeIndex < items.length - 1) {
        selectedScopeIndex++;
        highlightScopeItem(selectedScopeIndex);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedScopeIndex > 0) {
        selectedScopeIndex--;
        highlightScopeItem(selectedScopeIndex);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedScopeIndex >= 0 && items[selectedScopeIndex]) {
        items[selectedScopeIndex].click();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearchModal('scope');
    }
  });
});