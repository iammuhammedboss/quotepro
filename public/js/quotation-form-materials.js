// 🔥 FIXED quotation-form-materials.js with Server Data Loading
let materialsList = [];
let autoMaterialsSL = true;
let materialDebounceTimers = {};

function initializeMaterialsSection() {
  console.log('🚀 Initializing materials section...');
  
  // ✅ TRY TO LOAD EXISTING MATERIALS FROM SERVER DATA
  if (window.serverMaterials && Array.isArray(window.serverMaterials)) {
    console.log('📦 Loading materials from server data:', window.serverMaterials);
    materialsList = window.serverMaterials.filter(item => item && item.trim()); // Remove empty items
  } else {
    // ✅ FALLBACK: CHECK HIDDEN INPUT
    const materialsJson = document.getElementById('materials-json');
    if (materialsJson && materialsJson.value) {
      try {
        console.log('📦 Loading materials from hidden input:', materialsJson.value);
        const parsedMaterials = JSON.parse(materialsJson.value);
        if (Array.isArray(parsedMaterials)) {
          materialsList = parsedMaterials.filter(item => item && item.trim());
        }
      } catch (e) {
        console.error('❌ Invalid materials JSON:', e);
        materialsList = [];
      }
    }
  }

  console.log('✅ Final materialsList:', materialsList);

  const autoCheckbox = document.getElementById('toggle-materials-sl');
  if (autoCheckbox) {
    autoCheckbox.checked = true;
    autoMaterialsSL = true;
    
    autoCheckbox.addEventListener('change', () => {
      autoMaterialsSL = autoCheckbox.checked;
      renderMaterialsRows();
    });
  }

  renderMaterialsRows();
  
  // ✅ ONLY ADD EMPTY ROW IF NO EXISTING MATERIALS
  if (materialsList.length === 0) {
    addMaterialsRow();
  }
}

function flushAllMaterialsTextareas() {
  document.querySelectorAll('#materials-body tr').forEach((row, index) => {
    const textarea = row.querySelector('textarea');
    if (textarea && materialsList[index] !== undefined) {
      materialsList[index] = textarea.value;
    }
  });
}

function addMaterialsRow(text = '') {
  flushAllMaterialsTextareas();
  materialsList.push(text);
  renderMaterialsRows();
  markFormAsChanged();
}

function removeMaterialsRow(index) {
  flushAllMaterialsTextareas();
  materialsList.splice(index, 1);
  renderMaterialsRows();
  markFormAsChanged();
}

function updateMaterialsRow(index, value) {
  materialsList[index] = value;
  document.getElementById('materials-json').value = JSON.stringify(materialsList);
  markFormAsChanged();

  setTimeout(() => {
    const row = document.querySelectorAll('#materials-body tr')[index];
    const textarea = row?.querySelector('textarea.auto-grow');
    if (textarea && typeof triggerAutoGrowAfterUpdate === 'function') {
      triggerAutoGrowAfterUpdate(textarea);
    }
  }, 10);
}

function debouncedMaterialsUpdate(index, value) {
  clearTimeout(materialDebounceTimers[index]);
  materialDebounceTimers[index] = setTimeout(() => {
    updateMaterialsRow(index, value);
  }, 300);
}

function renderMaterialsRows() {
  const tbody = document.getElementById('materials-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  materialsList.forEach((text, index) => {
    const sl = autoMaterialsSL ? index + 1 : '';
    const row = document.createElement('tr');

    row.innerHTML = `
      <td class="border p-2 text-center sl-col">${sl}</td>
      <td class="border p-2 materials-col">
        <div class="flex gap-2 items-start">
          <textarea class="w-full border-none outline-none resize-none overflow-hidden auto-grow"
            rows="1"
            style="word-wrap: break-word; white-space: pre-wrap;"
            oninput="debouncedMaterialsUpdate(${index}, this.value)">${text || ''}</textarea>
          <button type="button" onclick="openMaterialSearch(${index})" class="text-gray-500 hover:text-black mt-1">🔍</button>
        </div>
      </td>
      <td class="border p-2 text-center">
        <button type="button" onclick="removeMaterialsRow(${index})">❌</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  setTimeout(() => {
    document.querySelectorAll('#materials-body textarea.auto-grow').forEach(textarea => {
      if (typeof autoGrow === 'function') {
        autoGrow(textarea);
      }
    });
  }, 10);

  document.getElementById('materials-json').value = JSON.stringify(materialsList);
}

// ✅ GLOBAL FUNCTION FOR CHANGE DETECTION
function markFormAsChanged() {
  if (typeof window.markFormAsChanged === 'function') {
    window.markFormAsChanged();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-materials-btn')?.addEventListener('click', () => addMaterialsRow());
  initializeMaterialsSection();
});