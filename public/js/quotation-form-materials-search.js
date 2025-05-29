// 🔥 FIXED quotation-form-materials-search.js with Auto-Grow
let activeMaterialRowIndex = null;
let selectedMaterialIndex = -1;

function openMaterialSearch(rowIndex) {
  activeMaterialRowIndex = rowIndex;
  const modal = document.getElementById('materials-search-modal');
  const input = document.getElementById('materials-search-input');
  const results = document.getElementById('materials-search-results');

  if (!modal || !input || !results) return;

  modal.classList.remove('hidden');
  modal.style.zIndex = '9999';

  input.value = '';
  input.focus();
  results.innerHTML = '';

  loadMaterialSearchResults('');
}

function closeMaterialSearch() {
  const modal = document.getElementById('materials-search-modal');
  if (modal) modal.classList.add('hidden');

  activeMaterialRowIndex = null;
  selectedMaterialIndex = -1;
}

function loadMaterialSearchResults(query) {
  fetch(`/api/materials/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      const box = document.getElementById('materials-search-results');
      box.innerHTML = '';

      if (!data.results || data.results.length === 0) {
        box.innerHTML = '<p class="text-gray-500">No matches found.</p>';
        return;
      }

      selectedMaterialIndex = -1;

      data.results.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'material-result px-2 py-1 rounded hover:bg-gray-100 cursor-pointer';
        div.textContent = item.material_name || '';
        div.dataset.index = i;
        div.addEventListener('click', () => selectMaterial(item));
        box.appendChild(div);
      });
    })
    .catch(() => {
      document.getElementById('materials-search-results').innerHTML =
        '<p class="text-red-500">Error loading results.</p>';
    });
}

function selectMaterial(item) {
  const row = document.querySelectorAll('#materials-body tr')[activeMaterialRowIndex];
  if (row) {
    const textarea = row.querySelector('textarea.auto-grow');
    if (textarea) {
      // ✅ UPDATE VALUE AND TRIGGER AUTO-GROW
      textarea.value = item.material_name || '';
      
      // ✅ TRIGGER AUTO-GROW IMMEDIATELY
      if (typeof autoGrow === 'function') {
        setTimeout(() => autoGrow(textarea), 10);
      }
      
      // ✅ UPDATE THE DATA MODEL
      if (typeof updateMaterialsRow === 'function') {
        updateMaterialsRow(activeMaterialRowIndex, item.material_name || '');
      }
    }
  }
  closeMaterialSearch();
}

function highlightMaterialItem(index) {
  const items = document.querySelectorAll('.material-result');
  if (!items.length) return;
  items.forEach(item => item.classList.remove('bg-blue-100'));
  if (items[index]) {
    items[index].classList.add('bg-blue-100');
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('materials-search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    const val = input.value.trim();
    loadMaterialSearchResults(val.length >= 1 ? val : '');
  });

  input.addEventListener('keydown', (e) => {
    const items = document.querySelectorAll('.material-result');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedMaterialIndex < items.length - 1) {
        selectedMaterialIndex++;
        highlightMaterialItem(selectedMaterialIndex);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedMaterialIndex > 0) {
        selectedMaterialIndex--;
        highlightMaterialItem(selectedMaterialIndex);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedMaterialIndex >= 0 && items[selectedMaterialIndex]) {
        items[selectedMaterialIndex].click();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeMaterialSearch();
    }
  });
});