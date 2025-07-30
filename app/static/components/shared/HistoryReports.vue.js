/**
 * HistoryReports.vue.js - History & Reports Component
 * Comprehensive parking history with filtering, reporting, and export features
 */

window.HistoryReportsComponent = {
    name: 'HistoryReports',
    template: `
    <div class="container-fluid">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2><i class="fas fa-history me-2"></i>Parking History & Reports</h2>
                <p class="text-muted mb-0">View your complete parking history and generate reports</p>
            </div>
            <div class="d-flex gap-2">
                <button 
                    class="btn btn-success" 
                    @click="exportToCSV"
                    :disabled="loading || filteredHistory.length === 0"
                >
                    <i class="fas fa-download me-2"></i>Export CSV
                </button>
                <button 
                    class="btn btn-info" 
                    @click="generateReport"
                    :disabled="loading || filteredHistory.length === 0"
                >
                    <i class="fas fa-file-pdf me-2"></i>Generate Report
                </button>
            </div>
        </div>

        <!-- Statistics Overview -->
        <div class="row mb-4">
            <div class="col-md-2">
                <div class="card text-center">
                    <div class="card-body">
                        <h4 class="text-primary">{{ statistics.total_sessions }}</h4>
                        <small class="text-muted">Total Sessions</small>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card text-center">
                    <div class="card-body">
                        <h4 class="text-success">{{ statistics.completed_sessions }}</h4>
                        <small class="text-muted">Completed</small>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card text-center">
                    <div class="card-body">
                        <h4 class="text-warning">{{ statistics.active_sessions }}</h4>
                        <small class="text-muted">Active</small>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card text-center">
                    <div class="card-body">
                        <h4 class="text-info">{{ formatHours(statistics.total_hours) }}</h4>
                        <small class="text-muted">Total Hours</small>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card text-center">
                    <div class="card-body">
                        <h4 class="text-success">₹{{ formatCurrency(statistics.total_cost) }}</h4>
                        <small class="text-muted">Total Spent</small>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card text-center">
                    <div class="card-body">
                        <h4 class="text-primary">₹{{ formatCurrency(statistics.avg_cost) }}</h4>
                        <small class="text-muted">Avg Session</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="card mb-4">
            <div class="card-header">
                <h5><i class="fas fa-filter me-2"></i>Filters & Search</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3 mb-3">
                        <label class="form-label">Search</label>
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                            <input 
                                type="text" 
                                class="form-control" 
                                placeholder="Location, vehicle number..."
                                v-model="filters.search"
                                @input="applyFilters"
                            >
                        </div>
                    </div>
                    <div class="col-md-2 mb-3">
                        <label class="form-label">Status</label>
                        <select 
                            class="form-select" 
                            v-model="filters.status"
                            @change="applyFilters"
                        >
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="active">Active</option>
                            <option value="reserved">Reserved</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div class="col-md-2 mb-3">
                        <label class="form-label">Date From</label>
                        <input 
                            type="date" 
                            class="form-control"
                            v-model="filters.dateFrom"
                            @change="applyFilters"
                        >
                    </div>
                    <div class="col-md-2 mb-3">
                        <label class="form-label">Date To</label>
                        <input 
                            type="date" 
                            class="form-control"
                            v-model="filters.dateTo"
                            @change="applyFilters"
                        >
                    </div>
                    <div class="col-md-2 mb-3">
                        <label class="form-label">Sort By</label>
                        <select 
                            class="form-select" 
                            v-model="filters.sortBy"
                            @change="applyFilters"
                        >
                            <option value="date_desc">Date (Newest)</option>
                            <option value="date_asc">Date (Oldest)</option>
                            <option value="cost_desc">Cost (Highest)</option>
                            <option value="cost_asc">Cost (Lowest)</option>
                            <option value="duration_desc">Duration (Longest)</option>
                            <option value="duration_asc">Duration (Shortest)</option>
                        </select>
                    </div>
                    <div class="col-md-1 mb-3">
                        <label class="form-label">&nbsp;</label>
                        <button 
                            class="btn btn-outline-secondary w-100"
                            @click="clearFilters"
                        >
                            <i class="fas fa-eraser"></i>
                        </button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <small class="text-muted">
                            Showing {{ filteredHistory.length }} of {{ parkingHistory.length }} sessions
                            <span v-if="hasActiveFilters">
                                (filtered)
                            </span>
                        </small>
                    </div>
                </div>
            </div>
        </div>

        <!-- History Table -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5><i class="fas fa-table me-2"></i>Parking Sessions</h5>
                <div class="d-flex gap-2">
                    <select 
                        class="form-select form-select-sm" 
                        v-model="perPage"
                        @change="updatePagination"
                        style="width: auto;"
                    >
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                        <option value="100">100 per page</option>
                    </select>
                    <button 
                        class="btn btn-outline-secondary btn-sm" 
                        @click="loadParkingHistory"
                        :disabled="loading"
                    >
                        <i class="fas fa-sync-alt" :class="{'fa-spin': loading}"></i>
                    </button>
                </div>
            </div>
            <div class="card-body p-0">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                    <p class="mt-2">Loading parking history...</p>
                </div>

                <div v-else-if="error" class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>{{ error }}
                    <button class="btn btn-sm btn-outline-danger ms-2" @click="loadParkingHistory">
                        <i class="fas fa-retry me-1"></i>Retry
                    </button>
                </div>

                <div v-else-if="filteredHistory.length === 0" class="text-center py-5">
                    <i class="fas fa-history fa-3x text-muted mb-3"></i>
                    <h5>No parking history found</h5>
                    <p class="text-muted">
                        {{ parkingHistory.length === 0 ? 
                           'Start parking to see your history here.' : 
                           'Try adjusting your filters to see more results.' }}
                    </p>
                    <button v-if="hasActiveFilters" class="btn btn-primary" @click="clearFilters">
                        <i class="fas fa-eraser me-2"></i>Clear Filters
                    </button>
                </div>

                <div v-else class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-dark">
                            <tr>
                                <th>Date & Time</th>
                                <th>Location & Spot</th>
                                <th>Vehicle</th>
                                <th>Duration</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="session in paginatedHistory" :key="session.id">
                                <td>
                                    <div>
                                        <strong>{{ formatDate(session.reservation_time) }}</strong><br>
                                        <small class="text-muted">
                                            {{ formatTime(session.reservation_time) }}
                                        </small>
                                        <div v-if="session.parking_start_time && session.status === 'completed'">
                                            <small class="text-success">
                                                {{ formatTime(session.parking_start_time) }} - 
                                                {{ formatTime(session.parking_end_time) }}
                                            </small>
                                        </div>
                                        <div v-else-if="session.parking_start_time">
                                            <small class="text-primary">
                                                Started: {{ formatTime(session.parking_start_time) }}
                                            </small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div>
                                        <strong>{{ session.lot_details?.name || 'Unknown Lot' }}</strong><br>
                                        <small class="text-muted">
                                            Spot: {{ session.spot_details?.spot_number || 'N/A' }}
                                        </small><br>
                                        <small class="text-muted">
                                            {{ truncateAddress(session.lot_details?.address) }}
                                        </small>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-light text-dark">{{ session.vehicle_number }}</span>
                                </td>
                                <td>
                                    <div>
                                        <strong>{{ session.duration_formatted || getActiveDuration(session) || 'N/A' }}</strong>
                                        <div v-if="session.duration_hours">
                                            <small class="text-muted">{{ formatHours(session.duration_hours) }}</small>
                                        </div>
                                        <div v-if="session.hourly_rate">
                                            <small class="text-info">₹{{ session.hourly_rate }}/hr</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div v-if="session.total_cost">
                                        <strong class="text-success">₹{{ formatCurrency(session.total_cost) }}</strong>
                                        <div v-if="session.cost_breakdown?.minimum_charge_applied">
                                            <small class="text-warning">Min charge</small>
                                        </div>
                                    </div>
                                    <span v-else class="text-muted">-</span>
                                </td>
                                <td>
                                    <span 
                                        class="badge"
                                        :class="getStatusBadgeClass(session.status)"
                                    >
                                        {{ getStatusText(session.status) }}
                                    </span>
                                    <div v-if="session.status === 'active'" class="mt-1">
                                        <small class="text-primary">{{ getActiveDuration(session) }}</small>
                                    </div>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button 
                                            class="btn btn-outline-info" 
                                            @click="viewDetails(session)"
                                            title="View details"
                                        >
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button 
                                            v-if="session.total_cost"
                                            class="btn btn-outline-success" 
                                            @click="downloadReceipt(session)"
                                            title="Download receipt"
                                        >
                                            <i class="fas fa-receipt"></i>
                                        </button>
                                        <button 
                                            v-if="session.status === 'active'"
                                            class="btn btn-outline-danger" 
                                            @click="endSession(session)"
                                            title="End parking"
                                        >
                                            <i class="fas fa-stop"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div v-if="filteredHistory.length > perPage" class="card-footer">
                    <nav>
                        <ul class="pagination pagination-sm justify-content-center mb-0">
                            <li class="page-item" :class="{ disabled: currentPage === 1 }">
                                <button class="page-link" @click="goToPage(currentPage - 1)">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                            </li>
                            <li 
                                v-for="page in visiblePages" 
                                :key="page"
                                class="page-item" 
                                :class="{ active: page === currentPage, disabled: page === '...' }"
                            >
                                <button v-if="page !== '...'" class="page-link" @click="goToPage(page)">{{ page }}</button>
                                <span v-else class="page-link">...</span>
                            </li>
                            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                                <button class="page-link" @click="goToPage(currentPage + 1)">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                    <div class="text-center mt-2">
                        <small class="text-muted">
                            Page {{ currentPage }} of {{ totalPages }} 
                            ({{ filteredHistory.length }} total sessions)
                        </small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Details Modal -->
        <div 
            class="modal fade" 
            :class="{ show: showDetailsModal }"
            :style="{ display: showDetailsModal ? 'block' : 'none' }"
            tabindex="-1"
        >
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-info-circle me-2"></i>
                            Session Details
                        </h5>
                        <button 
                            type="button" 
                            class="btn-close" 
                            @click="showDetailsModal = false"
                        ></button>
                    </div>

                    <div class="modal-body">
                        <div v-if="selectedSession">
                            <!-- Session Overview -->
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-calendar me-1"></i>Session Information</h6>
                                    <table class="table table-sm">
                                        <tr>
                                            <td><strong>Reservation ID:</strong></td>
                                            <td>#{{ selectedSession.id }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Status:</strong></td>
                                            <td>
                                                <span 
                                                    class="badge"
                                                    :class="getStatusBadgeClass(selectedSession.status)"
                                                >
                                                    {{ getStatusText(selectedSession.status) }}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Vehicle:</strong></td>
                                            <td>{{ selectedSession.vehicle_number }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Reserved:</strong></td>
                                            <td>{{ formatDateTime(selectedSession.reservation_time) }}</td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-map-marker-alt me-1"></i>Location Details</h6>
                                    <table class="table table-sm">
                                        <tr>
                                            <td><strong>Parking Lot:</strong></td>
                                            <td>{{ selectedSession.lot_details?.name || 'Unknown' }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Spot Number:</strong></td>
                                            <td>{{ selectedSession.spot_details?.spot_number || 'N/A' }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Address:</strong></td>
                                            <td>{{ selectedSession.lot_details?.address || 'N/A' }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Hourly Rate:</strong></td>
                                            <td>₹{{ selectedSession.hourly_rate || 'N/A' }}/hour</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>

                            <!-- Timing Details -->
                            <div v-if="selectedSession.parking_start_time" class="mb-4">
                                <h6><i class="fas fa-clock me-1"></i>Timing & Duration</h6>
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="card bg-light">
                                            <div class="card-body text-center p-3">
                                                <h6 class="text-success">Start Time</h6>
                                                <p class="mb-0">{{ formatDateTime(selectedSession.parking_start_time) }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-light">
                                            <div class="card-body text-center p-3">
                                                <h6 class="text-danger">End Time</h6>
                                                <p class="mb-0">
                                                    {{ selectedSession.parking_end_time ? 
                                                       formatDateTime(selectedSession.parking_end_time) : 
                                                       'Still parking...' }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-light">
                                            <div class="card-body text-center p-3">
                                                <h6 class="text-primary">Duration</h6>
                                                <p class="mb-0">
                                                    {{ selectedSession.duration_formatted || 
                                                       getActiveDuration(selectedSession) || 'N/A' }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Cost Breakdown -->
                            <div v-if="selectedSession.total_cost" class="mb-4">
                                <h6><i class="fas fa-calculator me-1"></i>Cost Breakdown</h6>
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-8">
                                                <table class="table table-sm">
                                                    <tr>
                                                        <td>Hourly Rate:</td>
                                                        <td><strong>₹{{ selectedSession.hourly_rate }}/hour</strong></td>
                                                    </tr>
                                                    <tr v-if="selectedSession.cost_breakdown">
                                                        <td>Actual Duration:</td>
                                                        <td><strong>{{ selectedSession.cost_breakdown.actual_duration_hours }} hours</strong></td>
                                                    </tr>
                                                    <tr v-if="selectedSession.cost_breakdown">
                                                        <td>Billable Duration:</td>
                                                        <td><strong>{{ selectedSession.cost_breakdown.billable_hours }} hours</strong></td>
                                                    </tr>
                                                    <tr v-if="selectedSession.cost_breakdown?.minimum_charge_applied">
                                                        <td colspan="2">
                                                            <small class="text-warning">
                                                                <i class="fas fa-info-circle me-1"></i>
                                                                Minimum 1-hour charge applied
                                                            </small>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="text-center p-3 bg-white rounded">
                                                    <h6 class="text-muted">Total Amount</h6>
                                                    <h2 class="text-success mb-0">₹{{ formatCurrency(selectedSession.total_cost) }}</h2>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button 
                            type="button" 
                            class="btn btn-secondary" 
                            @click="showDetailsModal = false"
                        >
                            Close
                        </button>
                        <button 
                            v-if="selectedSession?.total_cost"
                            type="button" 
                            class="btn btn-success"
                            @click="downloadReceipt(selectedSession)"
                        >
                            <i class="fas fa-download me-2"></i>Download Receipt
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Backdrop -->
        <div 
            v-if="showDetailsModal"
            class="modal-backdrop fade show"
            @click="showDetailsModal = false"
        ></div>
    </div>
    `,

    data() {
        return {
            parkingHistory: [],
            filteredHistory: [],
            loading: false,
            error: null,
            
            // Statistics
            statistics: {
                total_sessions: 0,
                completed_sessions: 0,
                active_sessions: 0,
                total_hours: 0,
                total_cost: 0,
                avg_cost: 0
            },
            
            // Filters
            filters: {
                search: '',
                status: '',
                dateFrom: '',
                dateTo: '',
                sortBy: 'date_desc'
            },
            
            // Pagination
            currentPage: 1,
            perPage: 25,
            
            // Modal
            showDetailsModal: false,
            selectedSession: null
        }
    },

    computed: {
        hasActiveFilters() {
            return this.filters.search || 
                   this.filters.status || 
                   this.filters.dateFrom || 
                   this.filters.dateTo;
        },

        totalPages() {
            return Math.ceil(this.filteredHistory.length / this.perPage);
        },

        paginatedHistory() {
            const start = (this.currentPage - 1) * this.perPage;
            const end = start + this.perPage;
            return this.filteredHistory.slice(start, end);
        },

        visiblePages() {
            const pages = [];
            const total = this.totalPages;
            const current = this.currentPage;
            
            if (total <= 7) {
                for (let i = 1; i <= total; i++) {
                    pages.push(i);
                }
            } else {
                if (current <= 4) {
                    for (let i = 1; i <= 5; i++) {
                        pages.push(i);
                    }
                    pages.push('...', total);
                } else if (current >= total - 3) {
                    pages.push(1, '...');
                    for (let i = total - 4; i <= total; i++) {
                        pages.push(i);
                    }
                } else {
                    pages.push(1, '...', current - 1, current, current + 1, '...', total);
                }
            }
            
            return pages;
        }
    },

    mounted() {
        console.log('📊 History & Reports component mounted');
        this.loadParkingHistory();
        this.setDefaultDateRange();
    },

    methods: {
        /**
         * Load parking history
         */
        async loadParkingHistory() {
            this.loading = true;
            this.error = null;

            try {
                const response = await window.api.getDetailedParkingHistory({
                    per_page: 1000 // Load all for client-side filtering
                });
                
                this.parkingHistory = response.reservations || [];
                this.calculateStatistics();
                this.applyFilters();
                
                console.log('Parking history loaded:', this.parkingHistory.length, 'sessions');
                
            } catch (error) {
                console.error('Failed to load parking history:', error);
                this.error = 'Failed to load parking history. Please try again.';
                this.parkingHistory = [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Calculate statistics
         */
        calculateStatistics() {
            const history = this.parkingHistory;
            
            this.statistics = {
                total_sessions: history.length,
                completed_sessions: history.filter(s => s.status === 'completed').length,
                active_sessions: history.filter(s => s.status === 'active').length,
                total_hours: history.reduce((sum, s) => sum + (s.duration_hours || 0), 0),
                total_cost: history.reduce((sum, s) => sum + (s.total_cost || 0), 0),
                avg_cost: 0
            };
            
            if (this.statistics.completed_sessions > 0) {
                const completedCosts = history
                    .filter(s => s.status === 'completed' && s.total_cost)
                    .map(s => s.total_cost);
                    
                this.statistics.avg_cost = completedCosts.length > 0 ? 
                    completedCosts.reduce((sum, cost) => sum + cost, 0) / completedCosts.length : 0;
            }
        },

        /**
         * Apply filters
         */
        applyFilters() {
            let filtered = [...this.parkingHistory];

            // Search filter
            if (this.filters.search) {
                const query = this.filters.search.toLowerCase();
                filtered = filtered.filter(session => 
                    (session.lot_details?.name || '').toLowerCase().includes(query) ||
                    (session.lot_details?.address || '').toLowerCase().includes(query) ||
                    (session.vehicle_number || '').toLowerCase().includes(query) ||
                    (session.spot_details?.spot_number || '').toLowerCase().includes(query)
                );
            }

            // Status filter
            if (this.filters.status) {
                filtered = filtered.filter(session => session.status === this.filters.status);
            }

            // Date filters
            if (this.filters.dateFrom) {
                const fromDate = new Date(this.filters.dateFrom);
                filtered = filtered.filter(session => {
                    const sessionDate = new Date(session.reservation_time);
                    return sessionDate >= fromDate;
                });
            }

            if (this.filters.dateTo) {
                const toDate = new Date(this.filters.dateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                filtered = filtered.filter(session => {
                    const sessionDate = new Date(session.reservation_time);
                    return sessionDate <= toDate;
                });
            }

            // Sort
            this.sortHistory(filtered);

            this.filteredHistory = filtered;
            this.currentPage = 1; // Reset to first page
        },

        /**
         * Sort history
         */
        sortHistory(history) {
            history.sort((a, b) => {
                switch (this.filters.sortBy) {
                    case 'date_desc':
                        return new Date(b.reservation_time) - new Date(a.reservation_time);
                    case 'date_asc':
                        return new Date(a.reservation_time) - new Date(b.reservation_time);
                    case 'cost_desc':
                        return (b.total_cost || 0) - (a.total_cost || 0);
                    case 'cost_asc':
                        return (a.total_cost || 0) - (b.total_cost || 0);
                    case 'duration_desc':
                        return (b.duration_hours || 0) - (a.duration_hours || 0);
                    case 'duration_asc':
                        return (a.duration_hours || 0) - (b.duration_hours || 0);
                    default:
                        return 0;
                }
            });
        },

        /**
         * Clear filters
         */
        clearFilters() {
            this.filters = {
                search: '',
                status: '',
                dateFrom: '',
                dateTo: '',
                sortBy: 'date_desc'
            };
            this.applyFilters();
        },

        /**
         * Set default date range (last 30 days)
         */
        setDefaultDateRange() {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            this.filters.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
            this.filters.dateTo = today.toISOString().split('T')[0];
        },

        /**
         * Pagination methods
         */
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages && page !== '...') {
                this.currentPage = page;
            }
        },

        updatePagination() {
            this.currentPage = 1;
        },

        /**
         * View session details
         */
        viewDetails(session) {
            this.selectedSession = session;
            this.showDetailsModal = true;
        },

        /**
         * End active session
         */
        async endSession(session) {
            if (!confirm('Are you sure you want to end this parking session?')) {
                return;
            }

            try {
                await window.api.releaseSpot(session.id);
                
                if (window.utils?.showSuccess) {
                    window.utils.showSuccess('Parking session ended successfully');
                }
                
                // Reload history
                this.loadParkingHistory();
                
            } catch (error) {
                console.error('Failed to end session:', error);
                if (window.utils?.showError) {
                    window.utils.showError('Failed to end parking session');
                }
            }
        },

        /**
         * Export to CSV
         */
        exportToCSV() {
            try {
                const headers = [
                    'Date', 'Location', 'Spot', 'Vehicle', 'Start Time', 'End Time', 
                    'Duration (hours)', 'Rate (₹/hr)', 'Total Cost (₹)', 'Status'
                ];

                const csvData = this.filteredHistory.map(session => [
                    this.formatDate(session.reservation_time),
                    session.lot_details?.name || 'Unknown',
                    session.spot_details?.spot_number || 'N/A',
                    session.vehicle_number,
                    session.parking_start_time ? this.formatDateTime(session.parking_start_time) : '',
                    session.parking_end_time ? this.formatDateTime(session.parking_end_time) : '',
                    session.duration_hours || '',
                    session.hourly_rate || '',
                    session.total_cost || '',
                    session.status
                ]);

                const csv = [headers, ...csvData]
                    .map(row => row.map(field => `"₹{field}"`).join(','))
                    .join('\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `parking-history-₹{new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                if (window.utils?.showSuccess) {
                    window.utils.showSuccess('History exported to CSV successfully');
                }

            } catch (error) {
                console.error('Failed to export CSV:', error);
                if (window.utils?.showError) {
                    window.utils.showError('Failed to export history');
                }
            }
        },

        /**
         * Generate report
         */
        generateReport() {
            try {
                const reportData = this.generateReportData();
                const reportText = this.formatReportText(reportData);

                const blob = new Blob([reportText], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `parking-report-₹{new Date().toISOString().split('T')[0]}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                if (window.utils?.showSuccess) {
                    window.utils.showSuccess('Report generated successfully');
                }

            } catch (error) {
                console.error('Failed to generate report:', error);
                if (window.utils?.showError) {
                    window.utils.showError('Failed to generate report');
                }
            }
        },

        /**
         * Generate report data
         */
        generateReportData() {
            const data = this.filteredHistory;
            
            // Group by location
            const byLocation = {};
            data.forEach(session => {
                const location = session.lot_details?.name || 'Unknown';
                if (!byLocation[location]) {
                    byLocation[location] = {
                        sessions: 0,
                        totalCost: 0,
                        totalHours: 0
                    };
                }
                byLocation[location].sessions++;
                byLocation[location].totalCost += session.total_cost || 0;
                byLocation[location].totalHours += session.duration_hours || 0;
            });

            // Group by month
            const byMonth = {};
            data.forEach(session => {
                const month = new Date(session.reservation_time).toISOString().substr(0, 7);
                if (!byMonth[month]) {
                    byMonth[month] = {
                        sessions: 0,
                        totalCost: 0,
                        totalHours: 0
                    };
                }
                byMonth[month].sessions++;
                byMonth[month].totalCost += session.total_cost || 0;
                byMonth[month].totalHours += session.duration_hours || 0;
            });

            return {
                summary: this.statistics,
                byLocation,
                byMonth,
                dateRange: {
                    from: this.filters.dateFrom,
                    to: this.filters.dateTo
                }
            };
        },

        /**
         * Format report text
         */
        formatReportText(data) {
            const lines = [];
            
            lines.push('PARKING HISTORY REPORT');
            lines.push('='.repeat(50));
            lines.push(`Generated: ₹{new Date().toLocaleString('en-IN')}`);
            lines.push(`Report Period: ₹{data.dateRange.from || 'All time'} to ₹{data.dateRange.to || 'Present'}`);
            lines.push('');
            
            // Summary
            lines.push('SUMMARY');
            lines.push('-'.repeat(20));
            lines.push(`Total Sessions: ₹{data.summary.total_sessions}`);
            lines.push(`Completed Sessions: ₹{data.summary.completed_sessions}`);
            lines.push(`Active Sessions: ₹{data.summary.active_sessions}`);
            lines.push(`Total Hours Parked: ₹{this.formatHours(data.summary.total_hours)}`);
            lines.push(`Total Amount Spent: ₹₹{this.formatCurrency(data.summary.total_cost)}`);
            lines.push(`Average Session Cost: ₹₹{this.formatCurrency(data.summary.avg_cost)}`);
            lines.push('');
            
            // By Location
            lines.push('USAGE BY LOCATION');
            lines.push('-'.repeat(30));
            Object.entries(data.byLocation).forEach(([location, stats]) => {
                lines.push(`₹{location}:`);
                lines.push(`  Sessions: ₹{stats.sessions}`);
                lines.push(`  Total Cost: ₹₹{this.formatCurrency(stats.totalCost)}`);
                lines.push(`  Total Hours: ₹{this.formatHours(stats.totalHours)}`);
                lines.push(`  Avg Cost/Session: ₹₹{this.formatCurrency(stats.totalCost / stats.sessions)}`);
                lines.push('');
            });
            
            // By Month
            lines.push('MONTHLY BREAKDOWN');
            lines.push('-'.repeat(25));
            Object.entries(data.byMonth)
                .sort(([a], [b]) => b.localeCompare(a))
                .forEach(([month, stats]) => {
                    lines.push(`₹{month}:`);
                    lines.push(`  Sessions: ₹{stats.sessions}`);
                    lines.push(`  Total Cost: ₹₹{this.formatCurrency(stats.totalCost)}`);
                    lines.push(`  Total Hours: ₹{this.formatHours(stats.totalHours)}`);
                    lines.push('');
                });
            
            return lines.join('\n');
        },

        /**
         * Download receipt
         */
        downloadReceipt(session) {
            try {
                const receipt = this.generateReceiptText(session);
                
                const blob = new Blob([receipt], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `receipt-₹{session.id}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                if (window.utils?.showSuccess) {
                    window.utils.showSuccess('Receipt downloaded successfully');
                }
                
            } catch (error) {
                console.error('Failed to download receipt:', error);
                if (window.utils?.showError) {
                    window.utils.showError('Failed to download receipt');
                }
            }
        },

        /**
         * Generate receipt text
         */
        generateReceiptText(session) {
            return `
PARKING RECEIPT
===============

Reservation ID: #₹{session.id}
Location: ₹{session.lot_details?.name || 'Unknown'}
Address: ₹{session.lot_details?.address || 'N/A'}
Spot: ₹{session.spot_details?.spot_number || 'N/A'}
Vehicle: ₹{session.vehicle_number}

TIMING
------
Reserved: ₹{this.formatDateTime(session.reservation_time)}
Started: ₹{session.parking_start_time ? this.formatDateTime(session.parking_start_time) : 'N/A'}
Ended: ₹{session.parking_end_time ? this.formatDateTime(session.parking_end_time) : 'N/A'}
Duration: ₹{session.duration_formatted || 'N/A'}

BILLING
-------
Hourly Rate: ₹₹{session.hourly_rate}/hour
Duration: ₹{this.formatHours(session.duration_hours)}
₹{session.cost_breakdown?.minimum_charge_applied ? 'Minimum Charge: 1 hour\n' : ''}
TOTAL AMOUNT: ₹₹{this.formatCurrency(session.total_cost)}

Status: ₹{this.getStatusText(session.status)}

Thank you for using our parking service!
Generated: ₹{new Date().toLocaleString('en-IN')}
            `.trim();
        },

        /**
         * Utility methods
         */
        getStatusBadgeClass(status) {
            const classMap = {
                'completed': 'bg-success',
                'active': 'bg-primary',
                'reserved': 'bg-warning',
                'cancelled': 'bg-secondary'
            };
            return classMap[status] || 'bg-secondary';
        },

        getStatusText(status) {
            const textMap = {
                'completed': 'Completed',
                'active': 'Active',
                'reserved': 'Reserved',
                'cancelled': 'Cancelled'
            };
            return textMap[status] || status;
        },

        getActiveDuration(session) {
            if (session.status !== 'active' || !session.parking_start_time) return null;
            
            const start = new Date(session.parking_start_time);
            const now = new Date();
            const diff = now - start;
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
                return `₹{hours}h ₹{minutes}m (ongoing)`;
            } else {
                return `₹{minutes}m (ongoing)`;
            }
        },

        truncateAddress(address) {
            if (!address) return 'N/A';
            return address.length > 40 ? address.substring(0, 40) + '...' : address;
        },

        formatCurrency(amount) {
            if (!amount && amount !== 0) return '0.00';
            return parseFloat(amount).toFixed(2);
        },

        formatHours(hours) {
            if (!hours && hours !== 0) return '0h';
            return `₹{parseFloat(hours).toFixed(1)}h`;
        },

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        formatTime(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
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
        }
    }
};

// Register component globally
if (window.Vue) {
    window.Vue.createApp({}).component('history-reports', window.HistoryReportsComponent);
    console.log('✅ HistoryReportsComponent registered globally');
}