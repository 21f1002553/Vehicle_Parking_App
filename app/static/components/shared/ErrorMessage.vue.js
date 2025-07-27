/**
 * ErrorMessage.vue.js - Reusable Error Message Component
 */

window.ErrorMessageComponent = {
    name: 'ErrorMessage',
    props: {
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            default: 'danger',
            validator: value => ['danger', 'warning', 'info'].includes(value)
        },
        dismissible: {
            type: Boolean,
            default: true
        },
        icon: {
            type: String,
            default: null
        }
    },
    
    emits: ['dismiss'],
    
    template: `
    <div v-if="message" :class="alertClasses" role="alert">
        <div class="d-flex align-items-center">
            <i v-if="iconClass" :class="iconClass + ' me-2'"></i>
            <div class="flex-grow-1">{{ message }}</div>
            <button 
                v-if="dismissible"
                type="button" 
                class="btn-close" 
                @click="$emit('dismiss')"
                aria-label="Close"
            ></button>
        </div>
    </div>
    `,
    
    computed: {
        alertClasses() {
            return `alert alert-${this.type} ${this.dismissible ? 'alert-dismissible' : ''} fade show`;
        },
        
        iconClass() {
            if (this.icon) return this.icon;
            
            const iconMap = {
                danger: 'fas fa-exclamation-triangle',
                warning: 'fas fa-exclamation-circle',
                info: 'fas fa-info-circle'
            };
            
            return iconMap[this.type];
        }
    }
};

// Register component globally
if (window.Vue) {
    window.Vue.createApp({}).component('error-message', window.ErrorMessageComponent);
}