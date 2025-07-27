/**
 * Main Vue.js Application Initialization
 * Entry point for the Vehicle Parking System frontend
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Vehicle Parking System...');

    // Create Vue application
    const { createApp } = Vue;
    const { createRouter, createWebHistory } = VueRouter;

    // Application instance
    const app = createApp({
        data() {
            return {
                appReady: false,
                currentUser: null,
                isAuthenticated: false,
                loading: false,
                error: null
            }
        },

        async mounted() {
            console.log('📱 Vue app mounted');
            await this.initializeApp();
        },

        methods: {
            async initializeApp() {
                try {
                    console.log('🔧 Initializing application...');
                    
                    // Wait for auth service to initialize
                    if (window.auth.token) {
                        await window.auth.initializeAuth();
                    }
                    
                    // Set initial auth state
                    this.updateAuthState();
                    
                    // Setup auth event listeners
                    this.setupAuthListeners();
                    
                    // Check API health
                    await this.checkApiHealth();
                    
                    this.appReady = true;
                    console.log('✅ Application initialized successfully');
                    
                } catch (error) {
                    console.error('❌ Failed to initialize application:', error);
                    this.error = 'Failed to initialize application. Please refresh the page.';
                }
            },

            async checkApiHealth() {
                try {
                    await window.api.healthCheck();
                    console.log('💚 API health check passed');
                } catch (error) {
                    console.warn('💔 API health check failed:', error);
                    // Don't block app initialization for health check failure
                }
            },

            updateAuthState() {
                this.currentUser = window.auth.currentUser;
                this.isAuthenticated = window.auth.isAuthenticated;
            },

            setupAuthListeners() {
                // Listen for auth state changes
                window.addEventListener('user-updated', (event) => {
                    console.log('👤 User updated:', event.detail.user);
                    this.updateAuthState();
                });

                window.addEventListener('auth-cleared', () => {
                    console.log('🔓 Auth cleared');
                    this.updateAuthState();
                    this.$router.push('/login');
                });

                window.addEventListener('login-success', (event) => {
                    console.log('✅ Login successful:', event.detail.user);
                    this.updateAuthState();
                    
                    // Redirect based on user role
                    const redirectPath = window.auth.getRedirectPath();
                    this.$router.push(redirectPath);
                    
                    window.utils.showSuccess(`Welcome, ${window.auth.getUserDisplayName()}!`);
                });

                window.addEventListener('logout', () => {
                    console.log('👋 User logged out');
                    this.updateAuthState();
                    this.$router.push('/login');
                    window.utils.showInfo('You have been logged out successfully');
                });
            },

            // Global error handler
            handleError(error, context = '') {
                console.error('App Error:', error);
                const message = window.utils.handleApiError(error, context);
                this.error = message;
            }
        },

        // Global computed properties
        computed: {
            isAdmin() {
                return window.authUtils.isAdmin();
            },
            
            isUser() {
                return window.authUtils.isUser();
            },
            
            userName() {
                return window.authUtils.getUserName();
            }
        }
    });

    // Define routes
    const routes = [
        // Public routes
        { 
            path: '/', 
            name: 'home',
            component: { template: '<div>Home Page - Redirecting...</div>' },
            beforeEnter: (to, from, next) => {
                // Redirect to appropriate dashboard based on auth state
                if (window.authUtils.isLoggedIn()) {
                    if (window.authUtils.isAdmin()) {
                        next('/admin/dashboard');
                    } else {
                        next('/user/dashboard');
                    }
                } else {
                    next('/login');
                }
            }
        },
        
        // Auth routes
        { 
            path: '/login', 
            name: 'login',
            component: { template: '<login-component></login-component>' },
            beforeEnter: (to, from, next) => {
                if (window.authUtils.isLoggedIn()) {
                    next(window.auth.getRedirectPath());
                } else {
                    next();
                }
            }
        },
        { 
            path: '/register', 
            name: 'register',
            component: { template: '<register-component></register-component>' },
            beforeEnter: (to, from, next) => {
                if (window.authUtils.isLoggedIn()) {
                    next(window.auth.getRedirectPath());
                } else {
                    next();
                }
            }
        },

        // User routes
        { 
            path: '/user/dashboard', 
            name: 'user-dashboard',
            component: { template: '<user-dashboard-component></user-dashboard-component>' },
            meta: { requiresAuth: true, role: 'user' }
        },
        { 
            path: '/user/parking-lots', 
            name: 'user-parking-lots',
            component: { template: '<parking-lots-component></parking-lots-component>' },
            meta: { requiresAuth: true, role: 'user' }
        },
        { 
            path: '/user/history', 
            name: 'user-history',
            component: { template: '<parking-history-component></parking-history-component>' },
            meta: { requiresAuth: true, role: 'user' }
        },
        { 
            path: '/user/analytics', 
            name: 'user-analytics',
            component: { template: '<user-dashboard-charts></user-dashboard-charts>' },
            meta: { requiresAuth: true, role: 'user' }
        },

        // Admin routes
        { 
            path: '/admin/dashboard', 
            name: 'admin-dashboard',
            component: { template: '<admin-dashboard-component></admin-dashboard-component>' },
            meta: { requiresAuth: true, role: 'admin' }
        },
        { 
            path: '/admin/lots', 
            name: 'admin-lots',
            component: { template: '<lot-management-component></lot-management-component>' },
            meta: { requiresAuth: true, role: 'admin' }
        },
        { 
            path: '/admin/users', 
            name: 'admin-users',
            component: { template: '<user-management-component></user-management-component>' },
            meta: { requiresAuth: true, role: 'admin' }
        },
        { 
            path: '/admin/reservations', 
            name: 'admin-reservations',
            component: { template: '<reservation-management-component></reservation-management-component>' },
            meta: { requiresAuth: true, role: 'admin' }
        },
        { 
            path: '/admin/analytics', 
            name: 'admin-analytics',
            component: { template: '<admin-dashboard-charts></admin-dashboard-charts>' },
            meta: { requiresAuth: true, role: 'admin' }
        },

        // 404 route
        { 
            path: '/:pathMatch(.*)*', 
            name: 'not-found',
            component: { 
                template: `
                    <div class="container text-center mt-5">
                        <h1>404 - Page Not Found</h1>
                        <p>The page you're looking for doesn't exist.</p>
                        <router-link to="/" class="btn btn-primary">Go Home</router-link>
                    </div>
                ` 
            }
        }
    ];

    // Create router
    const router = createRouter({
        history: createWebHistory(),
        routes
    });

    // Route guards
    router.beforeEach((to, from, next) => {
        console.log('🧭 Navigating to:', to.path);
        
        // Check if route requires authentication
        if (to.meta.requiresAuth) {
            if (!window.authUtils.isLoggedIn()) {
                console.log('🔒 Route requires auth, redirecting to login');
                window.utils.showWarning('Please login to continue');
                next('/login');
                return;
            }
            
            // Check role-based access
            if (to.meta.role) {
                const userRole = window.authUtils.getUserRole();
                if (to.meta.role !== userRole) {
                    console.log(`🚫 Access denied. Required: ${to.meta.role}, User: ${userRole}`);
                    window.utils.showError('You do not have permission to access this page');
                    
                    // Redirect to appropriate dashboard
                    if (userRole === 'admin') {
                        next('/admin/dashboard');
                    } else if (userRole === 'user') {
                        next('/user/dashboard');
                    } else {
                        next('/login');
                    }
                    return;
                }
            }
        }
        
        next();
    });

    // Router error handling
    router.onError((error) => {
        console.error('Router error:', error);
        window.utils.showError('Navigation error occurred');
    });

    // Use router
    app.use(router);

    // Global properties
    app.config.globalProperties.$auth = window.auth;
    app.config.globalProperties.$api = window.api;
    app.config.globalProperties.$utils = window.utils;

    // Global error handler
    app.config.errorHandler = (error, instance, info) => {
        console.error('Vue error:', error);
        console.error('Error info:', info);
        window.utils.showError('An application error occurred');
    };

    // Mount the app
    const mountedApp = app.mount('#app');
    
    // Make app globally available for debugging
    window.app = mountedApp;
    window.router = router;

    console.log('🎉 Vue application mounted successfully');
    console.log('🔍 Debug: window.app and window.router available');
});

// Global unhandled error handlers
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    window.utils?.showError('An unexpected error occurred');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    window.utils?.showError('An unexpected error occurred');
});