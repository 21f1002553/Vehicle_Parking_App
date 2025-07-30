//Admin Dash

window.AdminDashboardComponent = {
    name: 'AdminDashboard',
    template: `
    <div class="container-fluid">
        <!-- Header -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h1><i class="fas fa-tachometer-alt me-2"></i>Admin Dashboard</h1>
                        <p class="text-muted mb-0">Manage parking lots, spots, and users</p>
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
            <p class="mt-2">Loading dashboard data...</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>{{ error }}
        </div>

        <!-- Dashboard Content -->
        <div v-if="!loading && !error">
            <!-- Statistics Cards -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6">
                    <div class="card bg-primary text-white mb-4">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-white-75 small">Total Users</div>
                                    <div class="text-lg fw-bold">{{ statistics.total_users }}</div>
                                </div>
                                <i class="fas fa-users fa-2x text-white-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="card bg-success text-white mb-4">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-white-75 small">Parking Lots</div>
                                    <div class="text-lg fw-bold">{{ statistics.total_parking_lots }}</div>
                                </div>
                                <i class="fas fa-building fa-2x text-white-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="card bg-warning text-white mb-4">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-white-75 small">Total Spots</div>
                                    <div class="text-lg fw-bold">{{ statistics.total_parking_spots }}</div>
                                </div>
                                <i class="fas fa-car fa-2x text-white-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="card bg-info text-white mb-4">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <div class="text-white-75 small">Total Revenue</div>
                                    <div class="text-lg fw-bold">₹{{ formatNumber(statistics.total_revenue) }}</div>
                                </div>
                                <i class="fas fa-rupee-sign fa-2x text-white-50"></i>
                            </div>
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
                                <div class="col-md-3 mb-2">
                                    <button @click="showCreateLotModal" class="btn btn-primary w-100">
                                        <i class="fas fa-plus me-2"></i>Create Parking Lot
                                    </button>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <router-link to="/admin/lots" class="btn btn-info w-100">
                                        <i class="fas fa-building me-2"></i>Manage Lots
                                    </router-link>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <router-link to="/admin/users" class="btn btn-success w-100">
                                        <i class="fas fa-users me-2"></i>Manage Users
                                    </router-link>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <router-link to="/admin/analytics" class="btn btn-warning w-100">
                                        <i class="fas fa-chart-bar me-2"></i>View Analytics
                                    </router-link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content Tabs -->
            <div class="row">
                <!-- Parking Lots Overview -->
                <div class="col-lg-8">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5><i class="fas fa-building me-2"></i>Parking Lots Overview</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Location</th>
                                            <th>Total Spots</th>
                                            <th>Available</th>
                                            <th>Occupancy</th>
                                            <th>Price/Hour</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="lot in parkingLots" :key="lot.id">
                                            <td><strong>{{ lot.name }}</strong></td>
                                            <td class="small">{{ lot.address.substring(0, 30) }}...</td>
                                            <td>{{ lot.total_spots }}</td>
                                            <td>
                                                <span class="badge bg-success">{{ lot.available_spots }}</span>
                                            </td>
                                            <td>
                                                <div class="progress" style="height: 20px;">
                                                    <div class="progress-bar" 
                                                         :class="getOccupancyClass(lot.occupancy_rate)"
                                                         :style="{width: lot.occupancy_rate + '%'}">
                                                        {{ lot.occupancy_rate }}%
                                                    </div>
                                                </div>
                                            </td>
                                            <td>₹{{ lot.price_per_hour }}</td>
                                            <td>
                                                <button @click="editLot(lot)" class="btn btn-sm btn-outline-primary me-1">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button @click="deleteLot(lot)" class="btn btn-sm btn-outline-danger">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity & System Status -->
                <div class="col-lg-4">
                    <!-- System Status -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5><i class="fas fa-heartbeat me-2"></i>System Status</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span>Overall Occupancy</span>
                                <span class="badge bg-info">{{ statistics.occupancy_rate }}%</span>
                            </div>
                            <div class="progress mb-3">
                                <div class="progress-bar bg-info" 
                                     :style="{width: statistics.occupancy_rate + '%'}">
                                </div>
                            </div>
                            
                            <div class="small">
                                <div class="d-flex justify-content-between">
                                    <span>Occupied Spots:</span>
                                    <span>{{ statistics.occupied_spots }}</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Available Spots:</span>
                                    <span>{{ statistics.available_spots }}</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Active Reservations:</span>
                                    <span>{{ statistics.active_reservations }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Reservations -->
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-clock me-2"></i>Recent Activity</h5>
                        </div>
                        <div class="card-body">
                            <div v-if="recentReservations.length === 0" class="text-muted text-center py-3">
                                No recent activity
                            </div>
                            <div v-else>
                                <div v-for="reservation in recentReservations" :key="reservation.id" 
                                     class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                    <div>
                                        <div class="fw-bold small">{{ reservation.vehicle_number }}</div>
                                        <div class="text-muted x-small">{{ formatDateTime(reservation.created_at) }}</div>
                                    </div>
                                    <span :class="getStatusBadgeClass(reservation.status)">
                                        {{ getStatusText(reservation.status) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create/Edit Parking Lot Modal -->
        <div class="modal fade" id="lotModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            {{ editingLot ? 'Edit Parking Lot' : 'Create New Parking Lot' }}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form @submit.prevent="saveLot">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Lot Name *</label>
                                <input v-model="lotForm.name" type="text" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Address *</label>
                                <textarea v-model="lotForm.address" class="form-control" rows="2" required></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">PIN Code *</label>
                                        <input v-model="lotForm.pin_code" type="text" class="form-control" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Total Spots *</label>
                                        <input v-model.number="lotForm.total_spots" type="number" class="form-control" min="1" required>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Price per Hour (₹) *</label>
                                <input v-model.number="lotForm.price_per_hour" type="number" class="form-control" min="0.01" step="0.01" required>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="savingLot">
                                <span v-if="savingLot" class="spinner-border spinner-border-sm me-2"></span>
                                {{ editingLot ? 'Update' : 'Create' }}
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
            statistics: {
                total_users: 0,
                total_parking_lots: 0,
                total_parking_spots: 0,
                occupied_spots: 0,
                available_spots: 0,
                occupancy_rate: 0,
                active_reservations: 0,
                total_revenue: 0
            },
            parkingLots: [],
            recentReservations: [],
            
            // Modal form data
            editingLot: false,
            savingLot: false,
            lotForm: {
                name: '',
                address: '',
                pin_code: '',
                total_spots: 10,
                price_per_hour: 50.0
            }
        }
    },

    mounted() {
        console.log('🎛️ Admin Dashboard mounted');
        this.loadDashboardData();
    },

    methods: {
        async loadDashboardData() {
            this.loading = true;
            this.error = null;

            try {
                // Dashboard statistics
                const dashboardResponse = await window.api.getAdminDashboard();
                this.statistics = dashboardResponse.statistics || {};
                this.recentReservations = dashboardResponse.recent_reservations || [];

                // Parking lots
                const lotsResponse = await window.api.getAdminParkingLots();
                this.parkingLots = lotsResponse.parking_lots || [];

                console.log('Dashboard data loaded successfully');

            } catch (error) {
                console.error('Failed to load dashboard data:', error);
                this.error = 'Failed to load dashboard data. Please try again.';
            } finally {
                this.loading = false;
            }
        },

        showCreateLotModal() {
            this.editingLot = false;
            this.lotForm = {
                name: '',
                address: '',
                pin_code: '',
                total_spots: 10,
                price_per_hour: 50.0
            };
            
            const modal = new bootstrap.Modal(document.getElementById('lotModal'));
            modal.show();
        },

        editLot(lot) {
            this.editingLot = true;
            this.lotForm = {
                id: lot.id,
                name: lot.name,
                address: lot.address,
                pin_code: lot.pin_code,
                total_spots: lot.total_spots,
                price_per_hour: lot.price_per_hour
            };
            
            const modal = new bootstrap.Modal(document.getElementById('lotModal'));
            modal.show();
        },

        async saveLot() {
            if (this.savingLot) return;
            
            this.savingLot = true;

            try {
                if (this.editingLot) {
                    // Update existing lot
                    await window.api.updateParkingLot(this.lotForm.id, this.lotForm);
                    window.utils?.showSuccess('Parking lot updated successfully!');
                } else {
                    // Create new lot
                    await window.api.createParkingLot(this.lotForm);
                    window.utils?.showSuccess('Parking lot created successfully!');
                }

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('lotModal'));
                modal.hide();

                // Reload data
                await this.loadDashboardData();

            } catch (error) {
                console.error('❌ Failed to save parking lot:', error);
                window.utils?.showError('Failed to save parking lot. Please try again.');
            } finally {
                this.savingLot = false;
            }
        },

        async deleteLot(lot) {
            if (!confirm(`Are you sure you want to delete "${lot.name}"? This action cannot be undone.`)) {
                return;
            }

            try {
                await window.api.deleteParkingLot(lot.id);
                window.utils?.showSuccess('Parking lot deleted successfully!');
                await this.loadDashboardData();

            } catch (error) {
                console.error('❌ Failed to delete parking lot:', error);
                window.utils?.showError('Failed to delete parking lot. Please try again.');
            }
        },

        logout() {
            if (confirm('Are you sure you want to logout?')) {
                window.auth?.logout();
                this.$router.push('/login');
            }
        },

        // Utility methods
        formatNumber(num) {
            return new Intl.NumberFormat('en-IN').format(num || 0);
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
    console.log('AdminDashboard component registered');
}