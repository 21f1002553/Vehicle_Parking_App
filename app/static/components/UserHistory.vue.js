

window.UserHistoryComponent = {
    name: 'UserHistory',
    template: `
    <div class="container-fluid">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1><i class="fas fa-history me-2"></i>My Parking History</h1>
                <p class="text-muted mb-0">View your detailed parking sessions and costs</p>
            </div>
            <router-link to="/user/dashboard" class="btn btn-outline-primary">
                <i class="fas fa-arrow-left me-2"></i>Back to Dashboard
            </router-link>
        </div>

        <!-- Summary Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <h6>Total Sessions</h6>
                        <h3>{{ statistics.total_sessions || 0 }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <h6>Total Spent</h6>
                        <h3>₹{{ statistics.total_cost || 0 }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <h6>Completed</h6>
                        <h3>{{ statistics.completed_sessions || 0 }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <h6>Active</h6>
                        <h3>{{ statistics.active_sessions || 0 }}</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <label class="form-label">Status</label>
                                <select v-model="filters.status" @change="loadHistory" class="form-select">
                                    <option value="">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="active">Active</option>
                                    <option value="reserved">Reserved</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Per Page</label>
                                <select v-model="filters.per_page" @change="loadHistory" class="form-select">
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                            <div class="col-md-6 d-flex align-items-end">
                                <button @click="resetFilters" class="btn btn-outline-secondary me-2">
                                    <i class="fas fa-undo me-1"></i>Reset
                                </button>
                                <button @click="loadHistory" class="btn btn-primary">
                                    <i class="fas fa-search me-1"></i>Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Loading your parking history...</p>
        </div>

        <!-- History Table -->
        <div v-else class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="fas fa-list me-2"></i>Parking Sessions
                            <span v-if="pagination.total" class="text-muted small">
                                ({{ pagination.total }} total)
                            </span>
                        </h5>
                    </div>
                    <div class="card-body">
                        <div v-if="reservations.length === 0" class="text-center py-5">
                            <i class="fas fa-history fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">No parking history found</h5>
                            <p class="text-muted">Start parking to see your history here!</p>
                            <router-link to="/user/dashboard" class="btn btn-primary">
                                <i class="fas fa-car me-1"></i>Find Parking
                            </router-link>
                        </div>

                        <div v-else>
                            <!-- Desktop Table -->
                            <div class="table-responsive d-none d-md-block">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Parking Lot</th>
                                            <th>Spot</th>
                                            <th>Vehicle</th>
                                            <th>Duration</th>
                                            <th>Cost</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="reservation in reservations" :key="reservation.id">
                                            <td>
                                                <div>{{ formatDate(reservation.reservation_time) }}</div>
                                                <small class="text-muted">{{ formatTime(reservation.reservation_time) }}</small>
                                            </td>
                                            <td>
                                                <strong>{{ getLotName(reservation) }}</strong><br>
                                                <small class="text-muted">₹{{ reservation.hourly_rate }}/hour</small>
                                            </td>
                                            <td>{{ getSpotNumber(reservation) }}</td>
                                            <td><code>{{ reservation.vehicle_number }}</code></td>
                                            <td>
                                                <span v-if="reservation.duration_formatted">
                                                    {{ reservation.duration_formatted }}
                                                </span>
                                                <span v-else-if="reservation.status === 'active'" class="text-primary">
                                                    <i class="fas fa-clock me-1"></i>Ongoing
                                                </span>
                                                <span v-else class="text-muted">-</span>
                                            </td>
                                            <td>
                                                <strong v-if="reservation.total_cost">₹{{ reservation.total_cost }}</strong>
                                                <span v-else class="text-muted">-</span>
                                            </td>
                                            <td>
                                                <span :class="getStatusBadgeClass(reservation.status)">
                                                    {{ getStatusText(reservation.status) }}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    v-if="reservation.status === 'completed'"
                                                    @click="viewCostBreakdown(reservation)"
                                                    class="btn btn-outline-info btn-sm"
                                                    title="View Cost Breakdown"
                                                >
                                                    <i class="fas fa-receipt"></i>
                                                </button>
                                                <button 
                                                    v-if="reservation.status === 'active'"
                                                    @click="endParking(reservation)"
                                                    class="btn btn-outline-danger btn-sm"
                                                    title="End Parking"
                                                >
                                                    <i class="fas fa-stop"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Mobile Cards -->
                            <div class="d-md-none">
                                <div v-for="reservation in reservations" :key="reservation.id" class="card mb-3">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <h6 class="card-title mb-0">{{ getLotName(reservation) }}</h6>
                                            <span :class="getStatusBadgeClass(reservation.status)">
                                                {{ getStatusText(reservation.status) }}
                                            </span>
                                        </div>
                                        <p class="text-muted small mb-2">
                                            {{ formatDateTime(reservation.reservation_time) }}
                                        </p>
                                        <div class="row text-center">
                                            <div class="col-4">
                                                <small class="text-muted">Spot</small><br>
                                                <strong>{{ getSpotNumber(reservation) }}</strong>
                                            </div>
                                            <div class="col-4">
                                                <small class="text-muted">Duration</small><br>
                                                <strong>{{ reservation.duration_formatted || '-' }}</strong>
                                            </div>
                                            <div class="col-4">
                                                <small class="text-muted">Cost</small><br>
                                                <strong>₹{{ reservation.total_cost || '-' }}</strong>
                                            </div>
                                        </div>
                                        <div v-if="reservation.status === 'completed'" class="mt-2">
                                            <button 
                                                @click="viewCostBreakdown(reservation)"
                                                class="btn btn-outline-info btn-sm w-100"
                                            >
                                                <i class="fas fa-receipt me-1"></i>View Cost Breakdown
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Pagination -->
                            <div v-if="pagination.pages > 1" class="d-flex justify-content-center">
                                <nav>
                                    <ul class="pagination">
                                        <li class="page-item" :class="{ disabled: !pagination.has_prev }">
                                            <button @click="changePage(pagination.page - 1)" class="page-link" :disabled="!pagination.has_prev">
                                                Previous
                                            </button>
                                        </li>
                                        <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === pagination.page }">
                                            <button @click="changePage(page)" class="page-link">{{ page }}</button>
                                        </li>
                                        <li class="page-item" :class="{ disabled: !pagination.has_next }">
                                            <button @click="changePage(pagination.page + 1)" class="page-link" :disabled="!pagination.has_next">
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cost Breakdown Modal -->
        <div v-if="showCostModal" class="modal fade show d-block" style="background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-receipt me-2"></i>Cost Breakdown
                        </h5>
                        <button @click="closeCostModal" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="selectedReservation && selectedReservation.cost_breakdown">
                            <div class="row mb-3">
                                <div class="col-6"><strong>Parking Lot:</strong></div>
                                <div class="col-6">{{ getLotName(selectedReservation) }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6"><strong>Vehicle:</strong></div>
                                <div class="col-6">{{ selectedReservation.vehicle_number }}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6"><strong>Duration:</strong></div>
                                <div class="col-6">{{ selectedReservation.duration_formatted }}</div>
                            </div>
                            
                            <hr>
                            
                            <div class="row mb-2">
                                <div class="col-6">Hourly Rate:</div>
                                <div class="col-6">₹{{ selectedReservation.hourly_rate }}/hour</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-6">Actual Duration:</div>
                                <div class="col-6">{{ selectedReservation.cost_breakdown.actual_duration_hours }}h</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-6">Billable Duration:</div>
                                <div class="col-6">{{ selectedReservation.cost_breakdown.billable_hours }}h</div>
                            </div>
                            <div v-if="selectedReservation.cost_breakdown.minimum_charge_applied" class="row mb-2">
                                <div class="col-12">
                                    <small class="text-info">
                                        <i class="fas fa-info-circle me-1"></i>
                                        Minimum 1 hour billing applied
                                    </small>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <div class="row">
                                <div class="col-6"><strong>Total Cost:</strong></div>
                                <div class="col-6"><strong>₹{{ selectedReservation.total_cost }}</strong></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="closeCostModal" class="btn btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            loading: false,
            reservations: [],
            statistics: {},
            pagination: {},
            filters: {
                status: '',
                per_page: 10
            },
            showCostModal: false,
            selectedReservation: null
        }
    },

    computed: {
        visiblePages() {
            const pages = [];
            const current = this.pagination.page || 1;
            const total = this.pagination.pages || 1;
            
            
            const start = Math.max(1, current - 2);
            const end = Math.min(total, current + 2);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            return pages;
        }
    },

    async mounted() {
        console.log('📜 User History mounted');
        await this.loadHistory();
    },

    methods: {
        async loadHistory() {
            try {
                this.loading = true;
                
                const response = await window.api.getDetailedParkingHistory(this.filters);
                
                this.reservations = response.reservations || [];
                this.statistics = response.statistics || {};
                this.pagination = response.pagination || {};
                
            } catch (error) {
                console.error('Error loading history:', error);
                this.$utils.handleApiError(error, 'loading parking history');
            } finally {
                this.loading = false;
            }
        },

        async changePage(page) {
            if (page >= 1 && page <= this.pagination.pages) {
                this.filters.page = page;
                await this.loadHistory();
            }
        },

        resetFilters() {
            this.filters = {
                status: '',
                per_page: 10
            };
            this.loadHistory();
        },

        viewCostBreakdown(reservation) {
            this.selectedReservation = reservation;
            this.showCostModal = true;
        },

        closeCostModal() {
            this.showCostModal = false;
            this.selectedReservation = null;
        },

        async endParking(reservation) {
            if (!confirm('Are you sure you want to end this parking session?')) return;
            
            try {
                await window.api.releaseSpot(reservation.id);
                this.$utils.showSuccess('Parking session ended successfully!');
                await this.loadHistory();
            } catch (error) {
                console.error('Error ending parking:', error);
                this.$utils.handleApiError(error, 'ending parking');
            }
        },

        getLotName(reservation) {
            return reservation.lot_details?.name || 'Unknown Lot';
        },

        getSpotNumber(reservation) {
            return reservation.spot_details?.spot_number || `Spot ${reservation.spot_id}`;
        },

        getStatusBadgeClass(status) {
            return `badge ${this.$utils.getStatusBadgeClass(status)}`;
        },

        getStatusText(status) {
            return this.$utils.getStatusText(status);
        },

        formatDateTime(dateString) {
            return this.$utils.formatDateTime(dateString);
        },

        formatDate(dateString) {
            return this.$utils.formatDate(dateString);
        },

        formatTime(dateString) {
            return this.$utils.formatTime(dateString);
        }
    }
};


if (window.Vue) {
    console.log('✅ UserHistory component registered');
}