// 🔥 FIXED quotation-form-items-search.js with Auto-Grow
console.log('✅ Loaded latest item description search with auto-grow fix');

let activeItemRowIndex = null;
let selectedItemIndex = -1;

function openItemSearch(rowIndex) {
  activeItemRowIndex = rowIndex;

  const modal = document.getElementById('item-search-modal');
  const input = document.getElementById('item-search-input');
  const results = document.getElementById('item-search-results');

  if (!modal || !input || !results) return;

  modal.classList.remove('hidden');
  modal.style.zIndex = '9999';

  input.value = '';
  input.focus();
  results.innerHTML = '';

  loadItemSearchResults('');
}

function closeItemSearch() {
  const modal = document.getElementById('item-search-modal');
  if (modal) modal.classList.add('hidden');

  activeItemRowIndex = null;
  selectedItemIndex = -1;
}

function loadItemSearchResults(query) {
  fetch(`/api/quotation-items/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      const box = document.getElementById('item-search-results');
      box.innerHTML = '';

      if (!data.results || data.results.length === 0) {
        box.innerHTML = '<p class="text-gray-500">No items found.</p>';
        return;
      }

      selectedItemIndex = -1;

      data.results.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'item-result px-2 py-1 rounded hover:bg-gray-100 cursor-pointer';
        div.textContent = item.item || '';
        div.dataset.index = i;
        div.addEventListener('click', () => selectItemSuggestion(item));
        box.appendChild(div);
      });
    })
    .catch(() => {
      document.getElementById('item-search-results').innerHTML = '<p class="text-red-500">Error loading items.</p>';
    });
}

function selectItemSuggestion(item) {
  const row = document.querySelectorAll('#items-body tr')[activeItemRowIndex];

  if (row) {
    const descriptionTextarea = row.querySelector('textarea.auto-grow');
    const unitInput = row.querySelector('input[name="unit"]') || row.querySelectorAll('input')[2];

    if (descriptionTextarea) {
      // ✅ UPDATE VALUE AND TRIGGER AUTO-GROW
      descriptionTextarea.value = item.item || '';
      
      // ✅ TRIGGER AUTO-GROW IMMEDIATELY
      if (typeof autoGrow === 'function') {
        setTimeout(() => autoGrow(descriptionTextarea), 10);
      }
      
      // ✅ UPDATE THE DATA MODEL
      if (typeof updateItemField === 'function') {
        updateItemField(activeItemRowIndex, 'description', item.item || '');
      }
    }

    if (unitInput) {
      unitInput.value = item.unit || '';
      if (typeof updateItemField === 'function') {
        updateItemField(activeItemRowIndex, 'unit', item.unit || '');
      }
    }
  }

  closeItemSearch();
}

function highlightItem(index) {
  const items = document.querySelectorAll('.item-result');
  if (!items.length) return;
  items.forEach(el => el.classList.remove('bg-blue-100'));
  if (items[index]) {
    items[index].classList.add('bg-blue-100');
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('item-search-input');

  if (!input) return;

  input.addEventListener('input', () => {
    const val = input.value.trim();
    loadItemSearchResults(val.length >= 1 ? val : '');
  });

  input.addEventListener('keydown', (e) => {
    const items = document.querySelectorAll('.item-result');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedItemIndex < items.length - 1) {
        selectedItemIndex++;
        highlightItem(selectedItemIndex);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedItemIndex > 0) {
        selectedItemIndex--;
        highlightItem(selectedItemIndex);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedItemIndex >= 0 && items[selectedItemIndex]) {
        items[selectedItemIndex].click();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeItemSearch();
    }
  });
});