/**
 * Main Vue.js Application Initialization - FIXED VERSION
 * Entry point for the Vehicle Parking System frontend
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Vehicle Parking System...');

    // Check if required libraries are loaded
    if (!window.Vue) {
        console.error('❌ Vue.js not loaded!');
        return;
    }
    
    if (!window.VueRouter) {
        console.error('❌ Vue Router not loaded!');
        return;
    }

    const { createApp } = Vue;
    const { createRouter, createWebHistory } = VueRouter;

    // Define routes
    const routes = [
        // Public routes
        { 
            path: '/', 
            name: 'home',
            redirect: to => {
                console.log('🏠 Home route accessed, checking auth...');
                if (window.authUtils?.isLoggedIn()) {
                    if (window.authUtils.isAdmin()) {
                        return '/admin/dashboard';
                    } else {
                        return '/user/dashboard';
                    }
                } else {
                    return '/login';
                }
            }
        },
        
        // Auth routes
        { 
            path: '/login', 
            name: 'login',
            component: window.LoginComponent || {
                template: `
                    <div class="container mt-5">
                        <div class="alert alert-danger">
                            <h4>Login Component Not Found</h4>
                            <p>Please create the Login component file.</p>
                        </div>
                    </div>
                `
            },
            beforeEnter: (to, from, next) => {
                if (window.authUtils?.isLoggedIn()) {
                    next(window.auth?.getRedirectPath() || '/');
                } else {
                    next();
                }
            }
        },
        
        { 
            path: '/register', 
            name: 'register',
            component: window.RegisterComponent || {
                template: `
                    <div class="container mt-5">
                        <div class="alert alert-warning">
                            <h4>Register Component Not Found</h4>
                            <p>Please create the Register component file.</p>
                        </div>
                    </div>
                `
            },
            beforeEnter: (to, from, next) => {
                if (window.authUtils?.isLoggedIn()) {
                    next(window.auth?.getRedirectPath() || '/');
                } else {
                    next();
                }
            }
        },

        // User routes
        { 
            path: '/user/dashboard', 
            name: 'user-dashboard',
            component: window.UserDashboardComponent || {
                template: `
                    <div class="container mt-5">
                        <h1><i class="fas fa-tachometer-alt me-2"></i>User Dashboard</h1>
                        <div class="alert alert-info">
                            <h5>Welcome to your dashboard!</h5>
                            <p>This is a placeholder. Please create the UserDashboard component.</p>
                        </div>
                    </div>
                `
            },
            meta: { requiresAuth: true, role: 'user' }
        },
        
        { 
            path: '/user/parking-lots', 
            name: 'user-parking-lots',
            component: window.ParkingLotsComponent || {
                template: `
                    <div class="container mt-5">
                        <h2><i class="fas fa-search me-2"></i>Find Parking</h2>
                        <div class="alert alert-info">
                            <p>Available parking lots will appear here.</p>
                        </div>
                    </div>
                `
            },
            meta: { requiresAuth: true, role: 'user' }
        },
        
        { 
            path: '/user/history', 
            name: 'user-history',
            component: window.ParkingHistoryComponent || {
                template: `
                    <div class="container mt-5">
                        <h2><i class="fas fa-history me-2"></i>Parking History</h2>
                        <div class="alert alert-info">
                            <p>Your parking history will appear here.</p>
                        </div>
                    </div>
                `
            },
            meta: { requiresAuth: true, role: 'user' }
        },
        
        { 
            path: '/user/analytics', 
            name: 'user-analytics',
            component: window.UserDashboardCharts || {
                template: `
                    <div class="container mt-5">
                        <h2><i class="fas fa-chart-pie me-2"></i>My Analytics</h2>
                        <div class="alert alert-info">
                            <p>Your analytics will appear here.</p>
                        </div>
                    </div>
                `
            },
            meta: { requiresAuth: true, role: 'user' }
        },

        // Admin routes
        { 
            path: '/admin/dashboard', 
            name: 'admin-dashboard',
            component: window.AdminDashboardComponent || {
                template: `
                    <div class="container mt-5">
                        <h1><i class="fas fa-tachometer-alt me-2"></i>Admin Dashboard</h1>
                        <div class="alert alert-success">
                            <h5>Welcome Administrator!</h5>
                            <p>This is a placeholder. Please create the AdminDashboard component.</p>
                        </div>
                    </div>
                `
            },
            meta: { requiresAuth: true, role: 'admin' }
        },
        
        { 
            path: '/admin/lots', 
            name: 'admin-lots',
            component: window.LotManagementComponent || {
                template: `
                    <div class="container mt-5">
                        <h2><i class="fas fa-building me-2"></i>Parking Lot Management</h2>
                        <div class="alert alert-info">
                            <p>Manage parking lots here.</p>
                        </div>
                    </div>
                `
            },
            meta: { requiresAuth: true, role: 'admin' }
        },
        
        { 
            path: '/admin/users', 
            name: 'admin-users',
            component: window.UserManagementComponent || {
                template: `
                    <div class="container mt-5">
                        <h2><i class="fas fa-users me-2"></i>User Management</h2>
                        <div class="alert alert-info">
                            <p>Manage users here.</p>
                        </div>
                    </div>
                `
            },
            meta: { requiresAuth: true, role: 'admin' }
        },
        
        { 
            path: '/admin/reservations', 
            name: 'admin-reservations',
            component: window.ReservationManagementComponent || {
                template: `
                    <div class="container mt-5">
                        <h2><i class="fas fa-list-alt me-2"></i>Reservation Management</h2>
                        <div class="alert alert-info">
                            <p>Manage reservations here.</p>
                        </div>
                    </div>
                `
            },
            meta: { requiresAuth: true, role: 'admin' }
        },
        
        { 
            path: '/admin/analytics', 
            name: 'admin-analytics',
            component: window.AdminDashboardCharts || {
                template: `
                    <div class="container mt-5">
                        <h2><i class="fas fa-chart-bar me-2"></i>Admin Analytics</h2>
                        <div class="alert alert-info">
                            <p>Admin analytics will appear here.</p>
                        </div>
                    </div>
                `
            },
            meta: { requiresAuth: true, role: 'admin' }
        },

        // 404 route
        { 
            path: '/:pathMatch(.*)*', 
            name: 'not-found',
            component: { 
                template: `
                    <div class="container text-center mt-5">
                        <div class="alert alert-warning">
                            <h1><i class="fas fa-exclamation-triangle me-2"></i>404 - Page Not Found</h1>
                            <p>The page you're looking for doesn't exist.</p>
                            <router-link to="/" class="btn btn-primary">
                                <i class="fas fa-home me-2"></i>Go Home
                            </router-link>
                        </div>
                    </div>
                ` 
            }
        }
    ];

    // Create router BEFORE creating app
    console.log('🧭 Creating Vue Router...');
    const router = createRouter({
        history: createWebHistory(),
        routes
    });

    // Router guards
    router.beforeEach((to, from, next) => {
        console.log('🧭 Navigating from:', from.path, 'to:', to.path);
        
        // Check if route requires authentication
        if (to.meta.requiresAuth) {
            if (!window.authUtils?.isLoggedIn()) {
                console.log('🔒 Route requires auth, redirecting to login');
                window.utils?.showWarning('Please login to continue');
                next('/login');
                return;
            }
            
            // Check role-based access
            if (to.meta.role) {
                const userRole = window.authUtils?.getUserRole();
                if (to.meta.role !== userRole) {
                    console.log(`🚫 Access denied. Required: ${to.meta.role}, User: ${userRole}`);
                    window.utils?.showError('You do not have permission to access this page');
                    
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
        window.utils?.showError('Navigation error occurred');
    });

    // Create Vue application
    console.log('📱 Creating Vue app...');
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
                    if (window.auth?.token) {
                        await window.auth.initializeAuth();
                    }
                    
                    // Set initial auth state
                    this.updateAuthState();
                    
                    // Setup auth event listeners
                    this.setupAuthListeners();
                    
                    // Check API health
                    await this.checkApiHealth();
                    
                    // Mark app as ready
                    this.appReady = true;
                    console.log('✅ Application initialized successfully');
                    
                } catch (error) {
                    console.error('❌ Failed to initialize application:', error);
                    this.error = 'Failed to initialize application. Please refresh the page.';
                    this.appReady = true; // Show error state instead of loading
                }
            },

            async checkApiHealth() {
                try {
                    await window.api?.healthCheck();
                    console.log('💚 API health check passed');
                } catch (error) {
                    console.warn('💔 API health check failed:', error);
                    // Don't block app initialization for health check failure
                }
            },

            updateAuthState() {
                this.currentUser = window.auth?.currentUser;
                this.isAuthenticated = window.auth?.isAuthenticated || false;
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
                    const redirectPath = window.auth?.getRedirectPath() || '/';
                    this.$router.push(redirectPath);
                    
                    window.utils?.showSuccess(`Welcome, ${window.auth?.getUserDisplayName()}!`);
                });

                window.addEventListener('logout', () => {
                    console.log('👋 User logged out');
                    this.updateAuthState();
                    this.$router.push('/login');
                    window.utils?.showInfo('You have been logged out successfully');
                });
            },

            // Global error handler
            handleError(error, context = '') {
                console.error('App Error:', error);
                const message = window.utils?.handleApiError(error, context) || 'An error occurred';
                this.error = message;
            },

            // Logout method
            logout() {
                window.auth?.logout();
            }
        },

        // Global computed properties
        computed: {
            isAdmin() {
                return window.authUtils?.isAdmin() || false;
            },
            
            isUser() {
                return window.authUtils?.isUser() || false;
            },
            
            userName() {
                return window.authUtils?.getUserName() || 'Guest';
            }
        }
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
        window.utils?.showError('An application error occurred');
    };

    // Mount the app
    console.log('🔗 Mounting Vue app...');
    const mountedApp = app.mount('#app');
    
    // Make app and router globally available
    window.app = mountedApp;
    window.router = router;

    console.log('🎉 Vue application mounted successfully');
    console.log('🔍 Debug: window.app and window.router available');
    console.log('📍 Current route will be determined by auth state');
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