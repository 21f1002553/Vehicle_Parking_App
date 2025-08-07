// Enhanced initialization with better error handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Vehicle Parking System...');

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
                UserDashboard: !!window.UserDashboardComponent,
                AdminDashboard: !!window.AdminDashboardComponent,
                UserDashboardCharts: !!window.UserDashboardChartsComponent,
                AdminDashboardCharts: !!window.AdminDashboardChartsComponent,
                
                // Feature Components
                AdminParkingLots: !!window.AdminParkingLotsComponent,
                AdminUserManagement: !!window.AdminUserManagementComponent, // ADD THIS
                UserHistory: !!window.UserHistoryComponent,
                UserSpotReservation: !!window.UserSpotReservationComponent
            };

            console.log('📦 Components availability:', componentsAvailable);

            // Helper function to create placeholder component
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

            // Helper function to create dashboard component
            function createDashboardComponent(role) {
                return {
                    template: `
                        <div class="container mt-4">
                            <div class="row">
                                <div class="col-12">
                                    <div class="d-flex justify-content-between align-items-center mb-4">
                                        <h1><i class="fas fa-tachometer-alt me-2"></i>${role === 'admin' ? 'Admin' : 'User'} Dashboard</h1>
                                        <button @click="logout" class="btn btn-outline-danger">
                                            <i class="fas fa-sign-out-alt me-2"></i>Logout
                                        </button>
                                    </div>
                                    
                                    <div class="alert alert-info">
                                        <p class="mb-0">Welcome to your dashboard!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    methods: {
                        logout() {
                            window.auth?.logout();
                            this.$router.push('/login');
                        }
                    }
                };
            }

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
                    component: window.LoginComponent || createPlaceholderComponent('Login', 'Login component'),
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
                    component: window.RegisterComponent || createPlaceholderComponent('Register', 'Register component')
                },
           
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
                    name:'user-analytics',
                    component: window.UserDashboardChartsComponent || createPlaceholderComponent('User Analytics', 'Analytics'),
                    meta: { requiresAuth: true, role: 'user' }
                },
                
                // Admin Routes
                { 
                    path: '/admin/dashboard', 
                    name: 'admin-dashboard',
                    component: window.AdminDashboardComponent || createDashboardComponent('admin'), 
                    meta: { requiresAuth: true, role: 'admin' }
                },
                { 
                    path: '/admin/lots', 
                    name: 'admin-lots',
                    component: window.AdminParkingLotsComponent || createPlaceholderComponent('Manage Parking Lots', 'Parking lots management will appear here.'),  
                    meta: { requiresAuth: true, role: 'admin' }
                },
                // ADD THIS ROUTE FOR ADMIN USERS
                { 
                    path: '/admin/users', 
                    name: 'admin-users',
                    component: window.AdminUserManagementComponent || createPlaceholderComponent('Manage Users', 'User management will appear here.'),  
                    meta: { requiresAuth: true, role: 'admin' }
                },
                { 
                    path: '/admin/analytics',
                    name: 'admin-analytics',
                    component: window.AdminDashboardChartsComponent || createPlaceholderComponent('Admin Analytics', 'Analytics'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                
                // Catch-all route for 404
                {
                    path: '/:pathMatch(.*)*',
                    component: createPlaceholderComponent('404 Not Found', 'The page you are looking for does not exist.')
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
                        loaded: true
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

// Helper functions
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

console.log('✅ Enhanced main.js loaded with admin users route');