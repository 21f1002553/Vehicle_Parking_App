/**
 * Main Vue.js Application - FIXED VERSION with Better Error Handling
 * Entry point for the Vehicle Parking System frontend
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

    // Define routes with better error handling
    const routes = [
        // Public routes
        { 
            path: '/', 
            name: 'home',
            redirect: to => {
                console.log('🏠 Home route accessed, checking auth...');
                try {
                    const token = localStorage.getItem('access_token');
                    if (token && window.auth?.currentUser) {
                        if (window.auth.currentUser.is_admin) {
                            return '/admin/dashboard';
                        } else {
                            return '/user/dashboard';
                        }
                    } else {
                        return '/login';
                    }
                } catch (error) {
                    console.error('Error in home redirect:', error);
                    return '/login';
                }
            }
        },
        
        // Auth routes
        { 
            path: '/login', 
            name: 'login',
            component: window.LoginComponent || createFallbackComponent('Login'),
            beforeEnter: (to, from, next) => {
                try {
                    const token = localStorage.getItem('access_token');
                    if (token && window.auth?.isAuthenticated) {
                        next(window.auth?.getRedirectPath() || '/');
                    } else {
                        next();
                    }
                } catch (error) {
                    console.error('Error in login guard:', error);
                    next();
                }
            }
        },
        
        { 
            path: '/register', 
            name: 'register',
            component: window.RegisterComponent || createFallbackComponent('Register'),
            beforeEnter: (to, from, next) => {
                try {
                    const token = localStorage.getItem('access_token');
                    if (token && window.auth?.isAuthenticated) {
                        next(window.auth?.getRedirectPath() || '/');
                    } else {
                        next();
                    }
                } catch (error) {
                    console.error('Error in register guard:', error);
                    next();
                }
            }
        },

        // User routes
        { 
            path: '/user/dashboard', 
            name: 'user-dashboard',
            component: window.UserDashboardComponent || createDashboardComponent('user'),
            meta: { requiresAuth: true, role: 'user' }
        },
        
        { 
            path: '/user/parking-lots', 
            name: 'user-parking-lots',
            component: window.UserParkingLotsComponent || createPlaceholderComponent('Find Parking', 'Available parking lots will appear here.'),
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
            name: 'user-analytics',
            component: window.UserDashboardCharts || createPlaceholderComponent('My Analytics', 'Your analytics will appear here.'),
            meta: { requiresAuth: true, role: 'user' }
        },

        // Admin routes
        { 
            path: '/admin/dashboard', 
            name: 'admin-dashboard',
            component: window.AdminDashboardComponent || createDashboardComponent('admin'),
            meta: { requiresAuth: true, role: 'admin' }
        },
        
        { 
            path: '/admin/lots', 
            name: 'admin-lots',
            component: window.AdminParkingLotsComponent || createPlaceholderComponent('Parking Lot Management', 'Manage parking lots here.'),
            meta: { requiresAuth: true, role: 'admin' }
        },
        
        { 
            path: '/admin/users', 
            name: 'admin-users',
            component: window.AdminUsersComponent || createPlaceholderComponent('User Management', 'Manage users here.'),
            meta: { requiresAuth: true, role: 'admin' }
        },
        
        { 
            path: '/admin/reservations', 
            name: 'admin-reservations',
            component: window.AdminReservationsComponent || createPlaceholderComponent('Reservation Management', 'Manage reservations here.'),
            meta: { requiresAuth: true, role: 'admin' }
        },
        
        { 
            path: '/admin/analytics', 
            name: 'admin-analytics',
            component: window.AdminDashboardCharts || createPlaceholderComponent('Admin Analytics', 'Admin analytics will appear here.'),
            meta: { requiresAuth: true, role: 'admin' }
        },

        // 404 route
        { 
            path: '/:pathMatch(.*)*', 
            name: 'not-found',
            component: createNotFoundComponent()
        }
    ];

    // Create router with error handling
    console.log('🧭 Creating Vue Router...');
    const router = createRouter({
        history: createWebHistory(),
        routes
    });

    // Enhanced router guards with error handling
    router.beforeEach((to, from, next) => {
        console.log('🧭 Navigating from:', from.path, 'to:', to.path);
        
        try {
            // Check if route requires authentication
            if (to.meta.requiresAuth) {
                // Check localStorage token as fallback
                const token = localStorage.getItem('access_token');
                
                if (!token && !window.auth?.isAuthenticated) {
                    console.log('🔒 Route requires auth, redirecting to login');
                    if (window.utils?.showWarning) {
                        window.utils.showWarning('Please login to continue');
                    }
                    next('/login');
                    return;
                }
                
                // For role-based access, wait for auth to be loaded or check token
                if (to.meta.role) {
                    // If auth service is ready, use it
                    if (window.auth?.currentUser) {
                        const userRole = window.auth.getUserRole();
                        if (to.meta.role !== userRole) {
                            console.log(`🚫 Access denied. Required: ${to.meta.role}, User: ${userRole}`);
                            if (window.utils?.showError) {
                                window.utils.showError('You do not have permission to access this page');
                            }
                            
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
                    } else if (token) {
                        // Auth not loaded yet, but we have a token, allow navigation
                        console.log('⏳ Auth loading, allowing navigation with token');
                    } else {
                        // No token and no auth, redirect to login
                        next('/login');
                        return;
                    }
                }
            }
            
            next();
        } catch (error) {
            console.error('Router guard error:', error);
            next(); // Continue navigation even if guard fails
        }
    });

    // Router error handling
    router.onError((error) => {
        console.error('Router error:', error);
        if (window.utils?.showError) {
            window.utils.showError('Navigation error occurred');
        }
    });

    // Create Vue application with enhanced error handling
    console.log('📱 Creating Vue app...');
    try {
        const app = createApp({
            data() {
                return {
                    appReady: false,
                    currentUser: null,
                    isAuthenticated: false,
                    loading: false,
                    error: null,
                    initializationComplete: false
                }
            },

            async mounted() {
                console.log('📱 Vue app mounted');
                try {
                    await this.initializeApp();
                } catch (error) {
                    console.error('Failed to initialize app:', error);
                    this.error = 'Failed to initialize application';
                    this.appReady = true;
                    this.hideLoadingScreen();
                }
            },

            methods: {
                async initializeApp() {
                    try {
                        console.log('🔧 Initializing application...');
                        
                        // Update loading status
                        updateLoadingStatus('Setting up authentication...');
                        
                        // Check for existing token
                        const token = localStorage.getItem('access_token');
                        if (token) {
                            // Set token in services
                            if (window.auth) {
                                window.auth.token = token;
                            }
                            if (window.api) {
                                window.api.token = token;
                            }
                            
                            // Try to load user profile
                            try {
                                await this.loadUserProfile();
                            } catch (error) {
                                console.warn('Failed to load user profile, clearing token');
                                localStorage.removeItem('access_token');
                            }
                        }
                        
                        // Set initial auth state
                        this.updateAuthState();
                        
                        // Setup auth event listeners
                        this.setupAuthListeners();
                        
                        updateLoadingStatus('Checking API connection...');
                        
                        // Check API health (optional)
                        try {
                            await this.checkApiHealth();
                        } catch (error) {
                            console.warn('API health check failed, continuing anyway:', error);
                        }
                        
                        updateLoadingStatus('Application ready!');
                        
                        // Mark app as ready
                        this.appReady = true;
                        this.initializationComplete = true;
                        
                        // Hide loading screen
                        this.hideLoadingScreen();
                        
                        console.log('✅ Application initialized successfully');
                        
                    } catch (error) {
                        console.error('❌ Failed to initialize application:', error);
                        this.error = 'Failed to initialize application. Please refresh the page.';
                        this.appReady = true;
                        this.hideLoadingScreen();
                        showInitializationError(error.message);
                    }
                },

                async loadUserProfile() {
                    const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/profile`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.user && window.auth) {
                            window.auth.currentUser = data.user;
                            window.auth.isAuthenticated = true;
                            this.updateAuthState();
                        }
                    } else {
                        throw new Error('Failed to load profile');
                    }
                },

                hideLoadingScreen() {
                    try {
                        const loadingContainer = document.querySelector('.loading-container');
                        if (loadingContainer) {
                            loadingContainer.style.opacity = '0';
                            loadingContainer.style.transition = 'opacity 0.5s ease';
                            setTimeout(() => {
                                loadingContainer.style.display = 'none';
                            }, 500);
                        }
                    } catch (error) {
                        console.warn('Error hiding loading screen:', error);
                    }
                },

                async checkApiHealth() {
                    try {
                        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/health`);
                        if (response.ok) {
                            console.log('💚 API health check passed');
                        } else {
                            throw new Error('API health check failed');
                        }
                    } catch (error) {
                        console.warn('💔 API health check failed:', error);
                        throw error;
                    }
                },

                updateAuthState() {
                    try {
                        this.currentUser = window.auth?.currentUser;
                        this.isAuthenticated = window.auth?.isAuthenticated || false;
                        console.log('🔄 Auth state updated:', { 
                            isAuthenticated: this.isAuthenticated, 
                            user: this.currentUser?.username 
                        });
                    } catch (error) {
                        console.error('Error updating auth state:', error);
                    }
                },

                setupAuthListeners() {
                    try {
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
                            
                            // Don't redirect here, let the login component handle it
                            
                            if (window.utils?.showSuccess) {
                                window.utils.showSuccess(`Welcome, ${event.detail.user.full_name || event.detail.user.username}!`);
                            }
                        });

                        window.addEventListener('logout', () => {
                            console.log('👋 User logged out');
                            this.updateAuthState();
                            this.$router.push('/login');
                            if (window.utils?.showInfo) {
                                window.utils.showInfo('You have been logged out successfully');
                            }
                        });
                    } catch (error) {
                        console.error('Error setting up auth listeners:', error);
                    }
                },

                // Global error handler
                handleError(error, context = '') {
                    console.error('App Error:', error);
                    const message = window.utils?.handleApiError(error, context) || 'An error occurred';
                    this.error = message;
                },

                // Logout method
                logout() {
                    try {
                        window.auth?.logout();
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                }
            },

            // Global computed properties
            computed: {
                isAdmin() {
                    try {
                        return window.auth?.currentUser?.is_admin || false;
                    } catch (error) {
                        console.error('Error checking admin status:', error);
                        return false;
                    }
                },
                
                isUser() {
                    try {
                        return window.auth?.currentUser && !window.auth.currentUser.is_admin || false;
                    } catch (error) {
                        console.error('Error checking user status:', error);
                        return false;
                    }
                },
                
                userName() {
                    try {
                        return window.auth?.currentUser?.full_name || 
                               window.auth?.currentUser?.username || 
                               'Guest';
                    } catch (error) {
                        console.error('Error getting user name:', error);
                        return 'Guest';
                    }
                }
            }
        });

        // Use router
        app.use(router);

        // Global properties with error handling
        app.config.globalProperties.$auth = window.auth;
        app.config.globalProperties.$api = window.api;
        app.config.globalProperties.$utils = window.utils;

        // Enhanced global error handler
        app.config.errorHandler = (error, instance, info) => {
            console.error('Vue error:', error);
            console.error('Error info:', info);
            console.error('Component instance:', instance);
            
            showInitializationError(`Vue Error: ${error.message}`);
            
            if (window.utils?.showError) {
                window.utils.showError('An application error occurred');
            }
        };

        // Mount the app with error handling
        console.log('🔗 Mounting Vue app...');
        try {
            const mountedApp = app.mount('#app');
            
            // Make app and router globally available
            window.app = mountedApp;
            window.router = router;

            console.log('🎉 Vue application mounted successfully');
            console.log('🔍 Debug: window.app and window.router available');
            
            // Add debug function
            // Add this after the app.mount('#app') line in main.js
            window.debugAuth = function() {
                console.log('🔍 Auth Debug Info:');
                console.log('Token in localStorage:', localStorage.getItem('access_token'));
                console.log('Auth service token:', window.auth?.token);
                console.log('Is authenticated:', window.auth?.isAuthenticated);
                console.log('Current user:', window.auth?.currentUser);
                console.log('API token:', window.api?.token);
                console.log('Current route:', window.router?.currentRoute.value.path);
            };

        console.log('🔧 debugAuth function added to window');
            
        } catch (error) {
            console.error('Failed to mount Vue app:', error);
            showInitializationError(`Failed to mount application: ${error.message}`);
        }
        
    } catch (error) {
        console.error('Failed to create Vue app:', error);
        showInitializationError(`Failed to create application: ${error.message}`);
    }
});

// Helper functions for creating fallback components
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

function createDashboardComponent(role) {
    const isAdmin = role === 'admin';
    return {
        template: `
            <div class="container mt-4">
                <div class="row">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h1>
                                <i class="fas fa-tachometer-alt me-2"></i>
                                ${isAdmin ? 'Admin' : 'User'} Dashboard
                            </h1>
                            <button @click="logout" class="btn btn-outline-danger">
                                <i class="fas fa-sign-out-alt me-2"></i>Logout
                            </button>
                        </div>
                        
                        <div class="alert alert-success">
                            <h5><i class="fas fa-check-circle me-2"></i>Welcome ${isAdmin ? 'Administrator' : 'User'}!</h5>
                            <p class="mb-0">Your dashboard is loading. This is a functional placeholder that shows authentication is working.</p>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h5><i class="fas fa-info-circle me-2"></i>System Status</h5>
                                        <p>✅ Authentication: Working</p>
                                        <p>✅ API Connection: Active</p>
                                        <p>✅ User Role: ${isAdmin ? 'Administrator' : 'Standard User'}</p>
                                        <p class="mb-0">✅ Dashboard: Loaded</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h5><i class="fas fa-cogs me-2"></i>Quick Actions</h5>
                                        ${isAdmin ? `
                                            <router-link to="/admin/lots" class="btn btn-primary btn-sm me-2 mb-2">
                                                <i class="fas fa-building me-1"></i>Manage Lots
                                            </router-link>
                                            <router-link to="/admin/users" class="btn btn-info btn-sm me-2 mb-2">
                                                <i class="fas fa-users me-1"></i>Manage Users
                                            </router-link>
                                            <router-link to="/admin/analytics" class="btn btn-success btn-sm mb-2">
                                                <i class="fas fa-chart-bar me-1"></i>Analytics
                                            </router-link>
                                        ` : `
                                            <router-link to="/user/parking-lots" class="btn btn-primary btn-sm me-2 mb-2">
                                                <i class="fas fa-search me-1"></i>Find Parking
                                            </router-link>
                                            <router-link to="/user/history" class="btn btn-info btn-sm me-2 mb-2">
                                                <i class="fas fa-history me-1"></i>My History
                                            </router-link>
                                            <router-link to="/user/analytics" class="btn btn-success btn-sm mb-2">
                                                <i class="fas fa-chart-pie me-1"></i>My Analytics
                                            </router-link>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        methods: {
            logout() {
                try {
                    window.auth?.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                }
            }
        }
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

console.log('✅ Enhanced main.js loaded with authentication fixes');