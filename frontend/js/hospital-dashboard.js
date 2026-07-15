// Hospital Dashboard JavaScript - Database Connected

document.addEventListener('DOMContentLoaded', function () {
    // Load User Profile
    loadUserProfile();

    // Load Dashboard Data
    const hospitalId = localStorage.getItem('user_id');
    if (hospitalId) {
        loadHospitalStats(hospitalId);
        loadActiveRequests(hospitalId);
        loadQuickStockCheck();
        loadAllRequests(hospitalId);
        loadBloodBanks();
        loadRequestHistory(hospitalId);
    }

    // Emergency Request Button
    const emergencyRequestBtn = document.getElementById('emergencyRequestBtn');
    const emergencyModal = document.getElementById('emergencyModal');

    if (emergencyRequestBtn && emergencyModal) {
        emergencyRequestBtn.addEventListener('click', function () {
            emergencyModal.style.display = 'flex';
        });
    }

    // Emergency Form Submission
    const emergencyForm = document.getElementById('emergencyForm');
    if (emergencyForm) {
        emergencyForm.addEventListener('submit', function (e) {
            e.preventDefault();

            let bloodGroup = document.getElementById('emergencyBloodGroupSelect') ? document.getElementById('emergencyBloodGroupSelect').value : (document.getElementById('emergencyBloodGroup') ? document.getElementById('emergencyBloodGroup').value : '');
            if (bloodGroup === 'Other' && document.getElementById('emergencyBloodGroupManual')) {
                bloodGroup = document.getElementById('emergencyBloodGroupManual').value;
            }
            const units = document.getElementById('emergencyUnits').value;
            const patientName = document.getElementById('emergencyPatientName').value;
            const reason = document.getElementById('emergencyReason').value;

            fetch('/api/blood-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hospital_id: hospitalId,
                    blood_group: bloodGroup,
                    units: units,
                    patient_name: patientName,
                    reason: reason,
                    priority: 'emergency'
                })
            })
                .then(res => res.json())
                .then(data => {
                    alert(data.message || 'Emergency request submitted!');
                    emergencyModal.style.display = 'none';
                    this.reset();
                    loadHospitalStats(hospitalId);
                    loadActiveRequests(hospitalId);
                    loadAllRequests(hospitalId);
                })
                .catch(err => alert('Error submitting request: ' + err));
        });
    }

    // Regular Blood Request Form
    const requestForm = document.getElementById('bloodRequestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', function (e) {
            e.preventDefault();

            let bloodGroup = document.getElementById('bloodGroupSelect') ? document.getElementById('bloodGroupSelect').value : document.getElementById('bloodGroup').value;
            if (bloodGroup === 'Other' && document.getElementById('bloodGroupManual')) {
                bloodGroup = document.getElementById('bloodGroupManual').value;
            }
            const units = document.getElementById('units').value;
            const patientName = document.getElementById('patientName').value;
            const reason = document.getElementById('reason').value;
            const priority = document.getElementById('priority').value;

            fetch('/api/blood-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hospital_id: hospitalId,
                    blood_group: bloodGroup,
                    units: units,
                    patient_name: patientName,
                    reason: reason,
                    priority: priority
                })
            })
                .then(res => res.json())
                .then(data => {
                    alert(data.message || 'Blood request submitted!');
                    this.reset();
                    loadHospitalStats(hospitalId);
                    loadActiveRequests(hospitalId);
                    loadAllRequests(hospitalId);
                })
                .catch(err => alert('Error submitting request: ' + err));
        });
    }

    // Quick Stock Check
    const checkStockBtn = document.getElementById('checkStockBtn');
    if (checkStockBtn) {
        // Initialize Other blood group handlers
        const quickBloodGroupSelect = document.getElementById('quickBloodGroup');
        const quickBloodGroupManual = document.getElementById('quickBloodGroupManual');
        if (quickBloodGroupSelect && quickBloodGroupManual) {
            quickBloodGroupSelect.addEventListener('change', function() {
                if (this.value === 'Other') {
                    quickBloodGroupManual.style.display = 'block';
                } else {
                    quickBloodGroupManual.style.display = 'none';
                }
            });
        }
        
        const mainBloodGroupSelect = document.getElementById('bloodGroupSelect');
        const mainBloodGroupManual = document.getElementById('bloodGroupManual');
        if (mainBloodGroupSelect && mainBloodGroupManual) {
            mainBloodGroupSelect.addEventListener('change', function() {
                if (this.value === 'Other') {
                    mainBloodGroupManual.style.display = 'block';
                    mainBloodGroupManual.required = true;
                } else {
                    mainBloodGroupManual.style.display = 'none';
                    mainBloodGroupManual.required = false;
                }
            });
        }

        const emergencyBloodGroupSelect = document.getElementById('emergencyBloodGroupSelect');
        const emergencyBloodGroupManual = document.getElementById('emergencyBloodGroupManual');
        if (emergencyBloodGroupSelect && emergencyBloodGroupManual) {
            emergencyBloodGroupSelect.addEventListener('change', function() {
                if (this.value === 'Other') {
                    emergencyBloodGroupManual.style.display = 'block';
                    emergencyBloodGroupManual.required = true;
                } else {
                    emergencyBloodGroupManual.style.display = 'none';
                    emergencyBloodGroupManual.required = false;
                }
            });
        }

        checkStockBtn.addEventListener('click', function () {
            let bloodGroup = document.getElementById('quickBloodGroup').value;
            if (bloodGroup === 'Other' && quickBloodGroupManual) {
                bloodGroup = quickBloodGroupManual.value;
            }
            const stockResults = document.getElementById('stockResults');

            if (!bloodGroup) {
                alert('Please select a blood group');
                return;
            }

            fetch(`/api/stock-check?blood_group=${encodeURIComponent(bloodGroup)}`)
                .then(res => res.json())
                .then(data => {
                    stockResults.innerHTML = '';
                    stockResults.style.display = 'block'; // Ensure it's visible
                    
                    if (data.length === 0) {
                        stockResults.innerHTML = '<p>No stock available for this blood group.</p>';
                        return;
                    }

                    data.forEach(bank => {
                        const div = document.createElement('div');
                        div.className = 'stock-result-item';
                        div.innerHTML = `
                            <h4>${bank.bank_name}</h4>
                            <p><strong>Available:</strong> ${bank.units} units</p>
                            <p><strong>Location:</strong> ${bank.city || 'N/A'}</p>
                            <button class="btn-primary btn-sm" onclick="requestFromBank(${bank.bank_id}, '${bloodGroup}')">Request</button>
                        `;
                        stockResults.appendChild(div);
                    });
                })
                .catch(err => {
                    stockResults.innerHTML = '<p>Error loading stock data.</p>';
                    console.error(err);
                });
        });
    }

    // --- Data Loading Functions ---

    function loadUserProfile() {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            window.location.href = 'login.html';
            return;
        }

        fetch(`/api/user/${userId}`)
            .then(res => res.json())
            .then(user => {
                const nameElements = document.querySelectorAll('.user-name');
                const locationElements = document.querySelectorAll('.user-blood');

                nameElements.forEach(el => el.textContent = user.username);
                locationElements.forEach(el => el.textContent = user.city || 'Hospital');
            })
            .catch(err => console.error('Error loading profile:', err));
    }

    function loadHospitalStats(hospitalId) {
        fetch(`/api/hospital/stats/${hospitalId}`)
            .then(res => res.json())
            .then(stats => {
                const statCards = document.querySelectorAll('.stat-card .stat-number');
                if (statCards[0]) statCards[0].textContent = stats.active_requests || 0;
                if (statCards[1]) statCards[1].textContent = stats.fulfilled_this_month || 0;
                if (statCards[2]) statCards[2].textContent = stats.units_received || 0;
                if (statCards[3]) statCards[3].textContent = (stats.avg_response_time || 0) + ' hrs';
                
                const pendingApproval = document.getElementById('hospital-active-requests-change');
                if (pendingApproval) pendingApproval.textContent = `${stats.pending_approval || 0} pending approval`;
                
                const fulfilledChange = document.getElementById('hospital-fulfilled-change');
                if (fulfilledChange && stats.fulfilled_change_percent !== undefined) {
                    if (stats.fulfilled_change_percent === 0) {
                        fulfilledChange.textContent = 'Consistent with last month';
                        fulfilledChange.className = 'stat-change';
                    } else {
                        const icon = stats.fulfilled_change_percent > 0 ? '↑' : '↓';
                        const sign = stats.fulfilled_change_percent > 0 ? 'positive' : 'negative';
                        fulfilledChange.textContent = `${icon} ${Math.abs(stats.fulfilled_change_percent)}% from last month`;
                        fulfilledChange.className = `stat-change ${sign}`;
                    }
                }
                
                const unitsChange = document.getElementById('hospital-units-change');
                if (unitsChange) unitsChange.textContent = 'This month';
                
                const avgResponseTimeChange = document.getElementById('hospital-response-change');
                if (avgResponseTimeChange && stats.response_time_change !== undefined) {
                    if (stats.avg_response_time === 0) {
                        statCards[3].textContent = 'N/A';
                        statCards[3].style.color = '#a0aec0'; // Make it grey
                        avgResponseTimeChange.textContent = 'No data available';
                        avgResponseTimeChange.className = 'stat-change';
                    } else if (stats.response_time_change === 0) {
                        statCards[3].textContent = `${stats.avg_response_time} hrs`;
                        statCards[3].style.color = '#e74c3c'; // Reset color
                        avgResponseTimeChange.textContent = 'Consistent';
                        avgResponseTimeChange.className = 'stat-change';
                    } else {
                        statCards[3].textContent = `${stats.avg_response_time} hrs`;
                        statCards[3].style.color = '#e74c3c'; // Reset color
                        const icon = stats.response_time_change > 0 ? '↑' : '↓';
                        const sign = stats.response_time_change > 0 ? 'negative' : 'positive'; // slower is negative
                        avgResponseTimeChange.textContent = `${icon} ${Math.abs(stats.response_time_change)}% ${stats.response_time_change > 0 ? 'slower' : 'faster'}`;
                        avgResponseTimeChange.className = `stat-change ${sign}`;
                    }
                }
            })
            .catch(err => console.error('Error loading stats:', err));
    }

    function loadActiveRequests(hospitalId) {
        const container = document.querySelector('.hospital-requests-list');
        if (!container) return;

        fetch(`/api/hospital/requests/${hospitalId}?status=active`)
            .then(res => res.json())
            .then(requests => {
                container.innerHTML = '';
                requests.forEach(req => {
                    const div = document.createElement('div');
                    div.className = `hospital-request-item ${req.priority}`;
                    div.innerHTML = `
                        <div class="request-status-indicator"></div>
                        <div class="request-details">
                            <div class="request-header-inline">
                                <h4>REQ-#${req.id}</h4>
                                <span class="priority-badge ${req.priority}">${req.priority}</span>
                            </div>
                            <p><strong>Blood Type:</strong> ${req.blood_group} | <strong>Units:</strong> ${req.units}</p>
                            <p><strong>Blood Bank:</strong> ${req.bank_name || 'Pending'}</p>
                            <p><strong>Status:</strong> ${req.status}</p>
                            <p><strong>Submitted:</strong> ${req.date}</p>
                        </div>
                        <button class="btn-secondary btn-sm" onclick="trackRequest(${req.id})">Track</button>
                    `;
                    container.appendChild(div);
                });

                if (requests.length === 0) {
                    container.innerHTML = '<p>No active requests.</p>';
                }
            })
            .catch(err => {
                console.error('Error loading active requests:', err);
                container.innerHTML = '<p>Error loading requests.</p>';
            });
    }

    function loadQuickStockCheck() {
        // Stock check is loaded on demand when user clicks the button
    }

    function loadAllRequests(hospitalId) {
        const container = document.getElementById('allRequestsContainer');
        const badge = document.getElementById('activeRequestsBadge');
        if (!container) return;

        fetch(`/api/hospital/requests/${hospitalId}`)
            .then(res => res.json())
            .then(requests => {
                // Filter active requests (pending or approved but not completed/cancelled)
                const activeRequests = requests.filter(req => req.status !== 'completed' && req.status !== 'cancelled' && req.status !== 'rejected');
                
                if (badge) {
                    badge.textContent = `Active (${activeRequests.length})`;
                }
                
                container.innerHTML = '';
                activeRequests.forEach(req => {
                    const div = document.createElement('div');
                    div.className = `request-card ${req.priority}`;
                    div.innerHTML = `
                        <div class="request-header">
                            <div>
                                <h4>REQ-#${req.id}</h4>
                                <span class="priority-badge ${req.priority}">${req.priority}</span>
                            </div>
                            <span class="status-badge ${req.status}">${req.status}</span>
                        </div>
                        <div class="request-body">
                            <p><strong>Blood Type:</strong> ${req.blood_group}</p>
                            <p><strong>Units Required:</strong> ${req.units}</p>
                            <p><strong>Patient:</strong> ${req.patient_name}</p>
                            <p><strong>Reason:</strong> ${req.reason || 'N/A'}</p>
                            <p><strong>Blood Bank:</strong> ${req.bank_name || 'Pending'}</p>
                            <p><strong>Submitted:</strong> ${req.date}</p>
                        </div>
                        <div class="request-actions">
                            <button class="btn-secondary btn-sm">View Details</button>
                            ${req.status === 'pending' ? '<button class="btn-danger btn-sm" onclick="cancelRequest(' + req.id + ')">Cancel</button>' : ''}
                        </div>
                    `;
                    container.appendChild(div);
                });

                if (activeRequests.length === 0) {
                    container.innerHTML = '<p class="no-data">No active requests found.</p>';
                }
            })
            .catch(err => {
                console.error('Error loading all requests:', err);
                container.innerHTML = '<p class="no-data">Error loading requests.</p>';
            });
    }

    function loadBloodBanks() {
        const grid = document.getElementById('bloodBanksGrid');
        const dashboardGrid = document.getElementById('dashboardBloodBanksGrid');
        const selectionContainer = document.getElementById('bloodBankSelectionContainer');
        const emergencySelect = document.getElementById('emergencyBloodBankSelect');

        fetch('/api/banks')
            .then(res => res.json())
            .then(banks => {
                if (grid) grid.innerHTML = '';
                if (dashboardGrid) dashboardGrid.innerHTML = '';
                if (selectionContainer) selectionContainer.innerHTML = '';
                if (emergencySelect) emergencySelect.innerHTML = '<option value="">Select Blood Bank</option>';
                
                banks.forEach((bank, index) => {
                    // Update grid cards
                    if (grid) {
                        const div = document.createElement('div');
                        div.className = 'blood-bank-card';
                        div.innerHTML = `
                            <div class="bank-header">
                                <h4>${bank.name}</h4>
                                <span class="status-badge available">Available</span>
                            </div>
                            <div class="bank-details">
                                <p><strong>Location:</strong> ${bank.city || 'N/A'}</p>
                                <p><strong>Contact:</strong> ${bank.phone || 'N/A'}</p>
                                <p><strong>Email:</strong> ${bank.email || 'N/A'}</p>
                            </div>
                            <div class="bank-actions">
                                <button class="btn-primary btn-sm" onclick="viewBankStock(${bank.id})">View Stock</button>
                                <button class="btn-secondary btn-sm" onclick="contactBank(${bank.id})">Contact</button>
                            </div>
                        `;
                        grid.appendChild(div);
                    }
                    
                    // Update mini cards
                    if (dashboardGrid) {
                        const miniDiv = document.createElement('div');
                        miniDiv.className = 'blood-bank-mini-card';
                        miniDiv.innerHTML = `
                            <h4>${bank.name}</h4>
                            <p>📍 ${bank.city || 'N/A'}</p>
                            <p>📞 ${bank.phone || 'N/A'}</p>
                            <p>⏰ 24/7 Available</p>
                            <button class="btn-secondary btn-sm btn-block" onclick="viewBankStock(${bank.id})">View Stock</button>
                        `;
                        dashboardGrid.appendChild(miniDiv);
                    }

                    // Update selection container (Main Form)
                    if (selectionContainer) {
                        const label = document.createElement('label');
                        label.className = 'bank-option';
                        label.innerHTML = `
                            <input type="radio" name="blood_bank" value="${bank.id}" ${index === 0 ? 'required' : ''}>
                            <div class="bank-option-content">
                                <h4>${bank.name}</h4>
                                <p>📍 ${bank.city || 'N/A'} | 📞 ${bank.phone || 'N/A'}</p>
                                <p class="stock-info" onclick="event.preventDefault(); viewBankStock(${bank.id});" style="cursor: pointer; text-decoration: underline;">Check availability</p>
                            </div>
                        `;
                        selectionContainer.appendChild(label);
                    }

                    // Update emergency dropdown
                    if (emergencySelect) {
                        const option = document.createElement('option');
                        option.value = bank.id;
                        option.textContent = `${bank.name} (${bank.city || 'N/A'})`;
                        emergencySelect.appendChild(option);
                    }
                });

                if (banks.length === 0) {
                    if (grid) grid.innerHTML = '<p>No blood banks found.</p>';
                    if (dashboardGrid) dashboardGrid.innerHTML = '<p>No blood banks found.</p>';
                    if (selectionContainer) selectionContainer.innerHTML = '<p style="color: #e74c3c;">No blood banks available to receive requests.</p>';
                }
            })
            .catch(err => {
                console.error('Error loading blood banks:', err);
                if (grid) grid.innerHTML = '<p>Error loading blood banks.</p>';
                if (dashboardGrid) dashboardGrid.innerHTML = '<p>Error loading blood banks.</p>';
                if (selectionContainer) selectionContainer.innerHTML = '<p style="color: #e74c3c;">Error loading blood banks.</p>';
            });
    }

    function loadRequestHistory(hospitalId) {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        fetch(`/api/hospital/requests/${hospitalId}?status=completed`)
            .then(res => res.json())
            .then(requests => {
                tbody.innerHTML = '';
                requests.forEach(req => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>REQ-#${req.id}</td>
                        <td>${req.date}</td>
                        <td><span class="blood-type">${req.blood_group}</span></td>
                        <td>${req.units}</td>
                        <td>${req.bank_name || 'N/A'}</td>
                        <td><span class="status-badge ${req.status}">${req.status}</span></td>
                        <td><button class="btn-link" onclick="viewRequestDetails(${req.id})">View</button></td>
                    `;
                    tbody.appendChild(tr);
                });

                if (requests.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No history found.</td></tr>';
                }
            })
            .catch(err => {
                console.error('Error loading history:', err);
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Error loading history.</td></tr>';
            });
    }

    // Global helper functions
    window.trackRequest = function (reqId) {
        alert('Tracking request #' + reqId);
    };

    window.cancelRequest = function (reqId) {
        if (!confirm('Are you sure you want to cancel this request?')) return;

        fetch(`/api/blood-requests/${reqId}`, {
            method: 'DELETE'
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message || 'Request cancelled');
                loadHospitalStats(hospitalId);
                loadActiveRequests(hospitalId);
                loadAllRequests(hospitalId);
            })
            .catch(err => alert('Error cancelling request: ' + err));
    };

    window.requestFromBank = function (bankId, bloodGroup) {
        alert(`Requesting ${bloodGroup} from bank #${bankId}`);
    };

    window.viewBankStock = function (bankId) {
        const modal = document.getElementById('bankStockModal');
        const modalBody = document.getElementById('bankStockModalBody');
        if (!modal || !modalBody) return;
        
        modal.style.display = 'flex';
        modalBody.innerHTML = '<p style="text-align:center;">Loading stock data...</p>';
        
        fetch(`/api/bank/inventory/${bankId}`)
            .then(res => res.json())
            .then(data => {
                let hasStock = false;
                let html = '<div class="stock-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 15px; text-align: center;">';
                for (const [bg, units] of Object.entries(data)) {
                    if (units > 0) {
                        hasStock = true;
                        html += `
                            <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
                                <h3 style="color: var(--primary-color); margin-bottom: 5px;">${bg}</h3>
                                <p style="font-size: 1.2rem; font-weight: bold;">${units} <span style="font-size: 0.8rem; color: #a0aec0;">units</span></p>
                            </div>
                        `;
                    }
                }
                
                if (!hasStock) {
                    modalBody.innerHTML = '<p style="text-align:center; color:#a0aec0;">No stock available for this blood bank.</p>';
                    return;
                }
                
                html += '</div>';
                modalBody.innerHTML = html;
            })
            .catch(err => {
                console.error('Error fetching stock:', err);
                modalBody.innerHTML = '<p style="text-align:center; color:#e74c3c;">Failed to load stock data.</p>';
            });
    };

    window.contactBank = function (bankId) {
        alert('Contacting bank #' + bankId);
    };

    window.viewRequestDetails = function (reqId) {
        alert('Viewing details for request #' + reqId);
    };
});