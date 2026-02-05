// Blood Bank Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Create Camp Modal
    const createCampBtn = document.getElementById('createCampBtn');
    const createCampForm = document.getElementById('createCampForm');
    
    if (createCampBtn) {
        createCampBtn.addEventListener('click', function() {
            if (createCampForm) {
                createCampForm.style.display = 'flex';
            }
        });
    }
    
    // Camp form submission
    if (createCampForm) {
        const campForm = createCampForm.querySelector('form');
        if (campForm) {
            campForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                console.log('New camp data:', data);
                
                showMessage('Donation camp created successfully!', 'success');
                
                // Close modal
                createCampForm.style.display = 'none';
                this.reset();
            });
        }
    }
    
    // Add Stock Button
    const addStockBtn = document.getElementById('addStockBtn');
    if (addStockBtn) {
        addStockBtn.addEventListener('click', function() {
            // This would open a modal or navigate to add stock page
            showMessage('Add Stock feature - Connect to backend', 'success');
        });
    }
    
    // Generate Report Button
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            showMessage('Generating inventory report...', 'success');
            // In real app, would generate and download PDF/Excel report
        });
    }
    
    // Hospital Request Approval
    const approveButtons = document.querySelectorAll('.request-card .btn-primary');
    approveButtons.forEach(button => {
        if (button.textContent.includes('Approve')) {
            button.addEventListener('click', function() {
                const requestCard = this.closest('.request-card');
                const requestId = requestCard.querySelector('.request-id').textContent;
                
                if (confirm(`Approve request ${requestId}?`)) {
                    showMessage(`Request ${requestId} approved successfully!`, 'success');
                    
                    // Update UI to show approved status
                    requestCard.classList.remove('emergency', 'high');
                    requestCard.classList.add('approved');
                    
                    const priorityBadge = requestCard.querySelector('.priority-badge');
                    if (priorityBadge) {
                        priorityBadge.textContent = 'Approved';
                        priorityBadge.classList.add('approved');
                    }
                }
            });
        }
    });
    
    // Contact Hospital buttons
    const contactButtons = document.querySelectorAll('.request-card .btn-secondary');
    contactButtons.forEach(button => {
        if (button.textContent.includes('Contact Hospital')) {
            button.addEventListener('click', function() {
                showMessage('Opening communication channel with hospital...', 'success');
                // In real app, would open chat or call interface
            });
        }
    });
    
    // Find from Network buttons
    const networkButtons = document.querySelectorAll('.btn-secondary');
    networkButtons.forEach(button => {
        if (button.textContent.includes('Find from Network')) {
            button.addEventListener('click', function() {
                showMessage('Searching blood bank network...', 'success');
                // In real app, would search connected blood banks
            });
        }
    });
    
    // Reject Request
    const rejectButtons = document.querySelectorAll('.request-card .btn-danger');
    rejectButtons.forEach(button => {
        if (button.textContent.includes('Reject')) {
            button.addEventListener('click', function() {
                const requestCard = this.closest('.request-card');
                const requestId = requestCard.querySelector('.request-id').textContent;
                
                const reason = prompt('Reason for rejection:');
                if (reason) {
                    showMessage(`Request ${requestId} rejected`, 'success');
                    requestCard.style.display = 'none';
                }
            });
        }
    });
    
    // Stock filters
    const filterSelects = document.querySelectorAll('.filters-bar select, .stock-filters select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            console.log('Filter changed:', this.value);
            // In real app, would filter the data
            showMessage('Applying filters...', 'success');
        });
    });
    
    // Search functionality
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            console.log('Searching for:', searchTerm);
            // In real app, would filter table rows or cards
        });
    });
    
    // View QR Code buttons
    const qrButtons = document.querySelectorAll('.data-table .btn-link');
    qrButtons.forEach(button => {
        if (button.textContent.includes('QR')) {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const bagId = row.querySelector('td:first-child').textContent;
                
                showMessage(`Displaying QR Code for ${bagId}`, 'success');
                // In real app, would show QR code modal
            });
        }
    });
    
    // Edit/Reserve stock actions
    const editButtons = document.querySelectorAll('.btn-icon[title="Edit"]');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const bagId = row.querySelector('td:first-child').textContent;
            showMessage(`Edit ${bagId}`, 'success');
        });
    });
    
    const reserveButtons = document.querySelectorAll('.btn-icon[title="Reserve"]');
    reserveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const bagId = row.querySelector('td:first-child').textContent;
            
            if (confirm(`Reserve ${bagId}?`)) {
                showMessage(`${bagId} reserved successfully`, 'success');
                // Update status badge
                const statusBadge = row.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Reserved';
                    statusBadge.classList.remove('available');
                    statusBadge.classList.add('reserved');
                }
            }
        });
    });
    
    // Manage Slots button on camp cards
    const manageSlotButtons = document.querySelectorAll('.camp-management-card .btn-secondary');
    manageSlotButtons.forEach(button => {
        if (button.textContent.includes('Manage Slots')) {
            button.addEventListener('click', function() {
                const campCard = this.closest('.camp-management-card');
                const campName = campCard.querySelector('h4').textContent;
                showMessage(`Managing slots for ${campName}`, 'success');
            });
        }
    });
    
    // Edit Camp buttons
    manageSlotButtons.forEach(button => {
        if (button.textContent.includes('Edit Camp')) {
            button.addEventListener('click', function() {
                const campCard = this.closest('.camp-management-card');
                const campName = campCard.querySelector('h4').textContent;
                showMessage(`Editing ${campName}`, 'success');
            });
        }
    });
    
    // Cancel Camp buttons
    const cancelCampButtons = document.querySelectorAll('.camp-management-card .btn-danger');
    cancelCampButtons.forEach(button => {
        button.addEventListener('click', function() {
            const campCard = this.closest('.camp-management-card');
            const campName = campCard.querySelector('h4').textContent;
            
            if (confirm(`Are you sure you want to cancel ${campName}?`)) {
                showMessage(`${campName} cancelled`, 'success');
                campCard.style.display = 'none';
            }
        });
    });
    
    // Alert donors for shortage
    const alertDonorButtons = document.querySelectorAll('.alert-banner button, .alert-card button');
    alertDonorButtons.forEach(button => {
        if (button.textContent.includes('Alert Donors') || button.textContent.includes('Send Alert')) {
            button.addEventListener('click', function() {
                const alertCard = this.closest('.alert-banner, .alert-card');
                const bloodType = alertCard.textContent.match(/[ABO][+-]/);
                
                if (confirm(`Send shortage alert to eligible ${bloodType ? bloodType[0] : ''} donors?`)) {
                    showMessage('Alerts sent to eligible donors', 'success');
                }
            });
        }
    });
    
    // Blood Bank Network - Request Blood
    const requestBloodButtons = document.querySelectorAll('.network-card .btn-secondary');
    requestBloodButtons.forEach(button => {
        if (button.textContent.includes('Request Blood')) {
            button.addEventListener('click', function() {
                const networkCard = this.closest('.network-card');
                const bankName = networkCard.querySelector('h4').textContent;
                showMessage(`Sending request to ${bankName}`, 'success');
            });
        }
    });
    
    // View Full Stock in network
    requestBloodButtons.forEach(button => {
        if (button.textContent.includes('View Full Stock')) {
            button.addEventListener('click', function() {
                showMessage('Loading full stock details...', 'success');
            });
        }
    });
    
    // Generate certificate for donation
    const certificateButtons = document.querySelectorAll('.data-table .btn-link');
    certificateButtons.forEach(button => {
        if (button.textContent.includes('Generate')) {
            button.addEventListener('click', function() {
                const row = this.closest('tr');
                const donorName = row.querySelectorAll('td')[1].textContent;
                showMessage(`Generating certificate for ${donorName}`, 'success');
            });
        }
    });
});