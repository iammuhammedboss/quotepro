// 🔥 ENHANCED quotation-autogrow.js - Universal Auto-Grow Solution

function autoGrow(textarea) {
  if (!textarea) return;

  // Store original styles
  const originalOverflow = textarea.style.overflow;
  const originalHeight = textarea.style.height;

  // Temporarily hide overflow and reset height
  textarea.style.overflow = 'hidden';
  textarea.style.height = 'auto';
  
  // Calculate required height
  const scrollHeight = textarea.scrollHeight;
  const minHeight = 24; // Minimum height (1 line)
  const maxHeight = 200; // Maximum height before scrolling
  
  // Set the appropriate height
  const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
  textarea.style.height = `${newHeight}px`;
  
  // Restore overflow if we hit max height
  if (scrollHeight > maxHeight) {
    textarea.style.overflow = 'auto';
  } else {
    textarea.style.overflow = 'hidden';
  }

  // Ensure proper text wrapping
  textarea.style.whiteSpace = 'pre-wrap';
  textarea.style.wordWrap = 'break-word';
  textarea.style.resize = 'none';

  // Sync row height for table alignment
  const row = textarea.closest('tr');
  if (row) {
    const cells = Array.from(row.children);
    cells.forEach(td => {
      td.style.verticalAlign = 'top';
      td.style.height = `${newHeight + 16}px`; // Add padding
    });
  }
}

// 🔥 Enhanced initialization that catches ALL textareas
function initializeAutoGrow() {
  console.log('🚀 Initializing Enhanced Auto-Grow System');
  
  // Find all existing textareas
  document.querySelectorAll('textarea.auto-grow').forEach(textarea => {
    autoGrow(textarea);
    
    // Add multiple event listeners for comprehensive coverage
    ['input', 'change', 'paste', 'keyup', 'focus'].forEach(event => {
      textarea.addEventListener(event, () => {
        // Use setTimeout to ensure DOM updates are complete
        setTimeout(() => autoGrow(textarea), 0);
      });
    });
  });
}

// 🔥 Observer to catch dynamically added textareas
function setupDynamicObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Check if the node itself is a textarea
          if (node.matches && node.matches('textarea.auto-grow')) {
            setupTextareaAutoGrow(node);
          }
          
          // Check for child textareas
          const textareas = node.querySelectorAll ? node.querySelectorAll('textarea.auto-grow') : [];
          textareas.forEach(setupTextareaAutoGrow);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function setupTextareaAutoGrow(textarea) {
  // Apply initial auto-grow
  setTimeout(() => autoGrow(textarea), 0);
  
  // Add event listeners
  ['input', 'change', 'paste', 'keyup', 'focus'].forEach(event => {
    textarea.addEventListener(event, () => {
      setTimeout(() => autoGrow(textarea), 0);
    });
  });
}

// 🔥 Force auto-grow on all textareas (for search selections)
function forceAutoGrowAll() {
  document.querySelectorAll('textarea.auto-grow').forEach(textarea => {
    setTimeout(() => autoGrow(textarea), 10);
  });
}

// 🔥 Trigger auto-grow after value changes (for programmatic updates)
function triggerAutoGrowAfterUpdate(element) {
  if (element && element.matches('textarea.auto-grow')) {
    setTimeout(() => autoGrow(element), 10);
  }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  initializeAutoGrow();
  setupDynamicObserver();
});

// Re-initialize on window resize
window.addEventListener('resize', () => {
  setTimeout(() => {
    document.querySelectorAll('textarea.auto-grow').forEach(autoGrow);
  }, 100);
});

// Global function for manual triggering
window.forceAutoGrowAll = forceAutoGrowAll;
window.triggerAutoGrowAfterUpdate = triggerAutoGrowAfterUpdate;
window.autoGrow = autoGrow;