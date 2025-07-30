

window.UserDashboardComponent = {
    name: 'UserDashboard',
    template: `
    <div class="container-fluid">
        <!-- Header -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h1><i class="fas fa-car me-2"></i>My Parking Dashboard</h1>
                        <p class="text-muted mb-0">Find and manage your parking spots</p>
                    </div>
                    <div>
                        <button @click="logout" class="btn btn-outline-danger">
                            <i class="fas fa-sign-out-alt me-2"></i>Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading your dashboard...</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>{{ error }}
        </div>

        <!-- Dashboard Content -->
        <div v-if="!loading && !error">
            <!-- Welcome & Quick Stats -->
            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h4><i class="fas fa-user me-2"></i>Welcome back, {{ user.full_name || user.username }}!</h4>
                            <p class="mb-0">Ready to find your perfect parking spot?</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h5>Quick Stats</h5>
                            <div class="d-flex justify-content-around">
                                <div>
                                    <div class="fw-bold">{{ userStats.total_sessions || 0 }}</div>
                                    <small>Total Visits</small>
                                </div>
                                <div>
                                    <div class="fw-bold">₹{{ userStats.total_spent || 0 }}</div>
                                    <small>Total Spent</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active Reservation Alert -->
            <div v-if="activeReservation" class="row mb-4">
                <div class="col-12">
                    <div class="alert alert-warning border-start border-warning border-5">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="alert-heading">
                                    <i class="fas fa-car me-2"></i>Active Parking Session
                                </h5>
                                <p class="mb-1">
                                    <strong>Vehicle:</strong> {{ activeReservation.vehicle_number }} | 
                                    <strong>Spot:</strong> {{ activeReservation.spot?.spot_number }} | 
                                    <strong>Location:</strong> {{ activeReservation.lot.name }}
                                </p>
                                <small class="text-muted">
                                    Started: {{ formatDateTime(activeReservation.parking_start_time) }} | 
                                    Duration: {{ getCurrentParkingDuration() }}
                                </small>
                            </div>
                            <div>
                                <button @click="releaseCurrentSpot" class="btn btn-danger" :disabled="releasing">
                                    <span v-if="releasing" class="spinner-border spinner-border-sm me-2"></span>
                                    <i v-else class="fas fa-sign-out-alt me-2"></i>
                                    {{ releasing ? 'Releasing...' : 'Release Spot' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Reserved Spot Alert -->
            <div v-if="reservedSpot" class="row mb-4">
                <div class="col-12">
                    <div class="alert alert-info border-start border-info border-5">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="alert-heading">
                                    <i class="fas fa-clock me-2"></i>Reserved Parking Spot
                                </h5>
                                <p class="mb-1">
                                    <strong>Vehicle:</strong> {{ reservedSpot.vehicle_number }} | 
                                    <strong>Spot:</strong> {{ reservedSpot.spot?.spot_number }} | 
                                    <strong>Location:</strong> {{ reservedSpot.lot?.name }}
                                </p>
                                <small class="text-muted">
                                    Reserved: {{ formatDateTime(reservedSpot.reservation_time) }}
                                    <span class="text-warning ms-2">⚠️ Please occupy your spot soon!</span>
                                </small>
                            </div>
                            <div>
                                <button @click="occupyReservedSpot" class="btn btn-success me-2" :disabled="occupying">
                                    <span v-if="occupying" class="spinner-border spinner-border-sm me-2"></span>
                                    <i v-else class="fas fa-play me-2"></i>
                                    {{ occupying ? 'Occupying...' : "I'm Here!" }}
                                </button>
                                <button @click="cancelReservation" class="btn btn-outline-secondary" :disabled="cancelling">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Actions -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-bolt me-2"></i>Quick Actions</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3 mb-2">
                                    <button @click="showReservationModal" 
                                            class="btn btn-primary w-100" 
                                            :disabled="activeReservation || reservedSpot">
                                        <i class="fas fa-plus me-2"></i>Find Parking
                                    </button>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <router-link to="/user/history" class="btn btn-info w-100">
                                        <i class="fas fa-history me-2"></i>My History
                                    </router-link>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <router-link to="/user/analytics" class="btn btn-success w-100">
                                        <i class="fas fa-chart-pie me-2"></i>My Analytics
                                    </router-link>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <button @click="refreshDashboard" class="btn btn-outline-secondary w-100">
                                        <i class="fas fa-sync me-2"></i>Refresh
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Available Parking Lots -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-building me-2"></i>Available Parking Lots</h5>
                        </div>
                        <div class="card-body">
                            <div v-if="availableLots.length === 0" class="text-center py-4">
                                <i class="fas fa-parking fa-3x text-muted mb-3"></i>
                                <p class="text-muted">No parking lots available at the moment.</p>
                            </div>
                            <div v-else class="row">
                                <div v-for="lot in availableLots" :key="lot.id" class="col-lg-4 col-md-6 mb-3">
                                    <div class="card h-100 border-start border-5"
                                         :class="lot.available_spots > 0 ? 'border-success' : 'border-danger'">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">{{ lot.name }}</h6>
                                                <span class="badge" 
                                                      :class="lot.available_spots > 0 ? 'bg-success' : 'bg-danger'">
                                                    {{ lot.available_spots }}/{{ lot.total_spots }}
                                                </span>
                                            </div>
                                            <p class="card-text small text-muted mb-2">
                                                <i class="fas fa-map-marker-alt me-1"></i>
                                                {{ lot.address.substring(0, 50) }}...
                                            </p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>₹{{ lot.price_per_hour }}/hour</strong>
                                                </div>
                                                <button @click="reserveSpotInLot(lot)" 
                                                        class="btn btn-sm"
                                                        :class="lot.available_spots > 0 ? 'btn-primary' : 'btn-secondary'"
                                                        :disabled="lot.available_spots === 0 || activeReservation || reservedSpot || reserving">
                                                    {{ lot.available_spots > 0 ? 'Reserve' : 'Full' }}
                                                </button>
                                            </div>
                                            
                                            <!-- Occupancy Bar -->
                                            <div class="mt-2">
                                                <div class="progress" style="height: 6px;">
                                                    <div class="progress-bar"
                                                         :class="getOccupancyClass(lot.occupancy_rate)"
                                                         :style="{width: lot.occupancy_rate + '%'}">
                                                    </div>
                                                </div>
                                                <small class="text-muted">{{ lot.occupancy_rate }}% occupied</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Parking History -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5><i class="fas fa-history me-2"></i>Recent Parking Sessions</h5>
                                <router-link to="/user/history" class="btn btn-sm btn-outline-primary">
                                    View All
                                </router-link>
                            </div>
                        </div>
                        <div class="card-body">
                            <div v-if="recentHistory.length === 0" class="text-center py-4">
                                <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                                <p class="text-muted">No parking history yet. Book your first spot!</p>
                            </div>
                            <div v-else class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Vehicle</th>
                                            <th>Parking Lot</th>
                                            <th>Date</th>
                                            <th>Duration</th>
                                            <th>Cost</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="session in recentHistory" :key="session.id">
                                            <td><strong>{{ session.vehicle_number }}</strong></td>
                                            <td class="small">{{ session.lot_name }}</td>
                                            <td class="small">{{ formatDateTime(session.parking_start_time) }}</td>
                                            <td class="small">{{ session.duration_formatted || 'N/A' }}</td>
                                            <td><strong>₹{{ session.total_cost || 0 }}</strong></td>
                                            <td>
                                                <span :class="getStatusBadgeClass(session.status)">
                                                    {{ getStatusText(session.status) }}
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

        <!-- Reserve Spot Modal -->
        <div class="modal fade" id="reservationModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Reserve Parking Spot</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form @submit.prevent="makeReservation">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Select Parking Lot *</label>
                                <select v-model="reservationForm.lot_id" class="form-control" required>
                                    <option value="">Choose a parking lot...</option>
                                    <option v-for="lot in availableLotsForReservation" 
                                            :key="lot.id" 
                                            :value="lot.id">
                                        {{ lot.name }} - ₹{{ lot.price_per_hour }}/hr ({{ lot.available_spots }} available)
                                    </option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Vehicle Number *</label>
                                <input v-model="reservationForm.vehicle_number" 
                                       type="text" 
                                       class="form-control" 
                                       placeholder="e.g., KA01AB1234"
                                       required>
                                <div class="form-text">Enter your vehicle registration number</div>
                            </div>
                            <div v-if="selectedLotDetails" class="alert alert-info">
                                <h6>Selected Lot Details:</h6>
                                <p class="mb-1"><strong>{{ selectedLotDetails.name }}</strong></p>
                                <p class="mb-1 small">{{ selectedLotDetails.address }}</p>
                                <p class="mb-0">
                                    <strong>Rate:</strong> ₹{{ selectedLotDetails.price_per_hour }}/hour | 
                                    <strong>Available:</strong> {{ selectedLotDetails.available_spots }} spots
                                </p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="reserving">
                                <span v-if="reserving" class="spinner-border spinner-border-sm me-2"></span>
                                {{ reserving ? 'Reserving...' : 'Reserve Spot' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            loading: false,
            error: null,
            user: {},
            userStats: {},
            availableLots: [],
            recentHistory: [],
            activeReservation: null,
            reservedSpot: null,

          
            activeReservations: 0,
            totalSessions: 0,
            totalSpent: 0,
            currentReservation: null,
            recentReservations: [],
            
            
            reserving: false,
            occupying: false,
            releasing: false,
            cancelling: false,
            
            
            reservationForm: {
                lot_id: '',
                vehicle_number: ''
            }
        }
    },

    computed: {
        availableLotsForReservation() {
            return this.availableLots.filter(lot => lot.available_spots > 0);
        },

        selectedLotDetails() {
            if (!this.reservationForm.lot_id) return null;
            return this.availableLots.find(lot => lot.id == this.reservationForm.lot_id);
        }
    },

    mounted() {
        console.log('🚗 User Dashboard mounted');
        this.loadDashboardData();
     
        this.autoRefreshInterval = setInterval(() => {
            this.refreshActiveReservation();
        }, 30000);
    },

    beforeUnmount() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    },

    methods: {
        async loadDashboardData() {
            this.loading = true;
            this.error = null;

            try {
                
                const dashboardResponse = await window.api.getUserDashboard();
                this.user = dashboardResponse.user || {};
                this.availableLots = dashboardResponse.available_lots || [];
                this.recentHistory = dashboardResponse.recent_reservations || [];

            
                try {
                    const historyResponse = await window.api.getParkingHistory(1, 5);
                    this.userStats = historyResponse.statistics || {};
                    if (historyResponse.reservations && historyResponse.reservations.length > 0) {
                        this.recentHistory = historyResponse.reservations;
                    }
                } catch (historyError) {
                    console.warn('Could not load history:', historyError);
                }

                
                await this.checkActiveReservation();

                console.log('✅ Dashboard data loaded successfully');

            } catch (error) {
                console.error('❌ Failed to load dashboard data:', error);
                this.error = 'Failed to load dashboard data. Please try again.';
            } finally {
                this.loading = false;
            }
        },

        async checkActiveReservation() {
            try {
                const response = await window.api.getActiveReservation();
                
                if (response.status === 'active') {
                    this.activeReservation = response.reservation;
                    this.activeReservation.spot = response.spot;
                    this.activeReservation.lot = response.lot;
                    this.reservedSpot = null;
                } else if (response.status === 'reserved') {
                    this.reservedSpot = response.reservation;
                    this.reservedSpot.spot = response.spot;
                    this.reservedSpot.lot = response.lot;
                    this.activeReservation = null;
                } else {
                    this.activeReservation = null;
                    this.reservedSpot = null;
                }
            } catch (error) {
              
                this.activeReservation = null;
                this.reservedSpot = null;
            }
        },

        async refreshActiveReservation() {
      
            await this.checkActiveReservation();
        },

        showReservationModal() {
            this.reservationForm = {
                lot_id: '',
                vehicle_number: ''
            };
            
            const modal = new bootstrap.Modal(document.getElementById('reservationModal'));
            modal.show();
        },

        async reserveSpotInLot(lot) {
           
            this.reservationForm.lot_id = lot.id;
            this.showReservationModal();
        },

        async makeReservation() {
            if (this.reserving) return;
            
            this.reserving = true;

            try {
                const response = await window.api.reserveSpot(
                    this.reservationForm.lot_id,
                    this.reservationForm.vehicle_number
                );

                window.utils?.showSuccess('Parking spot reserved successfully!');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
                modal.hide();

                // Refresh dashboard
                await this.loadDashboardData();

            } catch (error) {
                console.error('❌ Failed to reserve spot:', error);
                window.utils?.showError('Failed to reserve spot. Please try again.');
            } finally {
                this.reserving = false;
            }
        },

        async occupyReservedSpot() {
            if (this.occupying || !this.reservedSpot) return;
            
            this.occupying = true;

            try {
                await window.api.occupySpot(this.reservedSpot.id);
                window.utils?.showSuccess('Parking started! Enjoy your visit.');
                await this.loadDashboardData();

            } catch (error) {
                console.error('❌ Failed to occupy spot:', error);
                window.utils?.showError('Failed to start parking. Please try again.');
            } finally {
                this.occupying = false;
            }
        },

        async releaseCurrentSpot() {
            if (this.releasing || !this.activeReservation) return;
            
            if (!confirm('Are you sure you want to end your parking session?')) {
                return;
            }
            
            this.releasing = true;

            try {
                const response = await window.api.releaseSpot(this.activeReservation.id);
                
                window.utils?.showSuccess(
                    `Parking ended! Total cost: ₹${response.total_cost || 0}`
                );
                
                await this.loadDashboardData();

            } catch (error) {
                console.error('❌ Failed to release spot:', error);
                window.utils?.showError('Failed to end parking session. Please try again.');
            } finally {
                this.releasing = false;
            }
        },

        async cancelReservation() {
            if (this.cancelling || !this.reservedSpot) return;
            
            if (!confirm('Are you sure you want to cancel your reservation?')) {
                return;
            }
            
            this.cancelling = true;

            try {
            
                window.utils?.showInfo('Reservation cancelled.');
                await this.loadDashboardData();

            } catch (error) {
                console.error('❌ Failed to cancel reservation:', error);
                window.utils?.showError('Failed to cancel reservation. Please try again.');
            } finally {
                this.cancelling = false;
            }
        },

        async refreshDashboard() {
            await this.loadDashboardData();
            window.utils?.showInfo('Dashboard refreshed!');
        },

        logout() {
            if (confirm('Are you sure you want to logout?')) {
                window.auth?.logout();
                this.$router.push('/login');
            }
        },

        // Utility methods
        getCurrentParkingDuration() {
            if (!this.activeReservation?.parking_start_time) return 'N/A';
            
            const start = new Date(this.activeReservation.parking_start_time);
            const now = new Date();
            const diffMs = now - start;
            
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else {
                return `${minutes}m`;
            }
        },

        formatDateTime(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        getOccupancyClass(percentage) {
            if (percentage >= 80) return 'bg-danger';
            if (percentage >= 60) return 'bg-warning';
            return 'bg-success';
        },

        getStatusBadgeClass(status) {
            const classes = {
                'active': 'badge bg-primary',
                'completed': 'badge bg-success',
                'reserved': 'badge bg-warning',
                'cancelled': 'badge bg-secondary'
            };
            return classes[status] || 'badge bg-secondary';
        },

        getStatusText(status) {
            const texts = {
                'active': 'Active',
                'completed': 'Completed',
                'reserved': 'Reserved',
                'cancelled': 'Cancelled'
            };
            return texts[status] || status;
        }
    }
};

// Register component globally
if (window.Vue) {
    console.log('✅ UserDashboard component registered');
}