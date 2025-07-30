/**
 * Main Vue.js Application - Updated with FallbackDashboard
 */

// Enhanced initialization with better error handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing Vehicle Parking System...');

    // Check for required libraries with fallbacks
    if (!window.Vue) {
        console.error('❌ Vue.js not loaded!');
        showInitializationError('Vue.js library failed to load');
        return;
    }
    
    if (!window.VueRouter) {
        console.error('❌ Vue Router not loaded!');
        showInitializationError('Vue Router library failed to load');
        return;
    }

    const { createApp } = Vue;
    const { createRouter, createWebHistory } = VueRouter;

    // Wait for components to load
    setTimeout(() => {
        try {
            updateDebug('vue-status', '✅ Ready');
            updateLoadingMessage('Creating application...');

            // Check which components are available
            const componentsAvailable = {
                // Auth Components
                LoginComponent: !!window.LoginComponent,
                RegisterComponent: !!window.RegisterComponent,
                AuthLayoutComponent: !!window.AuthLayoutComponent,
                
                // Shared Components
                ErrorMessageComponent: !!window.ErrorMessageComponent,
                LoadingSpinnerComponent: !!window.LoadingSpinnerComponent,
                CostCalculationComponent: !!window.CostCalculationComponent,
                HistoryReportsComponent: !!window.HistoryReportsComponent,
                
                // Dashboard Components
                UserDashboard: !!window.UserDashboard,
                AdminDashboard: !!window.AdminDashboard,
                UserDashboardCharts: !!window.UserDashboardCharts,
                AdminDashboardCharts: !!window.AdminDashboardCharts,
                
                // Feature Components
                AdminParkingLots: !!window.AdminParkingLots,
                UserHistory: !!window.UserHistory,
                UserSpotReservation: !!window.UserSpotReservation
            };

            console.log('📦 Components availability:', componentsAvailable);
            updateDebug('components-status', `✅ ${Object.values(componentsAvailable).filter(Boolean).length}/12 Loaded`);

            // Create fallback dashboard component (moved from HTML template)
            const FallbackDashboard = {
                template: `
                    <div class="container mt-4">
                        <div class="row">
                            <div class="col-12">
                                <div class="d-flex justify-content-between align-items-center mb-4">
                                    <h1><i class="fas fa-tachometer-alt me-2"></i>{{title}}</h1>
                                    <button @click="logout" class="btn btn-outline-danger">
                                        <i class="fas fa-sign-out-alt me-2"></i>Logout
                                    </button>
                                </div>
                                
                                <div class="alert alert-success">
                                    <h5><i class="fas fa-check-circle me-2"></i>All Components Loaded!</h5>
                                    <p class="mb-0">Your Vehicle Parking System is ready. Components loaded: {{componentCount}}/12</p>
                                </div>

                                <!-- Quick Stats -->
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h5><i class="fas fa-database me-2"></i>Available Parking Lots</h5>
                                                <div v-if="parkingLots.length > 0">
                                                    <div v-for="lot in parkingLots" :key="lot.id" class="mb-2">
                                                        <strong>{{lot.name}}</strong> - ₹{{lot.price_per_hour}}/hour<br>
                                                        <small class="text-muted">{{lot.available_spots}}/{{lot.total_spots}} spots available</small>
                                                    </div>
                                                </div>
                                                <div v-else>
                                                    <button @click="loadParkingLots" class="btn btn-primary btn-sm">
                                                        <i class="fas fa-sync me-1"></i>Load Parking Lots
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card">
                                            <div class="card-body">
                                                <h5><i class="fas fa-user me-2"></i>Your Profile</h5>
                                                <div v-if="userProfile">
                                                    <p><strong>Name:</strong> {{userProfile.full_name}}</p>
                                                    <p><strong>Email:</strong> {{userProfile.email}}</p>
                                                    <p><strong>Role:</strong> <span v-if="userProfile.is_admin">Administrator</span><span v-else>Standard User</span></p>
                                                    <p class="mb-0"><strong>Status:</strong> <span v-if="userProfile.is_active" class="text-success">Active</span><span v-else class="text-danger">Inactive</span></p>
                                                </div>
                                                <div v-else>
                                                    <button @click="loadProfile" class="btn btn-primary btn-sm">
                                                        <i class="fas fa-sync me-1"></i>Load Profile
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Component Status -->
                                <div class="row">
                                    <div class="col-12">
                                        <div class="card">
                                            <div class="card-header">
                                                <h5><i class="fas fa-puzzle-piece me-2"></i>Component Status</h5>
                                            </div>
                                            <div class="card-body">
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <h6>✅ Loaded Components:</h6>
                                                        <ul class="small">
                                                            <li v-for="(loaded, name) in componentsAvailable" v-if="loaded" :key="name">
                                                                {{name}}
                                                            </li>
                                                        </ul>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <h6>Available Actions:</h6>
                                                        <div class="btn-group-vertical d-grid gap-2" v-if="userProfile">
                                                            <router-link v-if="userProfile.is_admin" to="/admin/lots" class="btn btn-outline-primary btn-sm">
                                                                <i class="fas fa-building me-1"></i>Manage Parking Lots
                                                            </router-link>
                                                            <router-link v-if="userProfile.is_admin" to="/admin/analytics" class="btn btn-outline-success btn-sm">
                                                                <i class="fas fa-chart-bar me-1"></i>View Analytics
                                                            </router-link>
                                                            <router-link v-if="!userProfile.is_admin" to="/user/reserve" class="btn btn-outline-primary btn-sm">
                                                                <i class="fas fa-car me-1"></i>Reserve Parking
                                                            </router-link>
                                                            <router-link v-if="!userProfile.is_admin" to="/user/history" class="btn btn-outline-info btn-sm">
                                                                <i class="fas fa-history me-1"></i>View History
                                                            </router-link>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div class="mt-3 text-center">
                                                    <a href="/api-test" class="btn btn-outline-secondary me-2">
                                                        <i class="fas fa-flask me-1"></i>API Test Suite
                                                    </a>
                                                    <button @click="testComponentLoad" class="btn btn-outline-info">
                                                        <i class="fas fa-bug me-1"></i>Debug Components
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                data() {
                    return {
                        parkingLots: [],
                        userProfile: null,
                        componentCount: Object.values(componentsAvailable).filter(Boolean).length,
                        componentsAvailable: componentsAvailable
                    }
                },
                computed: {
                    title() {
                        return window.authUtils?.isAdmin() ? 'Admin Dashboard' : 'User Dashboard';
                    }
                },
                async mounted() {
                    console.log('📊 Dashboard mounted');
                    updateDebug('current-route', `✅ ${this.$route.path}`);
                    
                    // Auto-load data
                    await this.loadProfile();
                    await this.loadParkingLots();
                },
                methods: {
                    async loadProfile() {
                        try {
                            const response = await window.api.getProfile();
                            this.userProfile = response.user;
                        } catch (error) {
                            console.error('Failed to load profile:', error);
                        }
                    },
                    async loadParkingLots() {
                        try {
                            const response = await window.api.getParkingLots();
                            this.parkingLots = response.parking_lots || [];
                        } catch (error) {
                            console.error('Failed to load parking lots:', error);
                        }
                    },
                    testComponentLoad() {
                        console.log('🧪 Component Test Results:', componentsAvailable);
                        alert(`Components Status:\n${Object.entries(componentsAvailable).map(([name, loaded]) => `${name}: ${loaded ? '✅' : '❌'}`).join('\n')}`);
                    },
                    logout() {
                        window.auth?.logout();
                        this.$router.push('/login');
                    }
                }
            };

            // Define routes with your actual components
            const routes = [
                { 
                    path: '/', 
                    redirect: () => {
                        return window.authUtils?.isLoggedIn() 
                            ? (window.authUtils.isAdmin() ? '/admin/dashboard' : '/user/dashboard')
                            : '/login';
                    }
                },
                { 
                    path: '/login', 
                    component: window.LoginComponent || FallbackDashboard,
                    beforeEnter: (to, from, next) => {
                        if (window.authUtils?.isLoggedIn()) {
                            next('/');
                        } else {
                            next();
                        }
                    }
                },
                { 
                    path: '/register', 
                    component: window.RegisterComponent || FallbackDashboard
                },
                // Find this section in your routes array
                { 
                    path: '/user/dashboard', 
                    name: 'user-dashboard',
                    component: window.UserDashboardComponent || createDashboardComponent('user'),
                    meta: { requiresAuth: true, role: 'user' }
                },

                { 
                    path: '/user/reserve', 
                    name: 'user-reserve',
                    component: window.UserSpotReservationComponent || createPlaceholderComponent('Reserve Parking', 'Reservation system will appear here.'),
                    meta: { requiresAuth: true, role: 'user' }
                },

                { 
                    path: '/user/history', 
                    name: 'user-history',
                    component: window.UserHistoryComponent || createPlaceholderComponent('Parking History', 'Your parking history will appear here.'),
                    meta: { requiresAuth: true, role: 'user' }
                },
                { 
                    path: '/user/analytics', 
                    component: window.UserDashboardCharts || FallbackDashboard,
                    meta: { requiresAuth: true }
                },
                { 
                    path: '/admin/dashboard', 
                    component: window.AdminDashboard || FallbackDashboard,
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                { 
                    path: '/admin/lots', 
                    component: window.AdminParkingLots || FallbackDashboard,
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                { 
                    path: '/admin/analytics', 
                    component: window.AdminDashboardCharts || FallbackDashboard,
                    meta: { requiresAuth: true, requiresAdmin: true }
                }
            ];

            // Create router
            const router = createRouter({
                history: createWebHistory(),
                routes
            });

            // Router guards
            router.beforeEach((to, from, next) => {
                console.log(`🧭 Navigation: ${from.path} → ${to.path}`);
                
                if (to.meta.requiresAuth && !window.authUtils?.isLoggedIn()) {
                    next('/login');
                } else if (to.meta.requiresAdmin && !window.authUtils?.isAdmin()) {
                    next('/user/dashboard');
                } else {
                    next();
                }
            });

            router.afterEach((to) => {
                updateDebug('current-route', `✅ ${to.path}`);
            });

            updateDebug('router-status', '✅ Ready');

            // Create Vue app
            const app = createApp({
                data() {
                    return {
                        appReady: false,
                        currentUser: null,
                        isAuthenticated: false,
                        loading: false,
                        error: null,
                        initializationComplete: false,
                        loaded: true  // Add this line to fix the warning
                    }
                },
                mounted() {
                    console.log('📱 Vue app mounted with ALL components!');
                    updateLoadingMessage('Application ready!');
                    
                    setTimeout(() => {
                        hideLoading();
                    }, 1500);
                }
            });

            // Register global components if available
            if (window.ErrorMessageComponent) {
                app.component('error-message', window.ErrorMessageComponent);
            }
            if (window.LoadingSpinnerComponent) {
                app.component('loading-spinner', window.LoadingSpinnerComponent);
            }
            if (window.AuthLayoutComponent) {
                app.component('auth-layout', window.AuthLayoutComponent);
            }

            // Global properties
            app.config.globalProperties.$auth = window.auth;
            app.config.globalProperties.$api = window.api;
            app.config.globalProperties.$utils = window.utils;

            app.use(router);
            app.mount('#app');

            console.log('✅ Application started with ALL components integrated!');
            updateLoadingMessage('Ready!');

        } catch (error) {
            console.error('💥 Application startup failed:', error);
            showInitializationError(error.message);
        }
    }, 1000); // Give components time to load
});

// Helper functions (rest of your existing main.js functions)
function createFallbackComponent(componentName) {
    return {
        template: `
            <div class="auth-layout">
                <div class="auth-form-wrapper">
                    <div class="card" style="max-width: 400px; width: 100%;">
                        <div class="card-body text-center p-4">
                            <div class="alert alert-warning">
                                <h4><i class="fas fa-exclamation-triangle me-2"></i>${componentName} Component</h4>
                                <p>The ${componentName} component is not available.</p>
                                <p class="small mb-0">Please check if the component file exists and is properly loaded.</p>
                            </div>
                            <router-link to="/" class="btn btn-primary">
                                <i class="fas fa-home me-2"></i>Go Home
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        `
    };
}

function createPlaceholderComponent(title, description) {
    return {
        template: `
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-body text-center p-5">
                                <h2><i class="fas fa-construction me-2"></i>${title}</h2>
                                <p class="text-muted">${description}</p>
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    This feature is under development and will be available soon.
                                </div>
                                <router-link to="/" class="btn btn-primary">
                                    <i class="fas fa-arrow-left me-2"></i>Back to Dashboard
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    };
}

function createNotFoundComponent() {
    return {
        template: `
            <div class="container text-center mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body p-5">
                                <div class="alert alert-warning">
                                    <h1><i class="fas fa-exclamation-triangle me-2"></i>404</h1>
                                    <h4>Page Not Found</h4>
                                    <p>The page you're looking for doesn't exist.</p>
                                    <router-link to="/" class="btn btn-primary">
                                        <i class="fas fa-home me-2"></i>Go Home
                                    </router-link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    };
}

// Enhanced error display function
function showInitializationError(message) {
    console.error('Initialization Error:', message);
    
    try {
        const errorState = document.getElementById('error-state');
        const errorDetails = document.getElementById('error-details');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        if (loadingSpinner) loadingSpinner.classList.add('d-none');
        if (errorState) errorState.classList.remove('d-none');
        if (errorDetails) errorDetails.textContent = message;
        
        // Update loading status
        if (typeof updateLoadingStatus === 'function') {
            updateLoadingStatus('❌ Initialization failed');
        }
    } catch (error) {
        console.error('Error displaying initialization error:', error);
    }
}

// Status update function (defined globally for use in template)
function updateLoadingStatus(message) {
    try {
        const loadingStatus = document.getElementById('loading-status');
        if (loadingStatus) {
            loadingStatus.textContent = message;
            console.log('📱', message);
        }
    } catch (error) {
        console.warn('Error updating loading status:', error);
    }
}

// Global unhandled error handlers
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (typeof showInitializationError === 'function') {
        showInitializationError(`JavaScript Error: ${event.error?.message || 'Unknown error'}`);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (typeof showInitializationError === 'function') {
        showInitializationError(`Promise Rejection: ${event.reason}`);
    }
});

console.log('✅ Enhanced main.js loaded with separated Vue.js components');