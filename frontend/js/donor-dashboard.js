// Donor Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Profile editing
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const profileForm = document.getElementById('profileForm');
    const formActions = document.querySelector('.form-actions');
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // Enable all form inputs
            const inputs = profileForm.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Show form actions
            if (formActions) {
                formActions.style.display = 'flex';
            }
            
            this.style.display = 'none';
        });
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            // Disable all form inputs
            const inputs = profileForm.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.disabled = true;
            });
            
            // Hide form actions
            if (formActions) {
                formActions.style.display = 'none';
            }
            
            if (editProfileBtn) {
                editProfileBtn.style.display = 'inline-block';
            }
            
            // Reset form to original values
            profileForm.reset();
        });
    }
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            console.log('Profile update:', data);
            
            // Show success message
            showMessage('Profile updated successfully!', 'success');
            
            // Disable inputs again
            const inputs = this.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.disabled = true;
            });
            
            if (formActions) {
                formActions.style.display = 'none';
            }
            
            if (editProfileBtn) {
                editProfileBtn.style.display = 'inline-block';
            }
        });
    }
    
    // Profile photo change
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImage = document.getElementById('profileImage');
    
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', function() {
            profileImageInput.click();
        });
    }
    
    if (profileImageInput) {
        profileImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (profileImage) {
                        profileImage.src = e.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Booking form functionality
    const bookingForm = document.getElementById('bookingForm');
    
    window.nextStep = function(step) {
        const currentStep = document.querySelector('.form-step.active');
        const nextStepEl = document.querySelector(`.form-step[data-step="${step}"]`);
        
        if (currentStep && nextStepEl) {
            // Validate current step
            const requiredFields = currentStep.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (field.type === 'radio') {
                    const radioGroup = currentStep.querySelectorAll(`input[name="${field.name}"]`);
                    const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                    if (!isChecked) {
                        isValid = false;
                    }
                } else if (!field.value) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                showMessage('Please complete all required fields', 'error');
                return;
            }
            
            currentStep.classList.remove('active');
            nextStepEl.classList.add('active');
        }
    };
    
    window.prevStep = function(step) {
        const currentStep = document.querySelector('.form-step.active');
        const prevStepEl = document.querySelector(`.form-step[data-step="${step}"]`);
        
        if (currentStep && prevStepEl) {
            currentStep.classList.remove('active');
            prevStepEl.classList.add('active');
        }
    };
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            console.log('Booking data:', data);
            
            showMessage('Slot booked successfully!', 'success');
            
            // Reset form and go back to first step
            this.reset();
            document.querySelectorAll('.form-step').forEach(step => {
                step.classList.remove('active');
            });
            document.querySelector('.form-step[data-step="1"]').classList.add('active');
            
            // Redirect to appointments
            setTimeout(() => {
                const appointmentsNav = document.querySelector('[data-section="appointments"]');
                if (appointmentsNav) {
                    appointmentsNav.click();
                }
            }, 1500);
        });
    }
    
    // Quick camp booking from cards
    const campBookButtons = document.querySelectorAll('.camp-card .btn-primary');
    campBookButtons.forEach(button => {
        button.addEventListener('click', function() {
            const bookSlotNav = document.querySelector('[data-section="book-slot"]');
            if (bookSlotNav) {
                bookSlotNav.click();
            }
        });
    });
    
    // Notification actions
    const notificationActionButtons = document.querySelectorAll('.notification-actions button');
    notificationActionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            const notificationCard = this.closest('.notification-card');
            
            if (action === 'I Can Donate') {
                showMessage('Thank you! We have notified the blood bank.', 'success');
                if (notificationCard) {
                    notificationCard.classList.remove('unread');
                }
            } else if (action === 'Not Available') {
                showMessage('Thank you for your response.', 'success');
                if (notificationCard) {
                    notificationCard.classList.remove('unread');
                }
            }
        });
    });
    
    // Mark all notifications as read
    const markAllReadBtn = document.querySelector('.notifications-container .btn-secondary');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            document.querySelectorAll('.notification-card.unread').forEach(card => {
                card.classList.remove('unread');
            });
            showMessage('All notifications marked as read', 'success');
        });
    }
    
    // Search functionality for camps
    const campSearchInput = document.querySelector('.camps-container .search-input');
    if (campSearchInput) {
        campSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const campCards = document.querySelectorAll('.camp-card');
            
            campCards.forEach(card => {
                const campName = card.querySelector('h3').textContent.toLowerCase();
                const campLocation = card.querySelector('p').textContent.toLowerCase();
                
                if (campName.includes(searchTerm) || campLocation.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});