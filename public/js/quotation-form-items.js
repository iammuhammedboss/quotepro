// 🔥 FIXED quotation-form-items.js with Backend Data Loading
let itemList = [];
let autoItemsSL = true;
let debounceTimers = {};

function initializeItemsSection() {
  console.log('🚀 Initializing items section...');
  
  // ✅ TRY TO LOAD EXISTING ITEMS FROM SERVER DATA
  const itemsJson = document.getElementById('items-json');
  
  // ✅ CHECK IF THERE'S SERVER DATA PASSED FROM BACKEND
  if (window.serverItems && Array.isArray(window.serverItems)) {
    console.log('📦 Loading items from server data:', window.serverItems);
    itemList = window.serverItems.map(item => ({
      description: item.description || '',
      qty: parseFloat(item.qty) || 0.000,
      unit: item.unit || '',
      rate: parseFloat(item.rate) || 0.000,
      amount: parseFloat(item.amount) || 0.000
    }));
  } 
  // ✅ FALLBACK: CHECK HIDDEN INPUT
  else if (itemsJson && itemsJson.value && itemsJson.value.trim()) {
    try {
      console.log('📦 Loading items from hidden input:', itemsJson.value);
      const parsedItems = JSON.parse(itemsJson.value);
      if (Array.isArray(parsedItems)) {
        itemList = parsedItems;
      }
    } catch (e) {
      console.error('❌ Invalid items JSON:', e);
      itemList = [];
    }
  }

  console.log('✅ Final itemList:', itemList);

  const autoCheckbox = document.getElementById('toggle-items-sl');
  if (autoCheckbox) {
    autoCheckbox.checked = true;
    autoItemsSL = true;
    
    autoCheckbox.addEventListener('change', () => {
      autoItemsSL = autoCheckbox.checked;
      renderItemsRows();
    });
  }

  renderItemsRows();
  
  // ✅ ONLY ADD EMPTY ROW IF NO EXISTING ITEMS
  if (itemList.length === 0) {
    addItemRow();
  }

  // ✅ TRIGGER SUMMARY CALCULATION
  if (typeof updateSummary === 'function') {
    updateSummary();
  }
}

function flushAllTextareaValues() {
  document.querySelectorAll('#items-body tr').forEach((row, index) => {
    const textarea = row.querySelector('textarea.auto-grow');
    if (textarea && itemList[index]) {
      itemList[index].description = textarea.value;
    }
  });
}

function addItemRow(item = {
  description: '',
  qty: 0.000,
  unit: '',
  rate: 0.000,
  amount: 0.000
}) {
  flushAllTextareaValues();
  itemList.push(item);
  renderItemsRows();
  markFormAsChanged();
  if (typeof updateSummary === 'function') {
    updateSummary();
  }
}

function removeItemRow(index) {
  flushAllTextareaValues();
  itemList.splice(index, 1);
  renderItemsRows();
  markFormAsChanged();
  if (typeof updateSummary === 'function') {
    updateSummary();
  }
}

function updateItemField(index, field, value) {
  if (!itemList[index]) {
    itemList[index] = {
      description: '',
      qty: 0.000,
      unit: '',
      rate: 0.000,
      amount: 0.000
    };
  }

  if (field === 'qty' || field === 'rate') {
    flushAllTextareaValues();

    value = parseFloat(value) || 0;
    itemList[index][field] = parseFloat(value.toFixed(3));

    const qty = itemList[index].qty || 0;
    const rate = itemList[index].rate || 0;
    itemList[index].amount = parseFloat((qty * rate).toFixed(3));

    renderItemsRows();
    markFormAsChanged();
    if (typeof updateSummary === 'function') {
      updateSummary();
    }
  } else {
    itemList[index][field] = value;
    document.getElementById('items-json').value = JSON.stringify(itemList);
    markFormAsChanged();
    
    if (field === 'description') {
      setTimeout(() => {
        const row = document.querySelectorAll('#items-body tr')[index];
        const textarea = row?.querySelector('textarea.auto-grow');
        if (textarea && typeof triggerAutoGrowAfterUpdate === 'function') {
          triggerAutoGrowAfterUpdate(textarea);
        }
      }, 10);
    }
  }
}

function debouncedUpdate(index, value) {
  clearTimeout(debounceTimers[index]);
  debounceTimers[index] = setTimeout(() => {
    updateItemField(index, 'description', value);
  }, 300);
}

function renderItemsRows() {
  const tbody = document.getElementById('items-body');
  if (!tbody) {
    console.error('❌ Items tbody not found!');
    return;
  }
  
  tbody.innerHTML = '';

  itemList.forEach((item, index) => {
    const sl = autoItemsSL ? index + 1 : '';
    const row = document.createElement('tr');
        row.innerHTML = `
      <td class="border p-2 text-center sl-col">${sl}</td>
      <td class="border p-2">
        <div class="flex gap-2 items-start">
          <textarea class="w-full border-none outline-none resize-none overflow-hidden auto-grow"
            rows="1"
            style="word-wrap: break-word; white-space: pre-wrap;"
            oninput="debouncedUpdate(${index}, this.value)">${item.description || ''}</textarea>
          <button type="button" onclick="openItemSearch(${index})" class="text-gray-500 hover:text-black mt-1">🔍</button>
        </div>
      </td>
      <td class="border p-2">
        <input type="number" class="w-full text-right border-none outline-none"
          value="${(item.qty || 0).toFixed(3)}"
          onchange="updateItemField(${index}, 'qty', this.value)" 
          onfocus="this.select()"/>
      </td>
      <td class="border p-2">
        <input type="text" class="w-full border-none outline-none"
          value="${item.unit || ''}"
          onchange="updateItemField(${index}, 'unit', this.value)"
          onfocus="showUnitSuggestions(this, ${index})" />
      </td>
      <td class="border p-2">
        <input type="number" class="w-full text-right border-none outline-none"
          value="${(item.rate || 0).toFixed(3)}"
          onchange="updateItemField(${index}, 'rate', this.value)" 
          onfocus="this.select()" />
      </td>
      <td class="border p-2 text-right">${(item.amount || 0).toFixed(3)}</td>
      <td class="border p-2 text-center">
        <button type="button" onclick="removeItemRow(${index})">❌</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  setTimeout(() => {
    document.querySelectorAll('#items-body textarea.auto-grow').forEach(textarea => {
      if (typeof autoGrow === 'function') {
        autoGrow(textarea);
      }
    });
  }, 10);

  document.getElementById('items-json').value = JSON.stringify(itemList);
}

// ✅ GLOBAL FUNCTION FOR CHANGE DETECTION
function markFormAsChanged() {
  if (typeof window.markFormAsChanged === 'function') {
    window.markFormAsChanged();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('add-item-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => addItemRow());
  }

  initializeItemsSection();
});