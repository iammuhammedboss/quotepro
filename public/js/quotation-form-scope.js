// 🔥 FIXED quotation-form-scope.js with Server Data Loading
let scopeList = [];
let autoScopeSL = true;
let scopeDebounceTimers = {};

function initializeScopeSection() {
  console.log('🚀 Initializing scope section...');
  
  // ✅ TRY TO LOAD EXISTING SCOPE FROM SERVER DATA
  if (window.serverScope && Array.isArray(window.serverScope)) {
    console.log('📦 Loading scope from server data:', window.serverScope);
    scopeList = window.serverScope.filter(item => item && item.trim()); // Remove empty items
  } else {
    // ✅ FALLBACK: CHECK HIDDEN INPUT
    const scopeJson = document.getElementById('scope-json');
    if (scopeJson && scopeJson.value) {
      try {
        console.log('📦 Loading scope from hidden input:', scopeJson.value);
        const parsedScope = JSON.parse(scopeJson.value);
        if (Array.isArray(parsedScope)) {
          scopeList = parsedScope.filter(item => item && item.trim());
        }
      } catch (e) {
        console.error('❌ Invalid scope JSON:', e);
        scopeList = [];
      }
    }
  }

  console.log('✅ Final scopeList:', scopeList);

  const autoCheckbox = document.getElementById('toggle-scope-sl');
  if (autoCheckbox) {
    autoCheckbox.checked = true;
    autoScopeSL = true;
    
    autoCheckbox.addEventListener('change', () => {
      autoScopeSL = autoCheckbox.checked;
      renderScopeRows();
    });
  }

  renderScopeRows();
  
  // ✅ ONLY ADD EMPTY ROW IF NO EXISTING SCOPE
  if (scopeList.length === 0) {
    addScopeRow();
  }
}

function flushAllScopeTextareas() {
  document.querySelectorAll('#scope-body tr').forEach((row, index) => {
    const textarea = row.querySelector('textarea');
    if (textarea && scopeList[index] !== undefined) {
      scopeList[index] = textarea.value;
    }
  });
}

function addScopeRow(text = '') {
  flushAllScopeTextareas();
  scopeList.push(text);
  renderScopeRows();
  markFormAsChanged();
}

function removeScopeRow(index) {
  flushAllScopeTextareas();
  scopeList.splice(index, 1);
  renderScopeRows();
  markFormAsChanged();
}

function updateScopeRow(index, value) {
  scopeList[index] = value;
  document.getElementById('scope-json').value = JSON.stringify(scopeList);
  markFormAsChanged();

  setTimeout(() => {
    const row = document.querySelectorAll('#scope-body tr')[index];
    const textarea = row?.querySelector('textarea.auto-grow');
    if (textarea && typeof triggerAutoGrowAfterUpdate === 'function') {
      triggerAutoGrowAfterUpdate(textarea);
    }
  }, 10);
}

function debouncedScopeUpdate(index, value) {
  clearTimeout(scopeDebounceTimers[index]);
  scopeDebounceTimers[index] = setTimeout(() => {
    updateScopeRow(index, value);
  }, 300);
}

function renderScopeRows() {
  const tbody = document.getElementById('scope-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  scopeList.forEach((text, index) => {
    const row = document.createElement('tr');
    const sl = autoScopeSL ? index + 1 : '';

    row.innerHTML = `
      <td class="border p-2 text-center sl-col">${sl}</td>
      <td class="border p-2 scope-col">
        <div class="flex gap-2 items-start">
          <textarea class="w-full border-none outline-none resize-none overflow-hidden auto-grow"
            rows="1"
            style="word-wrap: break-word; white-space: pre-wrap;"
            oninput="debouncedScopeUpdate(${index}, this.value)">${text || ''}</textarea>
          <button type="button" onclick="openScopeSearch(${index})" class="text-gray-500 hover:text-black mt-1">🔍</button>
        </div>
      </td>
      <td class="border p-2 text-center">
        <button type="button" onclick="removeScopeRow(${index})">❌</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  setTimeout(() => {
    document.querySelectorAll('#scope-body textarea.auto-grow').forEach(textarea => {
      if (typeof autoGrow === 'function') {
        autoGrow(textarea);
      }
    });
  }, 10);

  document.getElementById('scope-json').value = JSON.stringify(scopeList);
}

// ✅ GLOBAL FUNCTION FOR CHANGE DETECTION
function markFormAsChanged() {
  if (typeof window.markFormAsChanged === 'function') {
    window.markFormAsChanged();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-scope-btn')?.addEventListener('click', () => addScopeRow());
  initializeScopeSection();
});