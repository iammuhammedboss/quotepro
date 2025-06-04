// quotation-export.js - Handle export interface interactions
document.addEventListener('DOMContentLoaded', function() {
    // Get all necessary elements
    const steps = document.querySelectorAll('.step');
    const formatOptions = document.querySelectorAll('.format-option');
    const letterheadOptions = document.querySelectorAll('.letterhead-option');
    const optionCards = document.querySelectorAll('.option-card');
    const previewButton = document.getElementById('previewButton');
    const exportButton = document.getElementById('exportButton');
    const previewFrame = document.getElementById('previewFrame');
    const exportForm = document.getElementById('exportForm');

    // Initialize tooltips if using Bootstrap
    if (typeof bootstrap !== 'undefined') {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
    }

    // Handle step navigation
    function activateStep(stepNumber) {
        steps.forEach((step, index) => {
            if (index < stepNumber) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    // Handle option selection
    function handleOptionSelection(options, clickedOption) {
        options.forEach(option => option.classList.remove('selected'));
        clickedOption.classList.add('selected');
    }

    // Format option selection
    formatOptions.forEach(option => {
        option.addEventListener('click', function() {
            handleOptionSelection(formatOptions, this);
            document.getElementById('selectedFormat').value = this.dataset.format;
            updatePreview();
        });
    });

    // Letterhead option selection
    letterheadOptions.forEach(option => {
        option.addEventListener('click', function() {
            handleOptionSelection(letterheadOptions, this);
            document.getElementById('selectedLetterhead').value = this.dataset.letterhead;
            updatePreview();
        });
    });

    // Option card selection
    optionCards.forEach(card => {
        card.addEventListener('click', function() {
            const group = this.closest('.option-group');
            if (group) {
                const cards = group.querySelectorAll('.option-card');
                handleOptionSelection(cards, this);
                const inputId = this.dataset.target;
                if (inputId) {
                    document.getElementById(inputId).value = this.dataset.value;
                }
            }
            updatePreview();
        });
    });

    // Handle preview generation
    async function updatePreview() {
        if (!previewFrame || !exportForm) return;

        try {
            const formData = new FormData(exportForm);
            const quotationId = document.getElementById('quotationId').value;
            
            // Show loading state
            previewFrame.style.opacity = '0.5';
            previewFrame.contentWindow.document.body.innerHTML = '<div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-3x"></i><p class="mt-3">Generating preview...</p></div>';

            const response = await fetch(`/quotations/export/${quotationId}/preview`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Preview generation failed');

            const html = await response.text();
            previewFrame.contentWindow.document.open();
            previewFrame.contentWindow.document.write(html);
            previewFrame.contentWindow.document.close();
            previewFrame.style.opacity = '1';

        } catch (error) {
            console.error('Preview generation error:', error);
            previewFrame.contentWindow.document.body.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-triangle"></i>
                    Preview generation failed. Please try again.
                </div>
            `;
        }
    }

    // Handle export
    async function handleExport(event) {
        event.preventDefault();
        
        const formData = new FormData(exportForm);
        const format = document.getElementById('selectedFormat').value;
        const quotationId = document.getElementById('quotationId').value;

        if (!format || !quotationId) {
            alert('Please select an export format');
            return;
        }

        try {
            // Show loading state
            exportButton.disabled = true;
            exportButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

            const response = await fetch(`/quotations/export/${quotationId}/${format}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Export failed');

            // For non-blob responses (like WhatsApp)
            if (format === 'whatsapp') {
                const result = await response.json();
                if (result.whatsappUrl) {
                    window.open(result.whatsappUrl, '_blank');
                }
                return;
            }

            // For blob responses (PDF, Excel, PNG, etc.)
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quotation-${quotationId}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed. Please try again.');
        } finally {
            exportButton.disabled = false;
            exportButton.innerHTML = '<i class="fas fa-download"></i> Export';
        }
    }

    // Event listeners
    if (previewButton) {
        previewButton.addEventListener('click', updatePreview);
    }

    if (exportButton && exportForm) {
        exportForm.addEventListener('submit', handleExport);
    }

    // Initialize first preview
    updatePreview();
}); 