let activeTab = 'create';
let searchPage = 1;
let currentEditId = null;

function showTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');
  activeTab = tabId;
}

function showPopup(message, type = 'success') {
  const popup = document.getElementById('popup-message');
  popup.textContent = message;
  popup.className = 'popup';
  if (type === 'error') popup.classList.add('error');
  if (type === 'warning') popup.classList.add('warning');
  popup.classList.remove('hidden');
  setTimeout(() => popup.classList.add('hidden'), 3000);
}

function showConfirmPopup(callback, message = "Are you sure you want to continue?") {
  const popup = document.getElementById('confirm-popup');
  const msgEl = document.getElementById('confirm-message');
  msgEl.textContent = message;

  popup.classList.remove('hidden');
  document.getElementById('cancel-delete').onclick = () => popup.classList.add('hidden');
  document.getElementById('confirm-delete').onclick = () => {
    popup.classList.add('hidden');
    callback();
  };
}



// ✅ CREATE
document.getElementById('create-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const unit = document.getElementById('create-unit').value.trim();
  if (!unit) return;

  const resCheck = await fetch(`/api/units/check?name=${encodeURIComponent(unit)}`);
  const dataCheck = await resCheck.json();
  if (dataCheck.exists) return showPopup('⚠️ Unit already exists!', 'warning');

  const res = await fetch('/api/units', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unit })
  });

  if (res.status === 409) {
    showPopup('⚠️ Unit already exists!', 'warning');
  } else if (res.ok) {
    showPopup('✅ Unit saved!');
    document.getElementById('create-form').reset();
    loadSearchResults(true);
  } else {
    showPopup('❌ Error saving unit', 'error');
  }
});

// ✅ SEARCH
async function loadSearchResults(clear = false) {
  const query = document.getElementById('search-query').value.trim();
  const res = await fetch(`/api/units/search?q=${encodeURIComponent(query)}&page=${searchPage}`);
  const data = await res.json();

  const container = document.getElementById('search-results');
  if (clear) container.innerHTML = '';

  data.results.forEach(unit => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <span>${unit.unit}</span>
      <div class="action-btns">
        <button class="btn-warning" onclick="loadUnitToEdit(${unit.id})">Edit</button>
        <button class="btn-danger" onclick="confirmDelete(${unit.id})">Delete</button>
      </div>
    `;
    container.appendChild(div);
  });

  document.getElementById('load-more').style.display = data.hasMore ? 'block' : 'none';
}

document.getElementById('search-query').addEventListener('input', () => {
  searchPage = 1;
  loadSearchResults(true);
});
document.getElementById('load-more').addEventListener('click', () => {
  searchPage++;
  loadSearchResults(false);
});

// ✅ LOAD INTO EDIT
async function loadUnitToEdit(id) {
  const res = await fetch(`/api/units/${id}`);
  if (!res.ok) return showPopup('❌ Unit not found', 'error');

  const data = await res.json();
  currentEditId = id;

  document.getElementById('edit-id').value = id;
  document.getElementById('edit-unit').value = data.unit;
  document.getElementById('edit-form').classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));
  document.getElementById('edit').classList.add('active');
  document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
}

// ✅ UPDATE
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const unit = document.getElementById('edit-unit').value.trim();
  const id = document.getElementById('edit-id').value;

  const res = await fetch(`/api/units/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unit })
  });

  if (res.ok) {
    showPopup('✅ Unit updated!');
    loadSearchResults(true);
  } else {
    showPopup('❌ Error updating unit', 'error');
  }
});

// ✅ DELETE
document.getElementById('delete-unit').addEventListener('click', () => {
  const id = document.getElementById('edit-id').value;
  if (id) confirmDelete(id);
});

function confirmDelete(id) {
  currentEditId = id;
  showConfirmPopup(async () => {
    const res = await fetch(`/api/units/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showPopup('✅ Unit deleted!');
      document.getElementById('edit-id').value = '';
      document.getElementById('edit-unit').value = '';
      currentEditId = null;
      loadSearchResults(true);
    } else {
      showPopup('❌ Error deleting unit', 'error');
    }
  }, "Are you sure you want to delete this unit?");
}


// ✅ EXIT CONFIRM
function confirmExit(targetUrl) {
  const hasUnsaved =
    document.getElementById('create-unit')?.value.trim() !== '' ||
    document.getElementById('edit-unit')?.value.trim() !== '';

  if (hasUnsaved) {
    showConfirmPopup(() => {
      window.location.href = targetUrl;
    });
  } else {
    window.location.href = targetUrl;
  }
}


window.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('unsaved-popup');
  console.log("👀 Page Load – Is unsaved-popup hidden?", popup.classList.contains('hidden'));
  popup.classList.add('hidden');  // Force hide just in case
});



// Load initial results
loadSearchResults(true);

