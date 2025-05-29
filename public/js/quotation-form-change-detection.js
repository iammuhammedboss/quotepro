// 🔥 NEW FILE: quotation-form-change-detection.js - UNSAVED CHANGES DETECTION
let formHasChanges = false;
let originalFormData = {};
let pendingNavigation = null;

function initializeChangeDetection() {
  console.log('🚀 Initializing change detection...');
  
  // Capture original form state
  captureOriginalFormState();
  
  // Add event listeners for form changes
  addFormChangeListeners();
  
  // Add navigation protection
  addNavigationProtection();
}

function captureOriginalFormState() {
  const form = document.getElementById('quotation-form');
  if (!form) return;
  
  const formData = new FormData(form);
  originalFormData = Object.fromEntries(formData.entries());
  
  // Also capture dynamic data
  originalFormData.items = document.getElementById('items-json')?.value || '[]';
  originalFormData.scope = document.getElementById('scope-json')?.value || '[]';
  originalFormData.materials = document.getElementById('materials-json')?.value || '[]';
  originalFormData.terms = document.getElementById('terms-json')?.value || '[]';
  
  console.log('📸 Captured original form state');
}

function addFormChangeListeners() {
  const form = document.getElementById('quotation-form');
  if (!form) return;
  
  // Listen to all form inputs
  form.addEventListener('input', markFormAsChanged);
  form.addEventListener('change', markFormAsChanged);
  
  // Make markFormAsChanged available globally
  window.markFormAsChanged = markFormAsChanged;
}

function markFormAsChanged() {
  if (!formHasChanges) {
    formHasChanges = true;
    console.log('🔄 Form marked as changed');
    
    // Visual indicator
    const form = document.getElementById('quotation-form');
    if (form) {
      form.classList.add('form-changed');
    }
  }
}

function addNavigationProtection() {
  // Prevent closing tab/window
  window.addEventListener('beforeunload', (e) => {
    if (formHasChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  });
  
  // Intercept Dashboard link
  const dashboardLink = document.querySelector('a[href="/dashboard"]');
  if (dashboardLink) {
    dashboardLink.addEventListener('click', (e) => {
      if (formHasChanges) {
        e.preventDefault();
        showUnsavedChangesWarning('/dashboard');
      }
    });
  }
  
  // Intercept browser back button
  window.addEventListener('popstate', (e) => {
    if (formHasChanges) {
      e.preventDefault();
      showUnsavedChangesWarning(document.referrer || '/dashboard');
    }
  });
}

function showUnsavedChangesWarning(targetUrl) {
  pendingNavigation = targetUrl;
  const popup = document.getElementById('unsaved-changes-popup');
  if (popup) {
    popup.classList.remove('hidden');
  }
}

function closeUnsavedChangesWarning() {
  const popup = document.getElementById('unsaved-changes-popup');
  if (popup) {
    popup.classList.add('hidden');
  }
  pendingNavigation = null;
}

function proceedWithNavigation() {
  formHasChanges = false; // Disable further warnings
  closeUnsavedChangesWarning();
  
  if (pendingNavigation) {
    window.location.href = pendingNavigation;
  }
}

// Delete confirmation functions
function showDeleteConfirmation() {
  const popup = document.getElementById('delete-quotation-popup');
  if (popup) {
    popup.classList.remove('hidden');
  }
}

function closeDeleteConfirmation() {
  const popup = document.getElementById('delete-quotation-popup');
  if (popup) {
    popup.classList.add('hidden');
  }
}

function confirmDeleteQuotation() {
  const currentUrl = window.location.pathname;
  const quotationId = currentUrl.split('/').pop();
  
  if (!quotationId) {
    alert('Error: Could not determine quotation ID');
    return;
  }
  
  fetch(`/quotations/${quotationId}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        formHasChanges = false; // Disable navigation warnings
        window.location.href = '/quotations/search';
      } else {
        alert('Error deleting quotation: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Delete error:', err);
      alert('Error deleting quotation');
    });
}

// Form submission success handler
function onFormSubmitSuccess() {
  formHasChanges = false; // Mark as saved
  const form = document.getElementById('quotation-form');
  if (form) {
    form.classList.remove('form-changed');
  }
}

// Event listeners for popup buttons
window.addEventListener('DOMContentLoaded', () => {
  // Unsaved changes popup buttons
  document.getElementById('stay-on-page')?.addEventListener('click', closeUnsavedChangesWarning);
  document.getElementById('leave-page')?.addEventListener('click', proceedWithNavigation);
  
  // Initialize change detection
  setTimeout(initializeChangeDetection, 1000); // Delay to ensure other scripts load first
});