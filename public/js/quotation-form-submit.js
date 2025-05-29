// public/js/quotation-form-submit.js - UPDATED WITH SUCCESS HANDLING
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quotation-form');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      
      // Show loading state
      submitButton.disabled = true;
      submitButton.textContent = 'Saving...';
      
      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const response = await fetch(form.action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          // ✅ Mark form as saved (disable unsaved changes warning)
          if (typeof onFormSubmitSuccess === 'function') {
            onFormSubmitSuccess();
          }
          
          // Check if there's a redirect URL (for freeze view)
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
          } else if (result.id) {
            // Fallback to freeze view if no specific redirect
            window.location.href = `/quotations/view/${result.id}`;
          } else {
            // Show success message and stay on page
            showMessage(result.message || 'Quotation saved successfully!', 'success');
          }
        } else {
          showMessage(result.error || 'Error saving quotation', 'error');
        }
        
      } catch (error) {
        console.error('Form submission error:', error);
        showMessage('Error saving quotation', 'error');
      } finally {
        // Restore button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }
});

// Show message function
function showMessage(message, type = 'success') {
  // Remove any existing messages
  const existingMessages = document.querySelectorAll('.form-message');
  existingMessages.forEach(msg => msg.remove());
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `form-message fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  messageDiv.textContent = message;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}