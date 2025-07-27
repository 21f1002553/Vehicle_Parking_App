/**
 * LoadingSpinner.vue.js - Reusable Loading Spinner Component
 */

window.LoadingSpinnerComponent = {
    name: 'LoadingSpinner',
    props: {
        size: {
            type: String,
            default: 'md', // sm, md, lg
            validator: value => ['sm', 'md', 'lg'].includes(value)
        },
        color: {
            type: String,
            default: 'primary'
        },
        text: {
            type: String,
            default: null
        },
        overlay: {
            type: Boolean,
            default: false
        }
    },
    
    template: `
    <div :class="spinnerClasses">
        <div :class="spinnerSizeClass" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div v-if="text" class="mt-2 text-muted">{{ text }}</div>
    </div>
    `,
    
    computed: {
        spinnerClasses() {
            const classes = [];
            
            if (this.overlay) {
                classes.push('loading-overlay d-flex flex-column justify-content-center align-items-center');
            } else {
                classes.push('text-center');
            }
            
            return classes.join(' ');
        },
        
        spinnerSizeClass() {
            const baseClass = `spinner-border text-${this.color}`;
            
            const sizeClasses = {
                sm: 'spinner-border-sm',
                md: '',
                lg: 'spinner-border-lg'
            };
            
            return `${baseClass} ${sizeClasses[this.size] || ''}`.trim();
        }
    }
};

// Register component globally
if (window.Vue) {
    window.Vue.createApp({}).component('loading-spinner', window.LoadingSpinnerComponent);
}