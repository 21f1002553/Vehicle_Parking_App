/**
 * Login.vue.js - Login Component
 * Handles user authentication with email and password
 */

window.LoginComponent = {
    name: 'Login',
    template: `
    <auth-layout>
        <div class="login-form">
            <!-- Header -->
            <div class="text-center mb-4">
                <h2 class="h3 text-dark fw-bold">Welcome Back</h2>
                <p class="text-muted">Sign in to your parking account</p>
            </div>

            <!-- Login Form -->
            <form @submit.prevent="handleLogin" novalidate>
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

                <!-- Email Field -->
                <div class="mb-3">
                    <label for="email" class="form-label">
                        <i class="fas fa-envelope me-1"></i>Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        v-model="form.email"
                        :class="getFieldClass('email')"
                        placeholder="Enter your email"
                        :disabled="loading"
                        @blur="validateField('email')"
                        autocomplete="email"
                        required
                    >
                    <div v-if="errors.email" class="invalid-feedback">
                        {{ errors.email }}
                    </div>
                </div>

                <!-- Password Field -->
                <div class="mb-3">
                    <label for="password" class="form-label">
                        <i class="fas fa-lock me-1"></i>Password
                    </label>
                    <div class="input-group">
                        <input
                            :type="showPassword ? 'text' : 'password'"
                            id="password"
                            v-model="form.password"
                            :class="getFieldClass('password')"
                            placeholder="Enter your password"
                            :disabled="loading"
                            @blur="validateField('password')"
                            autocomplete="current-password"
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
                </div>

                <!-- Remember Me & Forgot Password -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div class="form-check">
                        <input
                            type="checkbox"
                            id="remember"
                            v-model="form.rememberMe"
                            class="form-check-input"
                            :disabled="loading"
                        >
                        <label for="remember" class="form-check-label text-muted">
                            Remember me
                        </label>
                    </div>
                    <router-link to="/forgot-password" class="text-decoration-none small">
                        Forgot password?
                    </router-link>
                </div>

                <!-- Login Button -->
                <button
                    type="submit"
                    :class="submitButtonClass"
                    :disabled="loading || !isFormValid"
                >
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    <i v-else class="fas fa-sign-in-alt me-2"></i>
                    {{ loading ? 'Signing In...' : 'Sign In' }}
                </button>

                <!-- Demo Credentials -->
                <div class="mt-3 p-3 bg-light rounded">
                    <small class="text-muted d-block mb-2">
                        <i class="fas fa-info-circle me-1"></i>Demo Credentials:
                    </small>
                    <div class="row">
                        <div class="col-6">
                            <small class="text-muted">
                                <strong>Admin:</strong><br>
                                admin@parking.com<br>
                                admin123
                            </small>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">
                                <strong>User:</strong><br>
                                user@test.com<br>
                                user123
                            </small>
                        </div>
                    </div>
                    <div class="mt-2">
                        <button 
                            type="button" 
                            class="btn btn-sm btn-outline-primary me-2"
                            @click="fillDemoCredentials('admin')"
                            :disabled="loading"
                        >
                            Use Admin
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-sm btn-outline-secondary"
                            @click="fillDemoCredentials('user')"
                            :disabled="loading"
                        >
                            Use User
                        </button>
                    </div>
                </div>
            </form>

            <!-- Register Link -->
            <div class="text-center mt-4 pt-3 border-top">
                <p class="text-muted mb-0">
                    Don't have an account?
                    <router-link to="/register" class="text-decoration-none fw-medium">
                        Sign up here
                    </router-link>
                </p>
            </div>
        </div>
    </auth-layout>
    `,

    data() {
        return {
            form: {
                email: '',
                password: '',
                rememberMe: false
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
            return this.form.email && 
                   this.form.password && 
                   this.$utils.isValidEmail(this.form.email) &&
                   Object.keys(this.errors).length === 0;
        },

        submitButtonClass() {
            return `btn btn-primary w-100 py-2 ${this.loading ? 'disabled' : ''}`;
        }
    },

    methods: {
        /**
         * Handle login form submission
         */
        async handleLogin() {
            if (!this.isFormValid || this.loading) return;

            this.loading = true;
            this.errorMessage = null;

            try {
                console.log('🔑 Attempting login for:', this.form.email);
                
                const response = await window.auth.login(this.form.email, this.form.password);
                
                console.log('✅ Login successful:', response.user);
                this.successMessage = `Welcome back, ${response.user.full_name || response.user.username}!`;
                
                // Clear form
                this.resetForm();
                
                // Redirect will be handled by auth service events
                
            } catch (error) {
                console.error('❌ Login failed:', error);
                this.errorMessage = this.getErrorMessage(error);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Get user-friendly error message
         */
        getErrorMessage(error) {
            if (error.message.includes('Invalid credentials')) {
                return 'Invalid email or password. Please check your credentials and try again.';
            } else if (error.message.includes('Account is inactive')) {
                return 'Your account has been deactivated. Please contact support.';
            } else if (error.message.includes('Network')) {
                return 'Network error. Please check your connection and try again.';
            }
            return error.message || 'Login failed. Please try again.';
        },

        /**
         * Validate individual form field
         */
        validateField(field) {
            this.errors = { ...this.errors };
            delete this.errors[field];

            switch (field) {
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
         * Toggle password visibility
         */
        togglePassword() {
            this.showPassword = !this.showPassword;
        },

        /**
         * Fill demo credentials
         */
        fillDemoCredentials(type) {
            if (type === 'admin') {
                this.form.email = 'admin@parking.com';
                this.form.password = 'admin123';
            } else {
                this.form.email = 'user@test.com';
                this.form.password = 'user123';
            }
            
            // Clear any existing errors
            this.errors = {};
            this.errorMessage = null;
        },

        /**
         * Reset form to initial state
         */
        resetForm() {
            this.form = {
                email: '',
                password: '',
                rememberMe: false
            };
            this.errors = {};
            this.errorMessage = null;
        }
    },

    mounted() {
        console.log('🔑 Login component mounted');
        
        // Check if user is already logged in
        if (window.authUtils.isLoggedIn()) {
            this.$router.push(window.auth.getRedirectPath());
        }
        
        // Focus on email field
        this.$nextTick(() => {
            const emailField = document.getElementById('email');
            if (emailField) emailField.focus();
        });
    }
};

// Register component globally
if (window.Vue) {
    window.Vue.createApp({}).component('login-component', window.LoginComponent);
}