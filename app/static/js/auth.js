/**
 * Authentication Management
 * Handles JWT tokens, user state, and auth-related functionality
 */

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.token = localStorage.getItem('access_token');
        
        // Initialize auth state on load
        this.initializeAuth();
    }

    /**
     * Initialize authentication state
     */
    async initializeAuth() {
        if (this.token) {
            try {
                // Set token in API service first
                if (window.api) {
                    window.api.token = this.token;
                }
                
                await this.loadUserProfile();
                console.log('🔑 Authentication initialized successfully');
            } catch (error) {
                console.log('🔓 Invalid token, clearing auth state');
                this.clearAuth();
            }
        }
    }
    /**
     * Load user profile from API
     */
    async loadUserProfile() {
        try {
            const response = await window.api.getProfile();
            this.setUser(response.user);
            return response.user;
        } catch (error) {
            console.error('Failed to load user profile:', error);
            throw error;
        }
    }

    /**
     * Set current user and auth state
     */
    setUser(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Emit user updated event
        window.dispatchEvent(new CustomEvent('user-updated', { 
            detail: { user } 
        }));
        
        console.log('👤 User set:', user.username, user.is_admin ? '(Admin)' : '(User)');
    }

    /**
     * Clear authentication state
     */
    clearAuth() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.token = null;
        
        localStorage.removeItem('access_token');
        
        // Emit auth cleared event
        window.dispatchEvent(new CustomEvent('auth-cleared'));
        
        console.log('🔓 Authentication cleared');
    }

    /**
     * Login user
     */
    async login(email, password) {
        try {
            const response = await window.api.login(email, password);
            
            if (response.access_token) {
                this.token = response.access_token;
                this.setUser(response.user);
                
                // Emit login success event
                window.dispatchEvent(new CustomEvent('login-success', { 
                    detail: { user: response.user } 
                }));
                
                return response;
            } else {
                throw new Error('No access token received');
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    /**
     * Register new user
     */
    async register(userData) {
        try {
            const response = await window.api.register(userData);
            
            // Auto-login after successful registration
            if (response.user) {
                console.log('✅ Registration successful, attempting auto-login');
                await this.login(userData.email, userData.password);
            }
            
            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    logout() {
        window.api.logout();
        this.clearAuth();
        
        // Emit logout event
        window.dispatchEvent(new CustomEvent('logout'));
        
        console.log('👋 User logged out');
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.currentUser && this.currentUser.is_admin;
    }

    /**
     * Check if user is regular user
     */
    isUser() {
        return this.currentUser && !this.currentUser.is_admin;
    }

    /**
     * Get user's display name
     */
    getUserDisplayName() {
        if (!this.currentUser) return 'Guest';
        return this.currentUser.full_name || this.currentUser.username || 'User';
    }

    /**
     * Get user's role
     */
    getUserRole() {
        if (!this.currentUser) return 'guest';
        return this.currentUser.is_admin ? 'admin' : 'user';
    }

    /**
     * Check if token is expired (basic check)
     */
    isTokenExpired() {
        if (!this.token) return true;
        
        try {
            // Decode JWT payload (basic check - in production use proper JWT library)
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const now = Date.now() / 1000;
            
            return payload.exp < now;
        } catch (error) {
            console.warn('Could not decode token:', error);
            return true;
        }
    }

    /**
     * Refresh authentication state
     */
    async refreshAuth() {
        if (!this.token || this.isTokenExpired()) {
            this.clearAuth();
            return false;
        }
        
        try {
            await this.loadUserProfile();
            return true;
        } catch (error) {
            this.clearAuth();
            return false;
        }
    }

    /**
     * Route guard for protected routes
     */
    requireAuth() {
        if (!this.isAuthenticated) {
            throw new Error('Authentication required');
        }
        return true;
    }

    /**
     * Route guard for admin routes
     */
    requireAdmin() {
        this.requireAuth();
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }
        return true;
    }

    /**
     * Route guard for user routes
     */
    requireUser() {
        this.requireAuth();
        if (!this.isUser()) {
            throw new Error('User access required');
        }
        return true;
    }

    /**
     * Get redirect path after login based on user role
     */
    getRedirectPath() {
        if (this.isAdmin()) {
            return '/admin/dashboard';
        } else if (this.isUser()) {
            return '/user/dashboard';
        }
        return '/';
    }
}

// Create global auth instance
window.auth = new AuthService();

// Global auth event listeners
window.addEventListener('auth-error', () => {
    console.log('🔴 Auth error detected, clearing auth state');
    window.auth.clearAuth();
});

window.addEventListener('storage', (e) => {
    // Handle token changes in other tabs
    if (e.key === 'access_token') {
        if (e.newValue !== window.auth.token) {
            console.log('🔄 Token changed in another tab, refreshing auth');
            window.auth.token = e.newValue;
            if (e.newValue) {
                window.auth.initializeAuth();
            } else {
                window.auth.clearAuth();
            }
        }
    }
});

// Utility functions for templates
window.authUtils = {
    /**
     * Check if user is authenticated
     */
    isLoggedIn: () => window.auth.isAuthenticated,
    
    /**
     * Check if user is admin
     */
    isAdmin: () => window.auth.isAdmin(),
    
    /**
     * Check if user is regular user
     */
    isUser: () => window.auth.isUser(),
    
    /**
     * Get current user
     */
    getCurrentUser: () => window.auth.currentUser,
    
    /**
     * Get user display name
     */
    getUserName: () => window.auth.getUserDisplayName(),
    
    /**
     * Get user role
     */
    getUserRole: () => window.auth.getUserRole()
};

console.log('🔧 Auth Service initialized');
console.log('🔑 Authenticated:', window.auth.isAuthenticated);
if (window.auth.currentUser) {
    console.log('👤 Current user:', window.auth.currentUser.username);
}