/**
 * Register.vue.js - Registration Component
 * Handles new user registration with validation
 */

window.RegisterComponent = {
    name: 'Register',
    template: `
    <auth-layout>
        <div class="register-form">
            <!-- Header -->
            <div class="text-center mb-4">
                <h2 class="h3 text-dark fw-bold">Create Account</h2>
                <p class="text-muted">Join our parking management system</p>
            </div>

            <!-- Registration Form -->
            <form @submit.prevent="handleRegister" novalidate>
                <!-- Error Message -->
                <error-message 
                    v-if="errorMessage"
                    :message="errorMessage"
                    type="danger"
                    @dismiss="errorMessage = null"
                    class="mb-3"
                ></error-message>

                <!-- Success Message -->
                <div v-if="successMessage" class="alert alert-success mb-3" role="alert">
                    <i class="fas fa-check-circle me-2"></i>{{ successMessage }}
                </div>

                <div class="row">
                    <!-- Username -->
                    <div class="col-md-6 mb-3">
                        <label for="username" class="form-label">
                            <i class="fas fa-user me-1"></i>Username *
                        </label>
                        <input
                            type="text"
                            id="username"
                            v-model="form.username"
                            :class="getFieldClass('username')"
                            placeholder="Choose username"
                            :disabled="loading"
                            @blur="validateField('username')"
                            autocomplete="username"
                            required
                        >
                        <div v-if="errors.username" class="invalid-feedback">
                            {{ errors.username }}
                        </div>
                    </div>

                    <!-- Full Name -->
                    <div class="col-md-6 mb-3">
                        <label for="fullName" class="form-label">
                            <i class="fas fa-id-card me-1"></i>Full Name *
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            v-model="form.full_name"
                            :class="getFieldClass('full_name')"
                            placeholder="Enter full name"
                            :disabled="loading"
                            @blur="validateField('full_name')"
                            autocomplete="name"
                            required
                        >
                        <div v-if="errors.full_name" class="invalid-feedback">
                            {{ errors.full_name }}
                        </div>
                    </div>
                </div>

                <!-- Email -->
                <div class="mb-3">
                    <label for="email" class="form-label">
                        <i class="fas fa-envelope me-1"></i>Email Address *
                    </label>
                    <input
                        type="email"
                        id="email"
                        v-model="form.email"
                        :class="getFieldClass('email')"
                        placeholder="Enter email address"
                        :disabled="loading"
                        @blur="validateField('email')"
                        autocomplete="email"
                        required
                    >
                    <div v-if="errors.email" class="invalid-feedback">
                        {{ errors.email }}
                    </div>
                </div>

                <div class="row">
                    <!-- Password -->
                    <div class="col-md-6 mb-3">
                        <label for="password" class="form-label">
                            <i class="fas fa-lock me-1"></i>Password *
                        </label>
                        <div class="input-group">
                            <input
                                :type="showPassword ? 'text' : 'password'"
                                id="password"
                                v-model="form.password"
                                :class="getFieldClass('password')"
                                placeholder="Create password"
                                :disabled="loading"
                                @blur="validateField('password')"
                                @input="checkPasswordStrength"
                                autocomplete="new-password"
                                required
                            >
                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                @click="togglePassword"
                                :disabled="loading"
                            >
                                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                            </button>
                        </div>
                        <div v-if="errors.password" class="invalid-feedback d-block">
                            {{ errors.password }}
                        </div>
                        <!-- Password Strength Indicator -->
                        <div v-if="form.password" class="password-strength mt-1">
                            <div class="progress" style="height: 3px;">
                                <div 
                                    class="progress-bar" 
                                    :class="passwordStrength.class"
                                    :style="{ width: passwordStrength.width }"
                                ></div>
                            </div>
                            <small :class="passwordStrength.textClass">
                                {{ passwordStrength.text }}
                            </small>
                        </div>
                    </div>

                    <!-- Confirm Password -->
                    <div class="col-md-6 mb-3">
                        <label for="confirmPassword" class="form-label">
                            <i class="fas fa-lock me-1"></i>Confirm Password *
                        </label>
                        <input
                            :type="showPassword ? 'text' : 'password'"
                            id="confirmPassword"
                            v-model="form.confirmPassword"
                            :class="getFieldClass('confirmPassword')"
                            placeholder="Confirm password"
                            :disabled="loading"
                            @blur="validateField('confirmPassword')"
                            autocomplete="new-password"
                            required
                        >
                        <div v-if="errors.confirmPassword" class="invalid-feedback">
                            {{ errors.confirmPassword }}
                        </div>
                    </div>
                </div>

                <!-- Phone -->
                <div class="mb-3">
                    <label for="phone" class="form-label">
                        <i class="fas fa-phone me-1"></i>Phone Number *
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        v-model="form.phone"
                        :class="getFieldClass('phone')"
                        placeholder="Enter phone number (10 digits)"
                        :disabled="loading"
                        @blur="validateField('phone')"
                        @input="formatPhone"
                        autocomplete="tel"
                        maxlength="10"
                        required
                    >
                    <div v-if="errors.phone" class="invalid-feedback">
                        {{ errors.phone }}
                    </div>
                </div>

                <!-- Address -->
                <div class="mb-3">
                    <label for="address" class="form-label">
                        <i class="fas fa-map-marker-alt me-1"></i>Address *
                    </label>
                    <textarea
                        id="address"
                        v-model="form.address"
                        :class="getFieldClass('address')"
                        placeholder="Enter your address"
                        :disabled="loading"
                        @blur="validateField('address')"
                        rows="2"
                        required
                    ></textarea>
                    <div v-if="errors.address" class="invalid-feedback">
                        {{ errors.address }}
                    </div>
                </div>

                <!-- PIN Code -->
                <div class="mb-3">
                    <label for="pinCode" class="form-label">
                        <i class="fas fa-map-pin me-1"></i>PIN Code *
                    </label>
                    <input
                        type="text"
                        id="pinCode"
                        v-model="form.pin_code"
                        :class="getFieldClass('pin_code')"
                        placeholder="Enter 6-digit PIN code"
                        :disabled="loading"
                        @blur="validateField('pin_code')"
                        @input="formatPinCode"
                        maxlength="6"
                        required
                    >
                    <div v-if="errors.pin_code" class="invalid-feedback">
                        {{ errors.pin_code }}
                    </div>
                </div>

                <!-- Terms and Conditions -->
                <div class="mb-4">
                    <div class="form-check">
                        <input
                            type="checkbox"
                            id="terms"
                            v-model="form.acceptTerms"
                            :class="getCheckboxClass('acceptTerms')"
                            :disabled="loading"
                            @change="validateField('acceptTerms')"
                            required
                        >
                        <label for="terms" class="form-check-label">
                            I agree to the <a href="#" class="text-decoration-none">Terms of Service</a> and 
                            <a href="#" class="text-decoration-none">Privacy Policy</a> *
                        </label>
                        <div v-if="errors.acceptTerms" class="invalid-feedback d-block">
                            {{ errors.acceptTerms }}
                        </div>
                    </div>
                </div>

                <!-- Register Button -->
                <button
                    type="submit"
                    :class="submitButtonClass"
                    :disabled="loading || !isFormValid"
                >
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    <i v-else class="fas fa-user-plus me-2"></i>
                    {{ loading ? 'Creating Account...' : 'Create Account' }}
                </button>
            </form>

            <!-- Login Link -->
            <div class="text-center mt-4 pt-3 border-top">
                <p class="text-muted mb-0">
                    Already have an account?
                    <router-link to="/login" class="text-decoration-none fw-medium">
                        Sign in here
                    </router-link>
                </p>
            </div>
        </div>
    </auth-layout>
    `,

    data() {
        return {
            form: {
                username: '',
                full_name: '',
                email: '',
                password: '',
                confirmPassword: '',
                phone: '',
                address: '',
                pin_code: '',
                acceptTerms: false
            },
            errors: {},
            errorMessage: null,
            successMessage: null,
            loading: false,
            showPassword: false
        }
    },

    computed: {
        isFormValid() {
            const requiredFields = ['username', 'full_name', 'email', 'password', 'confirmPassword', 'phone', 'address', 'pin_code'];
            const hasAllFields = requiredFields.every(field => this.form[field]);
            const hasNoErrors = Object.keys(this.errors).length === 0;
            const termsAccepted = this.form.acceptTerms;
            
            return hasAllFields && hasNoErrors && termsAccepted;
        },

        submitButtonClass() {
            return `btn btn-primary w-100 py-2 ${this.loading ? 'disabled' : ''}`;
        },

        passwordStrength() {
            const password = this.form.password;
            if (!password) return { width: '0%', class: '', text: '', textClass: '' };

            let score = 0;
            let feedback = [];

            // Length check
            if (password.length >= 8) score += 25;
            else feedback.push('at least 8 characters');

            // Uppercase check
            if (/[A-Z]/.test(password)) score += 25;
            else feedback.push('uppercase letter');

            // Lowercase check
            if (/[a-z]/.test(password)) score += 25;
            else feedback.push('lowercase letter');

            // Number or special character check
            if (/[\d\W]/.test(password)) score += 25;
            else feedback.push('number or special character');

            if (score <= 25) {
                return {
                    width: '25%',
                    class: 'bg-danger',
                    text: 'Weak password',
                    textClass: 'text-danger'
                };
            } else if (score <= 50) {
                return {
                    width: '50%',
                    class: 'bg-warning',
                    text: 'Fair password',
                    textClass: 'text-warning'
                };
            } else if (score <= 75) {
                return {
                    width: '75%',
                    class: 'bg-info',
                    text: 'Good password',
                    textClass: 'text-info'
                };
            } else {
                return {
                    width: '100%',
                    class: 'bg-success',
                    text: 'Strong password',
                    textClass: 'text-success'
                };
            }
        }
    },

    methods: {
        /**
         * Handle registration form submission
         */
        async handleRegister() {
            if (!this.isFormValid || this.loading) return;

            this.loading = true;
            this.errorMessage = null;

            try {
                console.log('📝 Attempting registration for:', this.form.email);
                
                // Prepare registration data
                const registrationData = {
                    username: this.form.username,
                    email: this.form.email,
                    password: this.form.password,
                    full_name: this.form.full_name,
                    phone: this.form.phone,
                    address: this.form.address,
                    pin_code: this.form.pin_code
                };
                
                const response = await window.auth.register(registrationData);
                
                console.log('✅ Registration successful:', response);
                this.successMessage = `Account created successfully! Welcome, ${this.form.full_name}!`;
                
                // Clear form
                this.resetForm();
                
                // Redirect will be handled by auth service events (auto-login)
                
            } catch (error) {
                console.error('❌ Registration failed:', error);
                this.errorMessage = this.getErrorMessage(error);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Get user-friendly error message
         */
        getErrorMessage(error) {
            if (error.message.includes('Email already registered')) {
                return 'An account with this email already exists. Try signing in instead.';
            } else if (error.message.includes('Username already taken')) {
                return 'This username is already taken. Please choose a different one.';
            } else if (error.message.includes('Network')) {
                return 'Network error. Please check your connection and try again.';
            }
            return error.message || 'Registration failed. Please try again.';
        },

        /**
         * Validate individual form field
         */
        validateField(field) {
            this.errors = { ...this.errors };
            delete this.errors[field];

            switch (field) {
                case 'username':
                    if (!this.form.username) {
                        this.errors.username = 'Username is required';
                    } else if (this.form.username.length < 3) {
                        this.errors.username = 'Username must be at least 3 characters';
                    } else if (!/^[a-zA-Z0-9_]+$/.test(this.form.username)) {
                        this.errors.username = 'Username can only contain letters, numbers, and underscores';
                    }
                    break;

                case 'full_name':
                    if (!this.form.full_name) {
                        this.errors.full_name = 'Full name is required';
                    } else if (this.form.full_name.length < 2) {
                        this.errors.full_name = 'Full name must be at least 2 characters';
                    }
                    break;

                case 'email':
                    if (!this.form.email) {
                        this.errors.email = 'Email is required';
                    } else if (!this.$utils.isValidEmail(this.form.email)) {
                        this.errors.email = 'Please enter a valid email address';
                    }
                    break;

                case 'password':
                    if (!this.form.password) {
                        this.errors.password = 'Password is required';
                    } else if (this.form.password.length < 6) {
                        this.errors.password = 'Password must be at least 6 characters';
                    }
                    // Revalidate confirm password if it exists
                    if (this.form.confirmPassword) {
                        this.validateField('confirmPassword');
                    }
                    break;

                case 'confirmPassword':
                    if (!this.form.confirmPassword) {
                        this.errors.confirmPassword = 'Please confirm your password';
                    } else if (this.form.password !== this.form.confirmPassword) {
                        this.errors.confirmPassword = 'Passwords do not match';
                    }
                    break;

                case 'phone':
                    if (!this.form.phone) {
                        this.errors.phone = 'Phone number is required';
                    } else if (!this.$utils.isValidPhone(this.form.phone)) {
                        this.errors.phone = 'Please enter a valid 10-digit phone number';
                    }
                    break;

                case 'address':
                    if (!this.form.address) {
                        this.errors.address = 'Address is required';
                    } else if (this.form.address.length < 10) {
                        this.errors.address = 'Please enter a complete address';
                    }
                    break;

                case 'pin_code':
                    if (!this.form.pin_code) {
                        this.errors.pin_code = 'PIN code is required';
                    } else if (!this.$utils.isValidPinCode(this.form.pin_code)) {
                        this.errors.pin_code = 'Please enter a valid 6-digit PIN code';
                    }
                    break;

                case 'acceptTerms':
                    if (!this.form.acceptTerms) {
                        this.errors.acceptTerms = 'You must accept the terms and conditions';
                    }
                    break;
            }
        },

        /**
         * Get CSS classes for form field
         */
        getFieldClass(field) {
            const baseClass = 'form-control';
            if (this.errors[field]) {
                return `${baseClass} is-invalid`;
            } else if (this.form[field] && !this.errors[field]) {
                return `${baseClass} is-valid`;
            }
            return baseClass;
        },

        /**
         * Get CSS classes for checkbox field
         */
        getCheckboxClass(field) {
            const baseClass = 'form-check-input';
            if (this.errors[field]) {
                return `${baseClass} is-invalid`;
            } else if (this.form[field]) {
                return `${baseClass} is-valid`;
            }
            return baseClass;
        },

        /**
         * Toggle password visibility
         */
        togglePassword() {
            this.showPassword = !this.showPassword;
        },

        /**
         * Format phone number input
         */
        formatPhone() {
            // Remove non-digits
            this.form.phone = this.form.phone.replace(/\D/g, '');
            
            // Validate while typing
            if (this.form.phone) {
                this.validateField('phone');
            }
        },

        /**
         * Format PIN code input
         */
        formatPinCode() {
            // Remove non-digits
            this.form.pin_code = this.form.pin_code.replace(/\D/g, '');
            
            // Validate while typing
            if (this.form.pin_code) {
                this.validateField('pin_code');
            }
        },

        /**
         * Check password strength while typing
         */
        checkPasswordStrength() {
            // Trigger validation
            if (this.form.password) {
                this.validateField('password');
            }
        },

        /**
         * Reset form to initial state
         */
        resetForm() {
            this.form = {
                username: '',
                full_name: '',
                email: '',
                password: '',
                confirmPassword: '',
                phone: '',
                address: '',
                pin_code: '',
                acceptTerms: false
            };
            this.errors = {};
            this.errorMessage = null;
        }
    },

    mounted() {
        console.log('📝 Register component mounted');
        
        // Check if user is already logged in
        if (window.authUtils.isLoggedIn()) {
            this.$router.push(window.auth.getRedirectPath());
        }
        
        // Focus on username field
        this.$nextTick(() => {
            const usernameField = document.getElementById('username');
            if (usernameField) usernameField.focus();
        });
    }
};

// Register component globally
if (window.Vue) {
    window.Vue.createApp({}).component('register-component', window.RegisterComponent);
}