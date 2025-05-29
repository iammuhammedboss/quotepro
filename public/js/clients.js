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
  const name = document.getElementById('create-name').value.trim();
  const phone = document.getElementById('create-phone').value.trim();
  if (!name || !phone) return;

  const resCheck = await fetch(`/api/clients/check?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`);
  const dataCheck = await resCheck.json();
  if (dataCheck.exists) return showPopup('⚠️ Client already exists!', 'warning');

  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone })
  });

  if (res.status === 409) {
    showPopup('⚠️ Client already exists!', 'warning');
  } else if (res.ok) {
    showPopup('✅ Client saved!');
    document.getElementById('create-form').reset();
    loadSearchResults(true);
  } else {
    showPopup('❌ Error saving client', 'error');
  }
});

// ✅ SEARCH
async function loadSearchResults(clear = false) {
  const query = document.getElementById('search-query').value.trim();
  const res = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}&page=${searchPage}`);
  const data = await res.json();

  const container = document.getElementById('search-results');
  if (clear) container.innerHTML = '';

  data.results.forEach(client => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <span>${client.name} - ${client.phone}</span>
      <div class="action-btns">
        <button class="btn-warning" onclick="loadClientToEdit(${client.id})">Edit</button>
        <button class="btn-danger" onclick="confirmDelete(${client.id})">Delete</button>
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
async function loadClientToEdit(id) {
  const res = await fetch(`/api/clients/${id}`);
  if (!res.ok) return showPopup('❌ Client not found', 'error');

  const data = await res.json();
  currentEditId = id;

  document.getElementById('edit-id').value = id;
  document.getElementById('edit-name').value = data.name;
  document.getElementById('edit-phone').value = data.phone;
  document.getElementById('edit-form').classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));
  document.getElementById('edit').classList.add('active');
  document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
}

// ✅ UPDATE
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('edit-name').value.trim();
  const phone = document.getElementById('edit-phone').value.trim();
  const id = document.getElementById('edit-id').value;

  const res = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone })
  });

  if (res.ok) {
    showPopup('✅ Client updated!');
    loadSearchResults(true);
  } else {
    showPopup('❌ Error updating client', 'error');
  }
});

// ✅ DELETE
document.getElementById('delete-client').addEventListener('click', () => {
  const id = document.getElementById('edit-id').value;
  if (id) confirmDelete(id);
});

function confirmDelete(id) {
  currentEditId = id;
  showConfirmPopup(async () => {
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showPopup('✅ Client deleted!');
      document.getElementById('edit-id').value = '';
      document.getElementById('edit-name').value = '';
      document.getElementById('edit-phone').value = '';
      currentEditId = null;
      loadSearchResults(true);
    } else {
      showPopup('❌ Error deleting client', 'error');
    }
  }, "Are you sure you want to delete this client?");
}


// ✅ EXIT CONFIRM
function confirmExit(targetUrl) {
  const hasUnsaved =
    document.getElementById('create-name').value ||
    document.getElementById('create-phone').value ||
    document.getElementById('edit-name').value ||
    document.getElementById('edit-phone').value;

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
