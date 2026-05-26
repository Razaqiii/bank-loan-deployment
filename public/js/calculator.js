/**
 * Loan calculator module
 * Handles all loan calculation logic
 */

import { formatNumber, parseCurrency, showToast } from './utils.js';
import stateManager from './state.js';

/**
 * Calculate monthly loan payment using compound interest formula
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (percentage)
 * @param {number} months - Loan tenor in months
 * @returns {object} Calculation results
 */
export const calculateLoan = (principal, annualRate, months) => {
  try {
    // Validate inputs
    if (isNaN(principal) || principal <= 0) {
      throw new Error('Jumlah pinjaman tidak valid');
    }
    if (isNaN(annualRate) || annualRate < 0) {
      throw new Error('Suku bunga tidak valid');
    }
    if (isNaN(months) || months <= 0) {
      throw new Error('Jangka waktu tidak valid');
    }

    const config = stateManager.getState('config');
    
    // Validate ranges
    if (principal < config.minLoanAmount || principal > config.maxLoanAmount) {
      throw new Error(`Jumlah pinjaman harus antara Rp ${formatNumber(config.minLoanAmount)} - Rp ${formatNumber(config.maxLoanAmount)}`);
    }
    if (months < config.minTenor || months > config.maxTenor) {
      throw new Error(`Jangka waktu harus antara ${config.minTenor} - ${config.maxTenor} bulan`);
    }

    // Calculate monthly interest rate
    const monthlyRate = annualRate / 100 / 12;
    
    // Handle zero interest rate
    if (monthlyRate === 0) {
      const monthlyPayment = principal / months;
      return {
        monthlyPayment,
        totalPayment: principal,
        totalInterest: 0,
        principal,
        annualRate,
        months
      };
    }

    // Compound interest formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const x = Math.pow(1 + monthlyRate, months);
    const monthlyPayment = (principal * x * monthlyRate) / (x - 1);
    
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principal;

    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      principal,
      annualRate,
      months
    };
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
};

/**
 * Update calculator display
 * @param {object} calculation - Calculation results
 */
export const updateCalculatorDisplay = (calculation) => {
  const elements = {
    monthlyPayment: document.getElementById('monthlyPayment'),
    totalInterest: document.getElementById('totalInterest'),
    totalPayment: document.getElementById('totalPayment')
  };

  if (elements.monthlyPayment) {
    elements.monthlyPayment.textContent = `Rp ${formatNumber(calculation.monthlyPayment)}`;
  }
  if (elements.totalInterest) {
    elements.totalInterest.textContent = `Rp ${formatNumber(calculation.totalInterest)}`;
  }
  if (elements.totalPayment) {
    elements.totalPayment.textContent = `Rp ${formatNumber(calculation.totalPayment)}`;
  }

  // Save to state
  stateManager.setState('loanCalculation', calculation);
};

/**
 * Initialize calculator
 */
export const initCalculator = () => {
  const loanAmountInput = document.getElementById('loanAmount');
  const loanAmountSlider = document.getElementById('loanAmountSlider');
  const tenorInput = document.getElementById('loanTenor');
  const tenorSlider = document.getElementById('tenorSlider');
  const interestRateInput = document.getElementById('interestRate');
  const loanTypeSelect = document.getElementById('loanType');
  const calculateBtn = document.querySelector('.btn-calculate');

  if (!loanAmountInput || !tenorInput || !interestRateInput) {
    console.error('Calculator elements not found');
    return;
  }

  // Sync input with slider
  const syncLoanAmount = (value) => {
    const numValue = parseCurrency(value.toString());
    if (loanAmountInput) loanAmountInput.value = formatNumber(numValue);
    if (loanAmountSlider) loanAmountSlider.value = numValue;
    performCalculation();
  };

  const syncTenor = (value) => {
    if (tenorInput) tenorInput.value = value;
    if (tenorSlider) tenorSlider.value = value;
    performCalculation();
  };

  // Perform calculation
  const performCalculation = () => {
    try {
      const amount = parseCurrency(loanAmountInput.value);
      const tenor = parseInt(tenorInput.value);
      const rate = parseFloat(interestRateInput.value);

      const result = calculateLoan(amount, rate, tenor);
      updateCalculatorDisplay(result);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };

  // Event listeners
  if (loanAmountInput) {
    loanAmountInput.addEventListener('input', (e) => {
      syncLoanAmount(e.target.value);
    });
  }

  if (loanAmountSlider) {
    loanAmountSlider.addEventListener('input', (e) => {
      syncLoanAmount(e.target.value);
    });
  }

  if (tenorInput) {
    tenorInput.addEventListener('input', (e) => {
      syncTenor(e.target.value);
    });
  }

  if (tenorSlider) {
    tenorSlider.addEventListener('input', (e) => {
      syncTenor(e.target.value);
    });
  }

  if (interestRateInput) {
    interestRateInput.addEventListener('input', performCalculation);
  }

  if (loanTypeSelect) {
    loanTypeSelect.addEventListener('change', (e) => {
      interestRateInput.value = e.target.value;
      performCalculation();
    });
  }

  if (calculateBtn) {
    calculateBtn.addEventListener('click', performCalculation);
  }

  // Initial calculation
  performCalculation();
};

/**
 * Get loan type interest rates
 * @returns {object} Interest rates by loan type
 */
export const getLoanTypeRates = () => {
  return {
    'KPR': 5.2,
    'Kendaraan': 6.5,
    'Usaha': 7.8,
    'Pendidikan': 5.5
  };
};

/**
 * Scroll to calculator section
 */
export const scrollToCalculator = () => {
  const calculatorSection = document.getElementById('calculator');
  if (calculatorSection) {
    calculatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Made with Bob
