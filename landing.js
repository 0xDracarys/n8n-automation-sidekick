// Landing Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeNavigation();
    initializeAnimations();
    initializeDemo();
    initializePricing();
    initializeScrollEffects();
    initializeWorkflowBuilder();
});

// Navigation
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animations
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements
    document.querySelectorAll('.feature-card, .step-card, .testimonial-card, .pricing-card').forEach(el => {
        observer.observe(el);
    });
    
    // Counter animation for stats
    const stats = document.querySelectorAll('.stat-number');
    const statObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = target.textContent;
                animateCounter(target, finalValue);
                statObserver.unobserve(target);
            }
        });
    }, observerOptions);
    
    stats.forEach(stat => statObserver.observe(stat));
}

function animateCounter(element, finalValue) {
    const duration = 2000;
    const start = 0;
    const end = parseInt(finalValue.replace(/\D/g, ''));
    const increment = end / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        
        if (finalValue.includes('K+')) {
            element.textContent = (current / 1000).toFixed(0) + 'K+';
        } else if (finalValue.includes('★')) {
            element.textContent = '4.9★';
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Demo Functionality
function initializeDemo() {
    const demoTabs = document.querySelectorAll('.demo-tab-btn');
    const demoScreens = document.querySelectorAll('.demo-screen');
    
    if (demoTabs.length === 0) return;
    
    demoTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetDemo = this.dataset.demo;
            
            // Update tabs
            demoTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update screens
            demoScreens.forEach(screen => {
                screen.classList.remove('active');
                if (screen.id === `${targetDemo}-demo`) {
                    screen.classList.add('active');
                }
            });
        });
    });
    
    // Generate button animation
    const generateBtn = document.querySelector('.demo-generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            this.disabled = true;
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-check"></i> Generated!';
                this.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-magic"></i> Generate Workflow';
                    this.disabled = false;
                    this.style.background = '';
                }, 2000);
            }, 2000);
        });
    }
}

// Pricing
function initializePricing() {
    const pricingBtns = document.querySelectorAll('.pricing-btn');
    
    pricingBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const plan = this.textContent.trim();
            
            // Track pricing clicks
            if (typeof gtag !== 'undefined') {
                gtag('event', 'pricing_click', {
                    'plan': plan
                });
            }
            
            // Add ripple effect
            createRipple(this, event);
        });
    });
}

// Scroll Effects
function initializeScrollEffects() {
    // Parallax effect for hero section
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            heroBg.style.transform = `translateY(${parallax}px)`;
        });
    }
    
    // Floating animation for hero badge
    const heroBadge = document.querySelector('.hero-badge');
    if (heroBadge) {
        setInterval(() => {
            heroBadge.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                heroBadge.style.transform = 'translateY(0px)';
            }, 1500);
        }, 3000);
    }
}

// Utility Functions
function createRipple(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple CSS
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .btn-primary, .btn-secondary, .pricing-btn {
        position: relative;
        overflow: hidden;
    }
    
    .nav-menu.active {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        padding: 24px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        border-radius: 0 0 16px 16px;
    }
    
    .nav-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .nav-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .nav-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
`;
document.head.appendChild(style);

// Analytics (placeholder)
function trackEvent(eventName, properties = {}) {
    console.log('Analytics Event:', eventName, properties);
    // Add your analytics code here
    // Example: gtag('event', eventName, properties);
}

// Track button clicks
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn-primary, .nav-cta')) {
        trackEvent('cta_click', {
            'button_text': e.target.textContent.trim(),
            'location': window.location.pathname
        });
    }
});

// Form validation (for future contact forms)
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

// Add error styles
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    input.error, textarea.error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
`;
document.head.appendChild(errorStyles);

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Close demo notice function
function closeDemoNotice() {
    const notice = document.getElementById('demoNotice');
    if (notice) {
        notice.style.display = 'none';
        localStorage.setItem('demoNoticeClosed', 'true');
    }
}

// Check if demo notice was previously closed
if (localStorage.getItem('demoNoticeClosed') === 'true') {
    const notice = document.getElementById('demoNotice');
    if (notice) {
        notice.style.display = 'none';
    }
}

// Make closeDemoNotice global
window.closeDemoNotice = closeDemoNotice;

// Optimize scroll events
const optimizedScroll = debounce(function() {
    // Scroll-based animations
}, 10);

window.addEventListener('scroll', optimizedScroll);

// Lazy loading for images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
lazyLoadImages();

// Add loading states
function addLoadingState(element) {
    element.disabled = true;
    element.dataset.originalText = element.textContent;
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
}

function removeLoadingState(element) {
    element.disabled = false;
    element.textContent = element.dataset.originalText;
}

// Tooltips
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.dataset.tooltip;
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        });
        
        element.addEventListener('mouseleave', function() {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) tooltip.remove();
        });
    });
}

