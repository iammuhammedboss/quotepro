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
  const scope = document.getElementById('create-scope').value.trim();
  if (!scope) return;

  const resCheck = await fetch(`/api/scope/check?name=${encodeURIComponent(scope)}`);
  const dataCheck = await resCheck.json();
  if (dataCheck.exists) return showPopup('⚠️ Scope already exists!', 'warning');

  const res = await fetch('/api/scope', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope })
  });

  if (res.status === 409) {
    showPopup('⚠️ Scope already exists!', 'warning');
  } else if (res.ok) {
    showPopup('✅ Scope saved!');
    document.getElementById('create-form').reset();
    loadSearchResults(true);
  } else {
    showPopup('❌ Error saving scope', 'error');
  }
});

// ✅ SEARCH
async function loadSearchResults(clear = false) {
  const query = document.getElementById('search-query').value.trim();
  const res = await fetch(`/api/scope/search?q=${encodeURIComponent(query)}&page=${searchPage}`);
  const data = await res.json();

  const container = document.getElementById('search-results');
  if (clear) container.innerHTML = '';

  data.results.forEach(scope => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <span>${scope.scope}</span>
      <div class="action-btns">
        <button class="btn-warning" onclick="loadScopeToEdit(${scope.id})">Edit</button>
        <button class="btn-danger" onclick="confirmDelete(${scope.id})">Delete</button>
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
async function loadScopeToEdit(id) {
  const res = await fetch(`/api/scope/${id}`);
  if (!res.ok) return showPopup('❌ Scope not found', 'error');

  const data = await res.json();
  currentEditId = id;

  document.getElementById('edit-id').value = id;
  document.getElementById('edit-scope').value = data.scope;
  document.getElementById('edit-form').classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));
  document.getElementById('edit').classList.add('active');
  document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
}

// ✅ UPDATE
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const scope = document.getElementById('edit-scope').value.trim();
  const id = document.getElementById('edit-id').value;

  const res = await fetch(`/api/scope/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope })
  });

  if (res.ok) {
    showPopup('✅ Scope updated!');
    loadSearchResults(true);
  } else {
    showPopup('❌ Error updating scope', 'error');
  }
});

// ✅ DELETE
document.getElementById('delete-scope').addEventListener('click', () => {
  const id = document.getElementById('edit-id').value;
  if (id) confirmDelete(id);
});

function confirmDelete(id) {
  currentEditId = id;
  showConfirmPopup(async () => {
    const res = await fetch(`/api/scope/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showPopup('✅ Scope deleted!');
      document.getElementById('edit-id').value = '';
      document.getElementById('edit-scope').value = '';
      currentEditId = null;
      loadSearchResults(true);
    } else {
      showPopup('❌ Error deleting scope', 'error');
    }
  }, "Are you sure you want to delete this scope?");
}


// ✅ EXIT CONFIRM
function confirmExit(targetUrl) {
  const hasUnsaved =
    document.getElementById('create-scope').value ||
    document.getElementById('edit-scope').value;

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
