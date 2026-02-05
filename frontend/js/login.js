// Login Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Get role buttons
    const roleButtons = document.querySelectorAll('.role-btn');
    const userRoleInput = document.getElementById('userRole');
    
    // Get role from URL parameter if present
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    
    // Set initial role
    if (roleParam) {
        switchRole(roleParam);
    }
    
    // Role button click handlers
    roleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const role = this.dataset.role;
            switchRole(role);
        });
    });
    
    function switchRole(role) {
        // Update active role button
        roleButtons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.role-btn[data-role="${role}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Update hidden input
        if (userRoleInput) {
            userRoleInput.value = role;
        }
    }
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Basic validation
            if (!data.email || !data.password) {
                alert('Please enter both email and password.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // In a real application, send credentials to backend
            console.log('Login attempt:', data);
            
            // For demo purposes, simulate successful login
            // and redirect to appropriate dashboard
            const role = data.role;
            let dashboardUrl = '';
            
            switch(role) {
                case 'donor':
                    dashboardUrl = 'donor-dashboard.html';
                    break;
                case 'bank':
                    dashboardUrl = 'bank-dashboard.html';
                    break;
                case 'hospital':
                    dashboardUrl = 'hospital-dashboard.html';
                    break;
                default:
                    dashboardUrl = 'index.html';
            }
            
            // Simulate login delay
            alert('Login successful! Redirecting to dashboard...');
            window.location.href = dashboardUrl;
        });
    }
    
    // Show/hide password (optional enhancement)
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('dblclick', function() {
            if (this.type === 'password') {
                this.type = 'text';
                setTimeout(() => {
                    this.type = 'password';
                }, 1000);
            }
        });
    }
});