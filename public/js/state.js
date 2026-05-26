/**
 * State management module
 * Provides centralized state management with observers
 */

class StateManager {
  constructor() {
    this.state = {
      user: null,
      isAuthenticated: false,
      loanCalculation: null,
      applications: [],
      config: {
        apiUrl: null, // Backend API URL (to be configured)
        maxLoanAmount: 1000000000,
        minLoanAmount: 10000000,
        maxTenor: 240,
        minTenor: 6
      }
    };
    this.observers = {};
  }

  /**
   * Get current state
   * @param {string} key - State key (optional)
   * @returns {any} State value
   */
  getState(key) {
    if (key) {
      return this.state[key];
    }
    return { ...this.state };
  }

  /**
   * Update state
   * @param {string} key - State key
   * @param {any} value - New value
   */
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.notify(key, value, oldValue);
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to observe
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.observers[key]) {
      this.observers[key] = [];
    }
    this.observers[key].push(callback);

    // Return unsubscribe function
    return () => {
      this.observers[key] = this.observers[key].filter(cb => cb !== callback);
    };
  }

  /**
   * Notify observers of state change
   * @param {string} key - State key
   * @param {any} newValue - New value
   * @param {any} oldValue - Old value
   */
  notify(key, newValue, oldValue) {
    if (this.observers[key]) {
      this.observers[key].forEach(callback => {
        callback(newValue, oldValue);
      });
    }
  }

  /**
   * Clear all state (logout)
   */
  clearState() {
    this.setState('user', null);
    this.setState('isAuthenticated', false);
    this.setState('loanCalculation', null);
    this.setState('applications', []);
  }

  /**
   * Load state from sessionStorage (temporary session only)
   * Note: We use sessionStorage instead of localStorage for security
   */
  loadFromSession() {
    try {
      const sessionData = sessionStorage.getItem('bankAppSession');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        // Only restore non-sensitive data
        if (parsed.isAuthenticated) {
          this.setState('isAuthenticated', true);
          this.setState('user', { email: parsed.userEmail }); // Only email, no sensitive data
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }

  /**
   * Save minimal session data
   * Note: Never store passwords or sensitive data
   */
  saveToSession() {
    try {
      const sessionData = {
        isAuthenticated: this.state.isAuthenticated,
        userEmail: this.state.user?.email || null,
        timestamp: Date.now()
      };
      sessionStorage.setItem('bankAppSession', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Clear session
   */
  clearSession() {
    sessionStorage.removeItem('bankAppSession');
  }
}

// Create singleton instance
const stateManager = new StateManager();

// Load session on initialization
stateManager.loadFromSession();

export default stateManager;

// Made with Bob
