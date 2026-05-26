/**
 * Utility functions for validation, formatting, and sanitization
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeHTML = (str) => {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Indonesian NIK (16 digits)
 * @param {string} nik - NIK to validate
 * @returns {boolean} True if valid
 */
export const validateNIK = (nik) => {
  const nikRegex = /^\d{16}$/;
  return nikRegex.test(nik);
};

/**
 * Validate phone number (Indonesian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password minimal 8 karakter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password harus mengandung huruf besar' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password harus mengandung huruf kecil' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password harus mengandung angka' };
  }
  return { isValid: true, message: 'Password kuat' };
};

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Parse formatted currency string to number
 * @param {string} str - Formatted string
 * @returns {number} Parsed number
 */
export const parseCurrency = (str) => {
  const cleaned = str.replace(/\D/g, '');
  return parseInt(cleaned) || 0;
};

/**
 * Format currency input
 * @param {HTMLInputElement} input - Input element
 */
export const formatCurrencyInput = (input) => {
  const value = parseCurrency(input.value);
  input.value = formatNumber(value);
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 */
export const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

/**
 * Validate form field
 * @param {HTMLInputElement} field - Form field to validate
 * @returns {boolean} True if valid
 */
export const validateField = (field) => {
  const value = field.value.trim();
  let isValid = true;
  let message = '';

  // Check required
  if (field.hasAttribute('required') && !value) {
    isValid = false;
    message = 'Field ini wajib diisi';
  }

  // Check specific validations
  if (isValid && value) {
    switch (field.type) {
      case 'email':
        if (!validateEmail(value)) {
          isValid = false;
          message = 'Format email tidak valid';
        }
        break;
      case 'tel':
        if (!validatePhone(value)) {
          isValid = false;
          message = 'Format nomor telepon tidak valid';
        }
        break;
    }

    // Custom validations
    if (field.id === 'nik' && !validateNIK(value)) {
      isValid = false;
      message = 'NIK harus 16 digit';
    }
  }

  // Show/hide error message
  const errorElement = field.parentElement.querySelector('.error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = isValid ? 'none' : 'block';
  }

  // Update field styling
  field.classList.toggle('invalid', !isValid);
  field.classList.toggle('valid', isValid && value);

  return isValid;
};

/**
 * Validate entire form
 * @param {HTMLFormElement} form - Form to validate
 * @returns {boolean} True if all fields are valid
 */
export const validateForm = (form) => {
  const fields = form.querySelectorAll('input, select, textarea');
  let isValid = true;

  fields.forEach(field => {
    if (!validateField(field)) {
      isValid = false;
    }
  });

  return isValid;
};

// Made with Bob
