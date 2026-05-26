/**
 * Authentication module
 * Handles user authentication with secure practices
 * 
 * SECURITY NOTES:
 * - Passwords are NEVER stored client-side
 * - All authentication should be handled by backend API
 * - This is a demo implementation showing proper structure
 * - In production, integrate with secure backend authentication service
 */

import { validateEmail, validatePassword, showToast, sanitizeHTML } from './utils.js';
import stateManager from './state.js';

/**
 * Simulate API call to backend authentication service
 * In production, replace with actual API calls
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request data
 * @returns {Promise} API response
 */
const apiCall = async (endpoint, data) => {
  // This is a MOCK implementation for demo purposes
  // In production, replace with actual fetch calls to your backend
  
  const apiUrl = stateManager.getState('config').apiUrl;
  
  if (!apiUrl) {
    // Demo mode - simulate API response
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate successful response
        if (endpoint === '/auth/login') {
          resolve({
            success: true,
            message: 'Login berhasil (Demo Mode)',
            user: {
              email: data.email,
              name: 'Demo User'
            },
            // In production, backend would return secure tokens
            token: 'demo_token_' + Date.now()
          });
        } else if (endpoint === '/auth/register') {
          resolve({
            success: true,
            message: 'Registrasi berhasil (Demo Mode)'
          });
        } else if (endpoint === '/auth/logout') {
          resolve({
            success: true,
            message: 'Logout berhasil'
          });
        } else {
          reject(new Error('Endpoint tidak ditemukan'));
        }
      }, 500); // Simulate network delay
    });
  }

  // Production implementation (when backend is available)
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include' // Include cookies for session management
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    throw new Error('Gagal terhubung ke server');
  }
};

/**
 * Handle user login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<boolean>} Success status
 */
export const login = async (email, password) => {
  try {
    // Validate inputs
    if (!validateEmail(email)) {
      showToast('Format email tidak valid', 'error');
      return false;
    }

    if (!password || password.length < 6) {
      showToast('Password minimal 6 karakter', 'error');
      return false;
    }

    // Call backend API
    const response = await apiCall('/auth/login', {
      email: sanitizeHTML(email),
      password // Password sent to backend only, never stored
    });

    if (response.success) {
      // Store only non-sensitive user data
      stateManager.setState('user', {
        email: response.user.email,
        name: response.user.name
      });
      stateManager.setState('isAuthenticated', true);
      stateManager.saveToSession();

      showToast(response.message, 'success');
      return true;
    } else {
      showToast(response.message || 'Login gagal', 'error');
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Terjadi kesalahan saat login', 'error');
    return false;
  }
};

/**
 * Handle user registration
 * @param {object} userData - User registration data
 * @returns {Promise<boolean>} Success status
 */
export const register = async (userData) => {
  try {
    const { name, email, password, confirmPassword } = userData;

    // Validate inputs
    if (!name || name.trim().length < 3) {
      showToast('Nama minimal 3 karakter', 'error');
      return false;
    }

    if (!validateEmail(email)) {
      showToast('Format email tidak valid', 'error');
      return false;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showToast(passwordValidation.message, 'error');
      return false;
    }

    if (password !== confirmPassword) {
      showToast('Password tidak cocok', 'error');
      return false;
    }

    // Call backend API
    const response = await apiCall('/auth/register', {
      name: sanitizeHTML(name),
      email: sanitizeHTML(email),
      password // Password sent to backend only
    });

    if (response.success) {
      showToast(response.message, 'success');
      return true;
    } else {
      showToast(response.message || 'Registrasi gagal', 'error');
      return false;
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Terjadi kesalahan saat registrasi', 'error');
    return false;
  }
};

/**
 * Handle user logout
 * @returns {Promise<boolean>} Success status
 */
export const logout = async () => {
  try {
    // Call backend API to invalidate session
    await apiCall('/auth/logout', {});

    // Clear client-side state
    stateManager.clearState();
    stateManager.clearSession();

    showToast('Logout berhasil', 'success');
    
    // Redirect to home
    window.location.href = '#home';
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Terjadi kesalahan saat logout', 'error');
    return false;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  return stateManager.getState('isAuthenticated');
};

/**
 * Get current user
 * @returns {object|null} User object or null
 */
export const getCurrentUser = () => {
  return stateManager.getState('user');
};

/**
 * Initialize authentication UI
 */
export const initAuth = () => {
  // Subscribe to authentication state changes
  stateManager.subscribe('isAuthenticated', (isAuth) => {
    updateAuthUI(isAuth);
  });

  // Initial UI update
  updateAuthUI(stateManager.getState('isAuthenticated'));
};

/**
 * Update UI based on authentication status
 * @param {boolean} isAuth - Authentication status
 */
const updateAuthUI = (isAuth) => {
  const loginBtn = document.querySelector('.btn-login');
  const registerBtn = document.querySelector('.btn-register');
  const navActions = document.querySelector('.nav-actions');

  if (!navActions) return;

  if (isAuth) {
    const user = stateManager.getState('user');
    navActions.innerHTML = `
      <span class="user-greeting">Halo, ${sanitizeHTML(user?.name || user?.email || 'User')}</span>
      <button class="btn-logout" onclick="window.authModule.logout()">Keluar</button>
    `;
  } else {
    navActions.innerHTML = `
      <button class="btn-login" onclick="window.modalModule.showLogin()">Masuk</button>
      <button class="btn-register" onclick="window.modalModule.showRegister()">Daftar</button>
    `;
  }
};

// Export for global access (needed for inline onclick handlers)
// In production, consider using event delegation instead
window.authModule = {
  login,
  logout,
  register
};

// Made with Bob
