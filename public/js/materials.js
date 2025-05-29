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
  const name = document.getElementById('create-material-name').value.trim();
  if (!name) return;

  const resCheck = await fetch(`/api/materials/check?name=${encodeURIComponent(name)}`);
  const dataCheck = await resCheck.json();
  if (dataCheck.exists) return showPopup('⚠️ Material already exists!', 'warning');

  const res = await fetch('/api/materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ material_name: name })
  });

  if (res.status === 409) {
    showPopup('⚠️ Material already exists!', 'warning');
  } else if (res.ok) {
    showPopup('✅ Material saved!');
    document.getElementById('create-form').reset();
    loadSearchResults(true);
  } else {
    showPopup('❌ Error saving material', 'error');
  }
});

// ✅ SEARCH
async function loadSearchResults(clear = false) {
  const query = document.getElementById('search-query').value.trim();
  const res = await fetch(`/api/materials/search?q=${encodeURIComponent(query)}&page=${searchPage}`);
  const data = await res.json();

  const container = document.getElementById('search-results');
  if (clear) container.innerHTML = '';

  data.results.forEach(material => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <span>${material.material_name}</span>
      <div class="action-btns">
        <button class="btn-warning" onclick="loadMaterialToEdit(${material.id})">Edit</button>
        <button class="btn-danger" onclick="confirmDelete(${material.id})">Delete</button>
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
async function loadMaterialToEdit(id) {
  const res = await fetch(`/api/materials/${id}`);
  if (!res.ok) return showPopup('❌ Material not found', 'error');

  const data = await res.json();
  currentEditId = id;

  document.getElementById('edit-id').value = id;
  document.getElementById('edit-material-name').value = data.material_name;
  document.getElementById('edit-form').classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));
  document.getElementById('edit').classList.add('active');
  document.querySelector('.tab-btn:nth-child(3)').classList.add('active');
}

// ✅ UPDATE
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('edit-material-name').value.trim();
  const id = document.getElementById('edit-id').value;

  const res = await fetch(`/api/materials/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ material_name: name })
  });

  if (res.ok) {
    showPopup('✅ Material updated!');
    loadSearchResults(true);
  } else {
    showPopup('❌ Error updating material', 'error');
  }
});

// ✅ DELETE
document.getElementById('delete-material').addEventListener('click', () => {
  const id = document.getElementById('edit-id').value;
  if (id) confirmDelete(id);
});

function confirmDelete(id) {
  currentEditId = id;
  showConfirmPopup(async () => {
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showPopup('✅ Material deleted!');
      document.getElementById('edit-id').value = '';
      document.getElementById('edit-material-name').value = '';
      currentEditId = null;
      loadSearchResults(true);
    } else {
      showPopup('❌ Error deleting material', 'error');
    }
  }, "Are you sure you want to delete this material?");
}

// ✅ EXIT CONFIRM
function confirmExit(targetUrl) {
  const hasUnsaved =
    document.getElementById('create-material-name').value ||
    document.getElementById('edit-material-name').value;

  if (hasUnsaved) {
    showConfirmPopup(() => {
      window.location.href = targetUrl;
    });
  } else {
    window.location.href = targetUrl;
  }
}

// Load initial results
loadSearchResults(true);
