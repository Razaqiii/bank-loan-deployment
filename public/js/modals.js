/**
 * Modal and form handling module
 */

import { validateForm, validateField, formatCurrencyInput, showToast, sanitizeHTML } from './utils.js';
import { login, register } from './auth.js';
import stateManager from './state.js';

/**
 * Show modal
 * @param {string} modalId - Modal element ID
 */
export const showModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Focus first input
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
};

/**
 * Close modal
 * @param {string} modalId - Modal element ID
 */
export const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore scrolling
    
    // Clear form
    const form = modal.querySelector('form');
    if (form) {
      form.reset();
      // Clear validation states
      form.querySelectorAll('.invalid, .valid').forEach(el => {
        el.classList.remove('invalid', 'valid');
      });
      form.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
      });
    }
  }
};

/**
 * Show login modal
 */
export const showLogin = () => {
  closeModal('registerModal');
  closeModal('applicationModal');
  showModal('loginModal');
};

/**
 * Show register modal
 */
export const showRegister = () => {
  closeModal('loginModal');
  closeModal('applicationModal');
  showModal('registerModal');
};

/**
 * Show application modal
 * @param {string} loanType - Loan type (optional)
 */
export const showApplication = (loanType = '') => {
  closeModal('loginModal');
  closeModal('registerModal');
  showModal('applicationModal');
  
  // Pre-fill loan type if provided
  if (loanType) {
    const loanTypeSelect = document.getElementById('applicationLoanType');
    if (loanTypeSelect) {
      loanTypeSelect.value = loanType;
    }
  }
  
  // Pre-fill amount from calculator if available
  const calculation = stateManager.getState('loanCalculation');
  if (calculation) {
    const amountInput = document.getElementById('applicationAmount');
    if (amountInput) {
      amountInput.value = calculation.principal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  }
};

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 */
export const handleLoginSubmit = async (event) => {
  event.preventDefault();
  
  const form = event.target;
  
  if (!validateForm(form)) {
    showToast('Mohon lengkapi form dengan benar', 'error');
    return;
  }
  
  const email = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  const success = await login(email, password);
  
  if (success) {
    closeModal('loginModal');
  }
};

/**
 * Handle register form submission
 * @param {Event} event - Form submit event
 */
export const handleRegisterSubmit = async (event) => {
  event.preventDefault();
  
  const form = event.target;
  
  if (!validateForm(form)) {
    showToast('Mohon lengkapi form dengan benar', 'error');
    return;
  }
  
  const userData = {
    name: document.getElementById('registerName').value.trim(),
    email: document.getElementById('registerEmail').value.trim(),
    password: document.getElementById('registerPassword').value,
    confirmPassword: document.getElementById('registerConfirmPassword').value
  };
  
  const success = await register(userData);
  
  if (success) {
    closeModal('registerModal');
    // Show login modal
    setTimeout(() => showLogin(), 500);
  }
};

/**
 * Handle loan application form submission
 * @param {Event} event - Form submit event
 */
export const handleApplicationSubmit = async (event) => {
  event.preventDefault();
  
  const form = event.target;
  
  if (!validateForm(form)) {
    showToast('Mohon lengkapi form dengan benar', 'error');
    return;
  }
  
  // Collect form data
  const applicationData = {
    fullName: sanitizeHTML(document.getElementById('fullName').value.trim()),
    nik: sanitizeHTML(document.getElementById('nik').value.trim()),
    email: sanitizeHTML(document.getElementById('email').value.trim()),
    phone: sanitizeHTML(document.getElementById('phone').value.trim()),
    address: sanitizeHTML(document.getElementById('address').value.trim()),
    occupation: sanitizeHTML(document.getElementById('occupation').value.trim()),
    income: document.getElementById('income').value.replace(/\D/g, ''),
    loanType: document.getElementById('applicationLoanType').value,
    amount: document.getElementById('applicationAmount').value.replace(/\D/g, ''),
    purpose: sanitizeHTML(document.getElementById('loanPurpose').value.trim()),
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };
  
  try {
    // In production, send to backend API
    // For demo, store in state
    const applications = stateManager.getState('applications') || [];
    applications.push(applicationData);
    stateManager.setState('applications', applications);
    
    showToast('Pengajuan pinjaman berhasil dikirim! Kami akan menghubungi Anda dalam 1x24 jam.', 'success');
    closeModal('applicationModal');
    
    // In production, make API call:
    // const response = await fetch('/api/applications', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(applicationData)
    // });
    
  } catch (error) {
    console.error('Application submission error:', error);
    showToast('Terjadi kesalahan saat mengirim pengajuan', 'error');
  }
};

/**
 * Initialize modal functionality
 */
export const initModals = () => {
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      const modalId = event.target.id;
      closeModal(modalId);
    }
  });
  
  // Close modal with Escape key
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const openModal = document.querySelector('.modal[style*="display: block"]');
      if (openModal) {
        closeModal(openModal.id);
      }
    }
  });
  
  // Setup form submissions
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
  
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }
  
  const applicationForm = document.getElementById('loanApplicationForm');
  if (applicationForm) {
    applicationForm.addEventListener('submit', handleApplicationSubmit);
  }
  
  // Setup real-time validation
  document.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
  });
  
  // Setup currency formatting
  document.querySelectorAll('input[data-currency]').forEach(input => {
    input.addEventListener('input', () => formatCurrencyInput(input));
  });
  
  // Setup close buttons
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      const modal = closeBtn.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
};

/**
 * Apply for loan from product card
 * @param {string} loanType - Type of loan
 */
export const applyLoan = (loanType) => {
  showApplication(loanType);
};

/**
 * Apply for loan from calculator
 */
export const applyFromCalculator = () => {
  const calculation = stateManager.getState('loanCalculation');
  if (!calculation) {
    showToast('Silakan hitung pinjaman terlebih dahulu', 'warning');
    return;
  }
  showApplication();
};

// Export for global access
window.modalModule = {
  showLogin,
  showRegister,
  showApplication,
  closeModal,
  applyLoan,
  applyFromCalculator
};

// Made with Bob
