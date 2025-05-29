// 🔥 FIXED quotation-form-terms.js with Server Data Loading
let termsList = [];
let autoTermsSL = true;
let termDebounceTimers = {};

function initializeTermsSection() {
  console.log('🚀 Initializing terms section...');
  
  // ✅ TRY TO LOAD EXISTING TERMS FROM SERVER DATA
  if (window.serverTerms && Array.isArray(window.serverTerms)) {
    console.log('📦 Loading terms from server data:', window.serverTerms);
    termsList = window.serverTerms.filter(item => item && item.trim()); // Remove empty items
  } else {
    // ✅ FALLBACK: CHECK HIDDEN INPUT
    const termsJson = document.getElementById('terms-json');
    if (termsJson && termsJson.value) {
      try {
        console.log('📦 Loading terms from hidden input:', termsJson.value);
        const parsedTerms = JSON.parse(termsJson.value);
        if (Array.isArray(parsedTerms)) {
          termsList = parsedTerms.filter(item => item && item.trim());
        }
      } catch (e) {
        console.error('❌ Invalid terms JSON:', e);
        termsList = [];
      }
    }
  }

  console.log('✅ Final termsList:', termsList);

  const autoCheckbox = document.getElementById('toggle-terms-sl');
  if (autoCheckbox) {
    autoCheckbox.checked = true;
    autoTermsSL = true;
    
    autoCheckbox.addEventListener('change', () => {
      autoTermsSL = autoCheckbox.checked;
      renderTermsRows();
    });
  }

  renderTermsRows();
  
  // ✅ ONLY ADD EMPTY ROW IF NO EXISTING TERMS
  if (termsList.length === 0) {
    addTermsRow();
  }
}

function flushAllTermsTextareas() {
  document.querySelectorAll('#terms-body tr').forEach((row, index) => {
    const textarea = row.querySelector('textarea');
    if (textarea && termsList[index] !== undefined) {
      termsList[index] = textarea.value;
    }
  });
}

function addTermsRow(text = '') {
  flushAllTermsTextareas();
  termsList.push(text);
  renderTermsRows();
  markFormAsChanged();
}

function removeTermsRow(index) {
  flushAllTermsTextareas();
  termsList.splice(index, 1);
  renderTermsRows();
  markFormAsChanged();
}

function updateTermsRow(index, value) {
  termsList[index] = value;
  document.getElementById('terms-json').value = JSON.stringify(termsList);
  markFormAsChanged();

  setTimeout(() => {
    const row = document.querySelectorAll('#terms-body tr')[index];
    const textarea = row?.querySelector('textarea.auto-grow');
    if (textarea && typeof triggerAutoGrowAfterUpdate === 'function') {
      triggerAutoGrowAfterUpdate(textarea);
    }
  }, 10);
}

function debouncedTermsUpdate(index, value) {
  clearTimeout(termDebounceTimers[index]);
  termDebounceTimers[index] = setTimeout(() => {
    updateTermsRow(index, value);
  }, 300);
}

function renderTermsRows() {
  const tbody = document.getElementById('terms-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  termsList.forEach((text, index) => {
    const row = document.createElement('tr');
    const sl = autoTermsSL ? index + 1 : '';

    row.innerHTML = `
      <td class="border p-2 text-center sl-col">${sl}</td>
      <td class="border p-2 terms-col">
        <div class="flex gap-2 items-start">
          <textarea class="w-full border-none outline-none resize-none overflow-hidden auto-grow"
            rows="1"
            style="word-wrap: break-word; white-space: pre-wrap;"
            oninput="debouncedTermsUpdate(${index}, this.value)">${text || ''}</textarea>
          <button type="button" onclick="openTermSearch(${index})" class="text-gray-500 hover:text-black mt-1">🔍</button>
        </div>
      </td>
      <td class="border p-2 text-center">
        <button type="button" onclick="removeTermsRow(${index})">❌</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  setTimeout(() => {
    document.querySelectorAll('#terms-body textarea.auto-grow').forEach(textarea => {
      if (typeof autoGrow === 'function') {
        autoGrow(textarea);
      }
    });
  }, 10);

  document.getElementById('terms-json').value = JSON.stringify(termsList);
}

// ✅ GLOBAL FUNCTION FOR CHANGE DETECTION
function markFormAsChanged() {
  if (typeof window.markFormAsChanged === 'function') {
    window.markFormAsChanged();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-terms-btn')?.addEventListener('click', () => addTermsRow());
  initializeTermsSection();
});