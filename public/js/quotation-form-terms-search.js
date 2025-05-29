// 🔥 FIXED quotation-form-terms-search.js with Auto-Grow
let activeTermRowIndex = null;
let selectedTermIndex = -1;

function openTermSearch(rowIndex) {
  console.log('📦 Opening term search for row:', rowIndex);
  activeTermRowIndex = rowIndex;

  const modal = document.getElementById('terms-search-modal');
  const input = document.getElementById('terms-search-input');
  const results = document.getElementById('terms-search-results');

  if (!modal || !input || !results) {
    console.error('❌ Term search modal or elements missing');
    return;
  }

  modal.classList.remove('hidden');
  modal.style.zIndex = '9999';

  input.value = '';
  input.focus();

  results.innerHTML = '';
  loadTermSearchResults('');
}

function closeSearchModal(type) {
  const modal = document.getElementById(`${type}-search-modal`);
  if (modal) modal.classList.add('hidden');

  if (type === 'terms') {
    activeTermRowIndex = null;
    selectedTermIndex = -1;
  }
}

function loadTermSearchResults(query) {
  fetch(`/api/terms/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      const box = document.getElementById('terms-search-results');
      box.innerHTML = '';

      if (!data.results || data.results.length === 0) {
        box.innerHTML = '<p class="text-gray-500">No matches found.</p>';
        return;
      }

      data.results.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'term-result px-2 py-1 rounded hover:bg-gray-100 cursor-pointer';
        div.textContent = item.term || '';
        div.dataset.index = i;
        div.addEventListener('click', () => selectTerm(item));
        box.appendChild(div);
      });
    })
    .catch(() => {
      document.getElementById('terms-search-results').innerHTML = '<p class="text-red-500">Error loading results.</p>';
    });
}

function selectTerm(item) {
  const row = document.querySelectorAll('#terms-body tr')[activeTermRowIndex];
  if (row) {
    const textarea = row.querySelector('textarea.auto-grow');
    if (textarea) {
      // ✅ UPDATE VALUE AND TRIGGER AUTO-GROW
      textarea.value = item.term || '';
      
      // ✅ TRIGGER AUTO-GROW IMMEDIATELY
      if (typeof autoGrow === 'function') {
        setTimeout(() => autoGrow(textarea), 10);
      }
      
      // ✅ UPDATE THE DATA MODEL
      if (typeof updateTermsRow === 'function') {
        updateTermsRow(activeTermRowIndex, textarea.value);
      }
    }
  }
  closeSearchModal('terms');
}

function highlightTermItem(index) {
  const items = document.querySelectorAll('.term-result');
  if (!items.length) return;
  items.forEach(item => item.classList.remove('bg-blue-100'));
  if (items[index]) {
    items[index].classList.add('bg-blue-100');
    items[index].scrollIntoView({ block: 'nearest' });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('terms-search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    const val = input.value.trim();
    loadTermSearchResults(val.length >= 1 ? val : '');
  });

  input.addEventListener('keydown', (e) => {
    const items = document.querySelectorAll('.term-result');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedTermIndex < items.length - 1) {
        selectedTermIndex++;
        highlightTermItem(selectedTermIndex);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedTermIndex > 0) {
        selectedTermIndex--;
        highlightTermItem(selectedTermIndex);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedTermIndex >= 0) {
        items[selectedTermIndex].click();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearchModal('terms');
    }
  });
});