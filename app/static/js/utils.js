/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

window.utils = {
    /**
     * Format currency (Indian Rupees)
     */
    formatCurrency(amount) {
        if (amount === null || amount === undefined) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Format number with Indian number system
     */
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return new Intl.NumberFormat('en-IN').format(num);
    },

    /**
     * Format date and time
     */
    formatDateTime(dateString, options = {}) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        
        return date.toLocaleDateString('en-IN', { ...defaultOptions, ...options });
    },

    /**
     * Format date only
     */
    formatDate(dateString) {
        return this.formatDateTime(dateString, {
            hour: undefined,
            minute: undefined,
            hour12: undefined
        });
    },

    /**
     * Format time only
     */
    formatTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    },

    /**
     * Format duration from start and end times
     */
    formatDuration(startTime, endTime) {
        if (!startTime || !endTime) return 'N/A';
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end - start;
        
        if (diffMs < 0) return 'Invalid duration';
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    },

    /**
     * Calculate relative time (e.g., "2 hours ago")
     */
    timeAgo(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate phone number (Indian format)
     */
    isValidPhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    },

    /**
     * Validate PIN code (Indian format)
     */
    isValidPinCode(pinCode) {
        const pinRegex = /^[1-9][0-9]{5}$/;
        return pinRegex.test(pinCode);
    },

    /**
     * Validate vehicle number (basic format)
     */
    isValidVehicleNumber(vehicleNumber) {
        if (!vehicleNumber) return false;
        const cleanedNumber = vehicleNumber.replace(/\s/g, '').toUpperCase();
        return cleanedNumber.length >= 6 && cleanedNumber.length <= 12;
    },

    /**
     * Format vehicle number
     */
    formatVehicleNumber(vehicleNumber) {
        if (!vehicleNumber) return '';
        return vehicleNumber.replace(/\s/g, '').toUpperCase();
    },

    /**
     * Debounce function
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Convert to title case
     */
    toTitleCase(str) {
        if (!str) return '';
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },

    /**
     * Truncate text
     */
    truncate(text, length = 50, suffix = '...') {
        if (!text || text.length <= length) return text;
        return text.substring(0, length) + suffix;
    },

    /**
     * Get status badge class
     */
    getStatusBadgeClass(status) {
        const statusClasses = {
            'available': 'badge-success',
            'occupied': 'badge-danger',
            'reserved': 'badge-warning',
            'active': 'badge-primary',
            'completed': 'badge-success',
            'cancelled': 'badge-secondary',
            'inactive': 'badge-secondary'
        };
        return statusClasses[status?.toLowerCase()] || 'badge-secondary';
    },

    /**
     * Get status display text
     */
    getStatusText(status) {
        const statusTexts = {
            'available': 'Available',
            'occupied': 'Occupied',
            'reserved': 'Reserved',
            'active': 'Active',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'inactive': 'Inactive'
        };
        return statusTexts[status?.toLowerCase()] || this.capitalize(status);
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        // Add to toast container
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        container.appendChild(toast);

        // Initialize and show toast
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();

        // Remove toast after hide
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    },

    /**
     * Show success message
     */
    showSuccess(message, duration = 3000) {
        this.showToast(message, 'success', duration);
    },

    /**
     * Show error message
     */
    showError(message, duration = 5000) {
        this.showToast(message, 'danger', duration);
    },

    /**
     * Show warning message
     */
    showWarning(message, duration = 4000) {
        this.showToast(message, 'warning', duration);
    },

    /**
     * Show info message
     */
    showInfo(message, duration = 3000) {
        this.showToast(message, 'info', duration);
    },

    /**
     * Handle API errors consistently
     */
    handleApiError(error, context = '') {
        console.error(`API Error${context ? ` (${context})` : ''}:`, error);
        
        let message = 'An unexpected error occurred. Please try again.';
        
        if (error.message) {
            if (error.message.includes('401') || error.message.includes('token')) {
                message = 'Your session has expired. Please login again.';
            } else if (error.message.includes('403')) {
                message = 'You do not have permission to perform this action.';
            } else if (error.message.includes('404')) {
                message = 'The requested resource was not found.';
            } else if (error.message.includes('500')) {
                message = 'Server error. Please try again later.';
            } else {
                message = error.message;
            }
        }
        
        this.showError(message);
        return message;
    },

    /**
     * Format parking spot number
     */
    formatSpotNumber(spotNumber) {
        if (!spotNumber) return '';
        return spotNumber.toString().toUpperCase();
    },

    /**
     * Calculate occupancy percentage
     */
    calculateOccupancy(occupied, total) {
        if (!total || total === 0) return 0;
        return Math.round((occupied / total) * 100);
    },

    /**
     * Get occupancy status color
     */
    getOccupancyColor(percentage) {
        if (percentage >= 90) return 'danger';
        if (percentage >= 70) return 'warning';
        if (percentage >= 50) return 'info';
        return 'success';
    },

    /**
     * Local storage helpers
     */
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn('Error reading from localStorage:', error);
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn('Error writing to localStorage:', error);
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.warn('Error removing from localStorage:', error);
                return false;
            }
        }
    }
};

console.log('🔧 Utils loaded successfully');