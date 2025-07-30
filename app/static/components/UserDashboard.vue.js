// app/static/components/UserDashboard.vue.js
window.UserDashboardComponent = {
    name: 'UserDashboard',
    template: `
    <div class="container-fluid">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1><i class="fas fa-tachometer-alt me-2"></i>User Dashboard</h1>
            <button @click="logout" class="btn btn-outline-danger">
                <i class="fas fa-sign-out-alt me-2"></i>Logout
            </button>
        </div>

        <!-- Welcome Alert -->
        <div class="alert alert-success mb-4">
            <h5><i class="fas fa-user-circle me-2"></i>Welcome, {{ userName }}!</h5>
            <p class="mb-0">Manage your parking reservations and view your history.</p>
        </div>

        <!-- Quick Stats -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <h6>Active Reservations</h6>
                        <h3>{{ activeReservations }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <h6>Total Sessions</h6>
                        <h3>{{ totalSessions }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <h6>Total Spent</h6>
                        <h3>₹{{ totalSpent }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <h6>Available Lots</h6>
                        <h3>{{ availableLots }}</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-bolt me-2"></i>Quick Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <router-link to="/user/reserve" class="btn btn-primary w-100 py-3">
                                    <i class="fas fa-parking fa-2x mb-2 d-block"></i>
                                    Find & Reserve Parking
                                </router-link>
                            </div>
                            <div class="col-md-4 mb-3">
                                <router-link to="/user/history" class="btn btn-info w-100 py-3">
                                    <i class="fas fa-history fa-2x mb-2 d-block"></i>
                                    View History
                                </router-link>
                            </div>
                            <div class="col-md-4 mb-3">
                                <router-link to="/user/analytics" class="btn btn-success w-100 py-3">
                                    <i class="fas fa-chart-pie fa-2x mb-2 d-block"></i>
                                    My Analytics
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Reservation -->
        <div v-if="activeReservation" class="row mb-4">
            <div class="col-12">
                <div class="card border-warning">
                    <div class="card-header bg-warning text-dark">
                        <h5><i class="fas fa-car me-2"></i>Active Reservation</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <strong>Vehicle:</strong><br>
                                {{ activeReservation.vehicle_number }}
                            </div>
                            <div class="col-md-3">
                                <strong>Location:</strong><br>
                                {{ activeReservation.lot_name || 'N/A' }}
                            </div>
                            <div class="col-md-3">
                                <strong>Status:</strong><br>
                                <span class="badge bg-primary">{{ activeReservation.status }}</span>
                            </div>
                            <div class="col-md-3">
                                <router-link to="/user/reserve" class="btn btn-outline-primary">
                                    <i class="fas fa-eye me-1"></i>View Details
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent History -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-clock me-2"></i>Recent Parking Sessions</h5>
                    </div>
                    <div class="card-body">
                        <div v-if="recentReservations.length === 0" class="text-center py-4">
                            <p class="text-muted">No recent parking sessions</p>
                        </div>
                        <div v-else class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Location</th>
                                        <th>Duration</th>
                                        <th>Cost</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="reservation in recentReservations" :key="reservation.id">
                                        <td>{{ formatDate(reservation.reservation_time) }}</td>
                                        <td>{{ reservation.lot_name || 'N/A' }}</td>
                                        <td>{{ reservation.duration_formatted || 'N/A' }}</td>
                                        <td>₹{{ reservation.total_cost || 0 }}</td>
                                        <td>
                                            <span :class="getStatusBadgeClass(reservation.status)">
                                                {{ reservation.status }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            loading: false,
            activeReservation: null,
            recentReservations: [],
            availableLots: 0,
            activeReservations: 0,
            totalSessions: 0,
            totalSpent: 0
        }
    },

    computed: {
        userName() {
            return window.auth?.currentUser?.full_name || 
                   window.auth?.currentUser?.username || 
                   'User';
        }
    },

    async mounted() {
        console.log('📊 User Dashboard mounted');
        await this.loadDashboardData();
    },

    methods: {
        async loadDashboardData() {
            this.loading = true;
            try {
                const response = await window.api.getUserDashboard();
                
                // Update data
                this.activeReservation = response.active_reservations?.[0] || null;
                this.recentReservations = response.recent_reservations || [];
                this.availableLots = response.available_lots?.length || 0;
                this.activeReservations = response.active_reservations?.length || 0;
                
                // Calculate stats from recent reservations
                const completedReservations = this.recentReservations.filter(r => r.status === 'completed');
                this.totalSessions = completedReservations.length;
                this.totalSpent = completedReservations.reduce((sum, r) => sum + (r.total_cost || 0), 0);
                
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
                if (window.utils) {
                    window.utils.showError('Failed to load dashboard data');
                }
            } finally {
                this.loading = false;
            }
        },

        logout() {
            window.auth?.logout();
        },

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('en-IN');
        },

        getStatusBadgeClass(status) {
            const classes = {
                'completed': 'badge bg-success',
                'active': 'badge bg-primary',
                'reserved': 'badge bg-warning',
                'cancelled': 'badge bg-secondary'
            };
            return classes[status] || 'badge bg-secondary';
        }
    }
};

// Register component globally
if (window.Vue) {
    console.log('✅ UserDashboard component registered');
}