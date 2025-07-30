

class ApiService {
    constructor() {
        this.baseURL = window.APP_CONFIG.API_BASE_URL;
        this.token = localStorage.getItem('access_token');
    }

    
      //authentication headers
     
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    
     //Update stored token
     
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    
     //Generic API request method
     
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: this.getHeaders(options.requireAuth !== false),
            ...options
        };

        try {
            console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            console.log(`✅ API Success: ${endpoint}`, data);
            return data;

        } catch (error) {
            console.error(`❌ API Error: ${endpoint}`, error);
            
            // Handle authentication errors
            if (error.message.includes('401') || error.message.includes('token')) {
                this.handleAuthError();
            }
            
            throw error;
        }
    }

    
     //Handle authentication errors
     
    handleAuthError() {
        console.log('🔓 Authentication error - clearing token');
        this.setToken(null);
        
  
        window.dispatchEvent(new CustomEvent('auth-error'));
    }

   
    // AUTHENTICATION ENDPOINTS
   
    
    //User login
     
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            requireAuth: false
        });

        if (response.access_token) {
            this.setToken(response.access_token);
        }

        return response;
    }

    
   //  User registration
     
    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            requireAuth: false
        });
    }

    
     //user profile
     
    async getProfile() {
        return await this.request('/auth/profile');
    }

    
    //Logout (client-side)
     
    logout() {
        this.setToken(null);
        console.log('🔓 User logged out');
    }

   
    // USER ENDPOINTS
    

    
    async getUserDashboard() {
        return await this.request('/user/dashboard');
    }

    
     //* available parking lots
  
    async getParkingLots() {
        return await this.request('/user/parking-lots');
    }

    
     //Reserve arking spot
     
    async reserveSpot(lotId, vehicleNumber) {
        return await this.request('/user/reserve-spot', {
            method: 'POST',
            body: JSON.stringify({
                lot_id: lotId,
                vehicle_number: vehicleNumber
            })
        });
    }

    
    // Occupy a reserved spot
     
    async occupySpot(reservationId) {
        return await this.request(`/user/occupy-spot/${reservationId}`, {
            method: 'POST'
        });
    }

    
    // Release a parking spot
     
    async releaseSpot(reservationId) {
        return await this.request(`/user/release-spot/${reservationId}`, {
            method: 'POST'
        });
    }

    
     //Active reservation
     
    async getActiveReservation() {
        return await this.request('/user/active-reservation');
    }

    
    //parking history
     
    async getParkingHistory(page = 1, perPage = 10) {
        return await this.request(`/user/parking-history?page=${page}&per_page=${perPage}`);
    }

    
    async getDetailedParkingHistory(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/user/parking-history/detailed?${params}`);
    }

    
    async getCostSummary(days = 30) {
        return await this.request(`/user/cost-summary?days=${days}`);
    }

   
    async getUserAnalyticsCharts(days = 90) {
        return await this.request(`/user/analytics/charts/personal?days=${days}`);
    }

    
    async getUserCostAnalysis(days = 90) {
        return await this.request(`/user/analytics/charts/cost-analysis?days=${days}`);
    }

    
    //ADMIN ENDPOINTS
     

    
     // Get admin dashboard
     
    async getAdminDashboard() {
        return await this.request('/admin/dashboard');
    }

    
    async getAdminParkingLots() {
        return await this.request('/admin/parking-lots');
    }

    
     //Create parking lot
     
    async createParkingLot(lotData) {
        return await this.request('/admin/parking-lots', {
            method: 'POST',
            body: JSON.stringify(lotData)
        });
    }

    
     // Update parking lot
     
    async updateParkingLot(lotId, lotData) {
        return await this.request(`/admin/parking-lots/${lotId}`, {
            method: 'PUT',
            body: JSON.stringify(lotData)
        });
    }

    
     //Delete parking lot
     
    async deleteParkingLot(lotId) {
        return await this.request(`/admin/parking-lots/${lotId}`, {
            method: 'DELETE'
        });
    }

    
    async getUsers() {
        return await this.request('/admin/users');
    }

    async toggleUserStatus(userId) {
        return await this.request(`/admin/users/${userId}/toggle-status`, {
            method: 'POST'
        });
    }

  
    async getReservations(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/admin/reservations?${params}`);
    }

    
    async getDetailedReservations(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return await this.request(`/admin/reservations/detailed?${params}`);
    }

  
    async forceReleaseSpot(spotId) {
        return await this.request(`/admin/spots/${spotId}/force-release`, {
            method: 'POST'
        });
    }

    
    async getRevenueAnalytics(days = 30) {
        return await this.request(`/admin/analytics/revenue?days=${days}`);
    }

   
    async getOccupancyAnalytics() {
        return await this.request('/admin/analytics/occupancy');
    }

    
    async getAdminDashboardCharts(days = 30) {
        return await this.request(`/admin/analytics/charts/dashboard?days=${days}`);
    }

   
    async getRevenueBreakdownCharts(days = 30) {
        return await this.request(`/admin/analytics/charts/revenue-breakdown?days=${days}`);
    }

    
    /**
     * API health
     */
    async healthCheck() {
        return await this.request('/health', { requireAuth: false });
    }
}

// Create global API instance
window.api = new ApiService();

// Listen for auth errors globally
window.addEventListener('auth-error', () => {
    // Redirect to login or show auth modal
    console.log('Redirecting to login due to auth error');
    if (window.app && window.app.$router) {
        window.app.$router.push('/login');
    }
});

console.log('API Service initialized');
console.log('Base URL:', window.api.baseURL);
console.log('Token present:', !!window.api.token);