// Add tooltip styles
const tooltipStyles = document.createElement('style');
tooltipStyles.textContent = `
    .tooltip {
        position: absolute;
        background: #1a202c;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
        animation: tooltip-fade-in 0.2s ease;
    }
    
    .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: #1a202c;
    }
    
    @keyframes tooltip-fade-in {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(tooltipStyles);

// Initialize tooltips
initializeTooltips();

// Workflow Builder
function initializeWorkflowBuilder() {
    // Check if user is authenticated and initialize builder
    const builderContainer = document.getElementById('webBuilderContainer');
    const loginPrompt = document.getElementById('builderLoginPrompt');
    
    if (builderContainer && loginPrompt) {
        // Check authentication status
        const isAuthenticated = checkAuthenticationStatus();
        
        if (isAuthenticated) {
            // Hide login prompt and initialize builder
            loginPrompt.style.display = 'none';
            initializeWebBuilder();
        } else {
            // Show login prompt
            loginPrompt.style.display = 'flex';
        }
    }
}

function checkAuthenticationStatus() {
    // Check if user is logged in using Firebase Auth
    if (window.authManager && window.authManager.getCurrentUser) {
        return window.authManager.getCurrentUser() !== null;
    }
    
    // Fallback to localStorage check for migration
    const storedUser = localStorage.getItem('demoUser');
    const authFlag = localStorage.getItem('userAuthenticated');
    
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.email) {
                return true;
            }
        } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('demoUser');
        }
    }
    
    return authFlag === 'true';
}

function initializeWebBuilder() {
    const builderContainer = document.getElementById('webBuilderContainer');
    const loginPrompt = document.getElementById('builderLoginPrompt');
    
    console.log('🔧 Initializing web builder...');
    console.log('Builder container:', !!builderContainer);
    console.log('WebWorkflowBuilder available:', typeof WebWorkflowBuilder !== 'undefined');
    console.log('Login prompt:', !!loginPrompt);
    
    if (builderContainer && typeof WebWorkflowBuilder !== 'undefined') {
        // Clear any existing content first
        builderContainer.innerHTML = '';
        
        // Create new builder
        window.webBuilder = new WebWorkflowBuilder('webBuilderContainer');
        console.log('✅ Web workflow builder initialized successfully');
        
        // Hide login prompt if it's still visible
        if (loginPrompt) {
            loginPrompt.style.display = 'none';
        }
    } else {
        console.error('❌ Failed to initialize builder');
        console.error('- Builder container missing:', !builderContainer);
        console.error('- WebWorkflowBuilder class missing:', typeof WebWorkflowBuilder === 'undefined');
    }
}

// Add manual trigger for debugging
window.forceInitializeBuilder = function() {
    console.log('🔧 Force initializing builder...');
    const isAuthenticated = checkAuthenticationStatus();
    console.log('Authentication status:', isAuthenticated);
    
    if (isAuthenticated) {
        initializeWebBuilder();
    } else {
        console.log('❌ User not authenticated');
    }
};

// Add debugging function
window.debugAuthStatus = function() {
    console.log('🔍 Authentication Debug Info:');
    console.log('- demoUser exists:', !!localStorage.getItem('demoUser'));
    console.log('- userAuthenticated flag:', localStorage.getItem('userAuthenticated'));
    console.log('- AuthManager user:', !!window.authManager?.getCurrentUser());
    console.log('- AuthManager isAuthenticated:', window.authManager?.isAuthenticated());
    console.log('- Combined check:', checkAuthenticationStatus());
    
    const user = localStorage.getItem('demoUser');
    if (user) {
        try {
            console.log('- Parsed user:', JSON.parse(user));
        } catch (e) {
            console.log('- Error parsing user:', e.message);
        }
    }
};

// Console welcome message
console.log('%c🚀 n8n Automation Sidekick', 'font-size: 20px; font-weight: bold; color: #FF6D5A;');
console.log('%cBuild workflows 10x faster with AI!', 'font-size: 14px; color: #4a5568;');
console.log('%chttps://github.com/your-repo/n8n-automation-sidekick', 'font-size: 12px; color: #718096;');
