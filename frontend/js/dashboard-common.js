// Common Dashboard JavaScript (Shared across all dashboards)

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');
    
    // Global helper: switch to a section by its ID
    window.navigateToSection = function(sectionId) {
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) return;

        contentSections.forEach(section => section.classList.remove('active'));
        targetSection.classList.add('active');

        // Sync active nav item
        navItems.forEach(nav => {
            nav.classList.remove('active');
            if (nav.dataset.section === sectionId) {
                nav.classList.add('active');
                if (pageTitle) {
                    pageTitle.textContent = nav.textContent.trim().split('\n')[0].trim();
                }
            }
        });

        // Scroll to top of main content
        const main = document.querySelector('.main-content');
        if (main) main.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            window.navigateToSection(this.dataset.section);
        });
    });

    // Handle all hash links ("View All", "View All Banks", etc.)
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const hash = link.getAttribute('href').slice(1); // strip "#"
        if (document.getElementById(hash)) {
            e.preventDefault();
            window.navigateToSection(hash);
        }
    });

    // Navigate to section from page load hash (e.g. URL has #blood-banks)
    if (window.location.hash) {
        const hash = window.location.hash.slice(1);
        if (document.getElementById(hash)) {
            window.navigateToSection(hash);
        }
    }
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
            if (sidebar && sidebar.classList.contains('active')) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        }
    });
    
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    
    // Modal functionality
    const modals = document.querySelectorAll('.modal');
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modal when clicking outside
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.style.display !== 'none') {
                    modal.style.display = 'none';
                }
            });
        }
    });
    
    // Form validation helper
    window.validateFormData = function(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'red';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });
        
        return isValid;
    };
    
    // Success/Error message display helper
    window.showMessage = function(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    };
    
    // Add CSS animations for messages
    if (!document.getElementById('message-animations')) {
        const style = document.createElement('style');
        style.id = 'message-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Date formatting helper
    window.formatDate = function(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };
    
    // Time formatting helper
    window.formatTime = function(timeString) {
        const date = new Date(`2000-01-01T${timeString}`);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    // Toggle manual input for custom blood groups
    window.toggleCustomBloodGroup = function(selectEl, inputId) {
        const manualInput = document.getElementById(inputId);
        if (!manualInput) return;
        if (selectEl.value === 'Other' || selectEl.value === 'other') {
            manualInput.style.display = 'block';
            manualInput.required = true;
            manualInput.focus();
        } else {
            manualInput.style.display = 'none';
            manualInput.required = false;
        }
    };
});