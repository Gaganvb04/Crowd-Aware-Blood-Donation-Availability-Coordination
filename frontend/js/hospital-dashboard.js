// Hospital Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Emergency Request Button
    const emergencyRequestBtn = document.getElementById('emergencyRequestBtn');
    const emergencyModal = document.getElementById('emergencyModal');
    
    if (emergencyRequestBtn) {
        emergencyRequestBtn.addEventListener('click', function() {
            if (emergencyModal) {
                emergencyModal.style.display = 'flex';
            }
        });
    }
    
    // Emergency Form Submission
    const emergencyForm = document.getElementById('emergencyForm');
    if (emergencyForm) {
        emergencyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            console.log('Emergency request data:', data);
            
            showMessage('Emergency request submitted! Blood bank notified.', 'success');
            
            // Close modal
            if (emergencyModal) {
                emergencyModal.style.display = 'none';
            }
            this.reset();
            
            // Refresh requests section
            setTimeout(() => {
                const requestsNav = document.querySelector('[data-section="requests"]');
                if (requestsNav) {
                    requestsNav.click();
                }
            }, 1500);
        });
    }
    
    // Quick Stock Check
    const checkStockBtn = document.getElementById('checkStockBtn');
    const quickBloodGroup = document.getElementById('quickBloodGroup');
    const stockResults = document.getElementById('stockResults');
    
    if (checkStockBtn) {
        checkStockBtn.addEventListener('click', function() {
            const bloodGroup = quickBloodGroup.value;
            
            if (!bloodGroup) {
                showMessage('Please select a blood group', 'error');
                return;
            }
            
            // Show results (in real app, would fetch from backend)
            if (stockResults) {
                stockResults.style.display = 'block';
                
                // Simulate API call
                setTimeout(() => {
                    showMessage(`Showing ${bloodGroup} availability in nearby banks`, 'success');
                }, 500);
            }
        });
    }
    
    // Blood Request Form - Blood Group Selection
    const bloodGroupSelect = document.getElementById('bloodGroupSelect');
    const bankStockElements = document.querySelectorAll('[id^="bank"][id$="-stock"]');
    
    if (bloodGroupSelect) {
        bloodGroupSelect.addEventListener('change', function() {
            const selectedBloodGroup = this.value;
            
            if (selectedBloodGroup) {
                // Simulate fetching stock for each bank
                bankStockElements.forEach(element => {
                    // Mock data - in real app would come from backend
                    const mockStock = Math.floor(Math.random() * 300) + 1;
                    const stockStatus = mockStock > 100 ? 'good' : mockStock > 50 ? 'low' : 'critical';
                    
                    element.textContent = `${selectedBloodGroup}: ${mockStock} units available`;
                    element.classList.remove('stock-good', 'stock-low', 'stock-critical');
                    element.classList.add(`stock-${stockStatus}`);
                });
            }
        });
    }
    
    // Blood Request Form Submission
    const bloodRequestForm = document.getElementById('bloodRequestForm');
    if (bloodRequestForm) {
        bloodRequestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateFormData(this)) {
                showMessage('Please fill in all required fields', 'error');
                return;
            }
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            console.log('Blood request data:', data);
            
            showMessage('Blood request submitted successfully!', 'success');
            
            // Reset form
            this.reset();
            
            // Navigate to requests section
            setTimeout(() => {
                const requestsNav = document.querySelector('[data-section="requests"]');
                if (requestsNav) {
                    requestsNav.click();
                }
            }, 1500);
        });
    }
    
    // Save as Draft button
    const saveDraftButtons = document.querySelectorAll('button[type="button"]');
    saveDraftButtons.forEach(button => {
        if (button.textContent.includes('Save as Draft')) {
            button.addEventListener('click', function() {
                const form = this.closest('form');
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                
                console.log('Saving draft:', data);
                showMessage('Request saved as draft', 'success');
            });
        }
    });
    
    // Track Request buttons
    const trackButtons = document.querySelectorAll('.hospital-request-item .btn-secondary, .request-detailed-card .btn-secondary');
    trackButtons.forEach(button => {
        if (button.textContent.includes('Track')) {
            button.addEventListener('click', function() {
                showMessage('Request tracking feature - shows real-time status', 'success');
            });
        }
    });
    
    // Confirm Receipt buttons
    const confirmButtons = document.querySelectorAll('.hospital-request-item .btn-primary, .request-detailed-card .btn-primary');
    confirmButtons.forEach(button => {
        if (button.textContent.includes('Confirm Receipt')) {
            button.addEventListener('click', function() {
                const requestCard = this.closest('.hospital-request-item, .request-detailed-card');
                const requestId = requestCard.querySelector('h4, h3').textContent;
                
                if (confirm(`Confirm that you have received the blood units for ${requestId}?`)) {
                    showMessage('Receipt confirmed. Request marked as completed.', 'success');
                    
                    // Update status
                    const statusBadge = requestCard.querySelector('.status-badge, .priority-badge');
                    if (statusBadge) {
                        statusBadge.textContent = 'Completed';
                        statusBadge.classList.remove('pending', 'approved');
                        statusBadge.classList.add('completed');
                    }
                    
                    // Remove from active list after a delay
                    setTimeout(() => {
                        requestCard.style.display = 'none';
                    }, 2000);
                }
            });
        }
    });
    
    // Cancel Request buttons
    const cancelRequestButtons = document.querySelectorAll('.request-detailed-card .btn-danger');
    cancelRequestButtons.forEach(button => {
        if (button.textContent.includes('Cancel Request')) {
            button.addEventListener('click', function() {
                const requestCard = this.closest('.request-detailed-card');
                const requestId = requestCard.querySelector('h3').textContent;
                
                const reason = prompt('Reason for cancellation (optional):');
                if (reason !== null) {
                    showMessage(`Request ${requestId} cancelled`, 'success');
                    
                    setTimeout(() => {
                        requestCard.style.display = 'none';
                    }, 1500);
                }
            });
        }
    });
    
    // Contact Blood Bank buttons
    const contactBankButtons = document.querySelectorAll('.btn-secondary');
    contactBankButtons.forEach(button => {
        if (button.textContent.includes('Contact Blood Bank') || button.textContent.includes('Contact Bank')) {
            button.addEventListener('click', function() {
                showMessage('Opening communication with blood bank...', 'success');
            });
        }
    });
    
    // View QR Codes button
    const qrButtons = document.querySelectorAll('.btn-secondary');
    qrButtons.forEach(button => {
        if (button.textContent.includes('QR')) {
            button.addEventListener('click', function() {
                showMessage('Displaying QR codes for blood bags', 'success');
            });
        }
    });
    
    // Blood Bank Cards - View Stock
    const viewStockButtons = document.querySelectorAll('.blood-bank-mini-card .btn-secondary, .bank-card-footer .btn-primary');
    viewStockButtons.forEach(button => {
        if (button.textContent.includes('View Stock')) {
            button.addEventListener('click', function() {
                const bankCard = this.closest('.blood-bank-mini-card, .blood-bank-card');
                const bankName = bankCard.querySelector('h4, h3').textContent;
                
                // Navigate to stock availability and filter by this bank
                const stockNav = document.querySelector('[data-section="stock-availability"]');
                if (stockNav) {
                    stockNav.click();
                    showMessage(`Showing stock for ${bankName}`, 'success');
                }
            });
        }
    });
    
    // Create Request from Bank Card
    const createRequestButtons = document.querySelectorAll('.bank-stock-footer .btn-primary, .bank-card-footer .btn-secondary');
    createRequestButtons.forEach(button => {
        if (button.textContent.includes('Create Request')) {
            button.addEventListener('click', function() {
                const createNav = document.querySelector('[data-section="create-request"]');
                if (createNav) {
                    createNav.click();
                }
            });
        }
    });
    
    // Get Directions button
    const directionsButtons = document.querySelectorAll('.btn-secondary');
    directionsButtons.forEach(button => {
        if (button.textContent.includes('Directions')) {
            button.addEventListener('click', function() {
                showMessage('Opening maps for directions...', 'success');
            });
        }
    });
    
    // Export Report button
    const exportButtons = document.querySelectorAll('.filters-bar .btn-secondary');
    exportButtons.forEach(button => {
        if (button.textContent.includes('Export')) {
            button.addEventListener('click', function() {
                showMessage('Generating and downloading report...', 'success');
            });
        }
    });
    
    // Filter functionality
    const filterSelects = document.querySelectorAll('.filters-bar select, .stock-filters select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            console.log('Filter changed:', this.value);
            showMessage('Applying filters...', 'success');
        });
    });
    
    // Date filter functionality
    const dateInputs = document.querySelectorAll('.filters-bar input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener('change', function() {
            console.log('Date filter changed:', this.value);
            showMessage('Applying date filter...', 'success');
        });
    });
});