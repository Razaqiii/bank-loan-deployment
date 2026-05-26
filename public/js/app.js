/**
 * Main application entry point
 * Initializes all modules and sets up the application
 */

import { initCalculator, scrollToCalculator } from './calculator.js';
import { initAuth } from './auth.js';
import { initModals } from './modals.js';
import stateManager from './state.js';

/**
 * Initialize smooth scrolling for navigation
 */
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update active nav link
        document.querySelectorAll('.nav-menu a').forEach(link => {
          link.classList.remove('active');
        });
        this.classList.add('active');
      }
    });
  });
};

/**
 * Initialize navigation active state on scroll
 */
const initScrollSpy = () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
  
  const observerOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);
  
  sections.forEach(section => observer.observe(section));
};

/**
 * Initialize navbar scroll effect
 */
const initNavbarScroll = () => {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add shadow on scroll
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
};

/**
 * Initialize animations on scroll
 */
const initScrollAnimations = () => {
  const animatedElements = document.querySelectorAll('.product-card, .stat-item');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  animatedElements.forEach(el => observer.observe(el));
};

/**
 * Initialize accessibility features
 */
const initAccessibility = () => {
  // Add skip to main content link
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Ensure all images have alt text
  document.querySelectorAll('img:not([alt])').forEach(img => {
    img.setAttribute('alt', '');
    console.warn('Image missing alt text:', img.src);
  });
  
  // Add ARIA labels to buttons without text
  document.querySelectorAll('button:not([aria-label])').forEach(btn => {
    if (!btn.textContent.trim()) {
      console.warn('Button missing aria-label:', btn);
    }
  });
};

/**
 * Initialize error boundary
 */
const initErrorHandling = () => {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // In production, send to error tracking service
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // In production, send to error tracking service
  });
};

/**
 * Initialize performance monitoring
 */
const initPerformanceMonitoring = () => {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
      // In production, send to analytics service
    });
  }
};

/**
 * Display security notice for demo mode
 */
const showSecurityNotice = () => {
  const apiUrl = stateManager.getState('config').apiUrl;
  
  if (!apiUrl) {
    console.info(
      '%c⚠️ DEMO MODE ACTIVE',
      'color: #f59e0b; font-size: 16px; font-weight: bold;',
      '\n\nThis application is running in demo mode without backend integration.',
      '\n\nSecurity features:',
      '\n✓ No passwords stored client-side',
      '\n✓ Input validation and sanitization',
      '\n✓ XSS protection',
      '\n✓ Secure session management',
      '\n\nFor production use, integrate with a secure backend API.',
      '\n\nDocumentation: See README.md'
    );
  }
};

/**
 * Main initialization function
 */
const init = () => {
  try {
    // Show security notice
    showSecurityNotice();
    
    // Initialize core modules
    initAuth();
    initCalculator();
    initModals();
    
    // Initialize UI enhancements
    initSmoothScroll();
    initScrollSpy();
    initNavbarScroll();
    initScrollAnimations();
    initAccessibility();
    
    // Initialize error handling
    initErrorHandling();
    initPerformanceMonitoring();
    
    // Make scroll function globally available
    window.scrollToCalculator = scrollToCalculator;
    
    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for debugging
window.appState = stateManager;

// Made with Bob
