/**
 * CostCalculation.vue.js - Cost Calculation and Billing Component
 * Handles cost calculations, billing history, and payment summaries
 */

window.CostCalculationComponent = {
    name: 'CostCalculation',
    template: `
    <div class="container-fluid">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2><i class="fas fa-calculator me-2"></i>Cost & Billing</h2>
                <p class="text-muted mb-0">Track your parking costs and view detailed billing information</p>
            </div>
            <div class="d-flex gap-2">
                <select 
                    class="form-select" 
                    v-model="selectedPeriod"
                    @change="loadCostSummary"
                    style="width: auto;"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                </select>
                <button 
                    class="btn btn-outline-primary" 
                    @click="loadCostSummary"
                    :disabled="loading"
                >
                    <i class="fas fa-sync-alt" :class="{'fa-spin': loading}"></i>
                </button>
            </div>
        </div>

        <!-- Cost Summary Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h5>Total Spent</h5>
                                <h3>₹{{ formatCurrency(costSummary.total_cost) }}</h3>
                                <small>{{ costSummary.period }}</small>
                            </div>
                            <i class="fas fa-rupee-sign fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h5>Total Sessions</h5>
                                <h3>{{ costSummary.total_sessions }}</h3>
                                <small>Completed parkings</small>
                            </div>
                            <i class="fas fa-car fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h5>Avg Session</h5>
                                <h3>₹{{ formatCurrency(costSummary.average_cost_per_session) }}</h3>
                                <small>Per parking session</small>
                            </div>
                            <i class="fas fa-chart-line fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h5>Hours Parked</h5>
                                <h3>{{ costSummary.total_hours_parked }}h</h3>
                                <small>Total duration</small>
                            </div>
                            <i class="fas fa-clock fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cost Breakdown by Location -->
        <div class="row mb-4">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-chart-bar me-2"></i>Cost Breakdown by Location</h5>
                    </div>
                    <div class="card-body">
                        <div v-if="Object.keys(costSummary.cost_by_lot || {}).length === 0" class="text-center py-4">
                            <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No cost data available for the selected period</p>
                        </div>
                        <div v-else>
                            <div 
                                v-for="(lotData, lotName) in costSummary.cost_by_lot" 
                                :key="lotName"
                                class="mb-3"
                            >
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>{{ lotName }}</strong>
                                    <div class="text-end">
                                        <span class="text-success fw-bold">₹{{ formatCurrency(lotData.total_cost) }}</span>
                                        <small class="text-muted ms-2">({{ lotData.sessions }} sessions)</small>
                                    </div>
                                </div>
                                <div class="progress mb-1" style="height: 8px;">
                                    <div 
                                        class="progress-bar bg-success" 
                                        :style="{ width: getPercentage(lotData.total_cost, costSummary.total_cost) + '%' }"
                                    ></div>
                                </div>
                                <div class="d-flex justify-content-between small text-muted">
                                    <span>{{ lotData.sessions }} sessions • ₹{{ formatCurrency(lotData.total_cost / lotData.sessions) }} avg</span>
                                    <span>{{ formatHours(lotData.total_hours) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-info-circle me-2"></i>Quick Stats</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-3">
                            <span>Average Hourly Rate:</span>
                            <strong class="text-success">₹{{ formatCurrency(costSummary.average_hourly_rate) }}</strong>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span>Most Expensive Session:</span>
                            <strong class="text-danger">₹{{ formatCurrency(getMostExpensiveSession()) }}</strong>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span>Cheapest Session:</span>
                            <strong class="text-success">₹{{ formatCurrency(getCheapestSession()) }}</strong>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span>Favorite Location:</span>
                            <strong class="text-primary">{{ getFavoriteLocation() }}</strong>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between">
                            <span>Cost per Hour:</span>
                            <strong>₹{{ costSummary.total_hours_parked > 0 ? formatCurrency(costSummary.total_cost / costSummary.total_hours_parked) : '0' }}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Daily Cost Breakdown -->
        <div class="card mb-4" v-if="Object.keys(costSummary.daily_breakdown || {}).length > 0">
            <div class="card-header">
                <h5><i class="fas fa-calendar me-2"></i>Daily Cost Breakdown</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div 
                        v-for="(dayData, date) in getSortedDailyBreakdown()" 
                        :key="date"
                        class="col-md-3 col-sm-4 col-6 mb-3"
                    >
                        <div class="card border">
                            <div class="card-body p-3 text-center">
                                <h6 class="card-title mb-1">{{ formatDate(date) }}</h6>
                                <h5 class="text-success mb-1">₹{{ formatCurrency(dayData.cost) }}</h5>
                                <small class="text-muted">{{ dayData.sessions }} session{{ dayData.sessions !== 1 ? 's' : '' }}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Detailed History -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5><i class="fas fa-list me-2"></i>Detailed Parking History</h5>
                <button 
                    class="btn btn-outline-primary btn-sm" 
                    @click="loadDetailedHistory"
                    :disabled="loadingHistory"
                >
                    <i class="fas fa-download me-1" :class="{'fa-spin': loadingHistory}"></i>
                    {{ loadingHistory ? 'Loading...' : 'Load Details' }}
                </button>
            </div>
            <div class="card-body">
                <div v-if="loadingHistory" class="text-center py-4">
                    <div class="spinner-border text-primary"></div>
                    <p class="mt-2">Loading detailed history...</p>
                </div>

                <div v-else-if="detailedHistory.length === 0" class="text-center py-4">
                    <i class="fas fa-history fa-3x text-muted mb-3"></i>
                    <h5>No detailed history available</h5>
                    <p class="text-muted">Complete some parking sessions to see detailed cost breakdowns here.</p>
                </div>

                <div v-else class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Location</th>
                                <th>Vehicle</th>
                                <th>Duration</th>
                                <th>Rate</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="session in detailedHistory" :key="session.id">
                                <td>
                                    <div>
                                        <strong>{{ formatDate(session.parking_start_time) }}</strong><br>
                                        <small class="text-muted">
                                            {{ formatTime(session.parking_start_time) }} - 
                                            {{ formatTime(session.parking_end_time) }}
                                        </small>
                                    </div>
                                </td>
                                <td>
                                    <div>
                                        <strong>{{ session.lot_details?.name || 'Unknown' }}</strong><br>
                                        <small class="text-muted">Spot: {{ session.spot_details?.spot_number || 'N/A' }}</small>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-light text-dark">{{ session.vehicle_number }}</span>
                                </td>
                                <td>
                                    <div>
                                        <strong>{{ session.duration_formatted || 'N/A' }}</strong><br>
                                        <small class="text-muted">{{ formatHours(session.duration_hours) }}</small>
                                    </div>
                                </td>
                                <td>
                                    <strong>₹{{ session.hourly_rate }}/hr</strong>
                                </td>
                                <td>
                                    <div>
                                        <strong class="text-success">₹{{ formatCurrency(session.total_cost) }}</strong>
                                        <br>
                                        <small 
                                            class="text-muted"
                                            v-if="session.cost_breakdown?.minimum_charge_applied"
                                        >
                                            (Min 1hr charge)
                                        </small>
                                    </div>
                                </td>
                                <td>
                                    <span 
                                        class="badge"
                                        :class="getStatusBadgeClass(session.status)"
                                    >
                                        {{ getStatusText(session.status) }}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        class="btn btn-sm btn-outline-info" 
                                        @click="showCostBreakdown(session)"
                                        title="View cost breakdown"
                                    >
                                        <i class="fas fa-receipt"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <nav v-if="detailedHistory.length > 0" class="mt-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            Showing {{ detailedHistory.length }} recent sessions
                        </small>
                        <button 
                            class="btn btn-outline-primary btn-sm"
                            @click="loadMoreHistory"
                            :disabled="loadingHistory"
                        >
                            <i class="fas fa-plus me-1"></i>Load More
                        </button>
                    </div>
                </nav>
            </div>
        </div>

        <!-- Cost Breakdown Modal -->
        <div 
            class="modal fade" 
            :class="{ show: showBreakdownModal }"
            :style="{ display: showBreakdownModal ? 'block' : 'none' }"
            tabindex="-1"
        >
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-receipt me-2"></i>
                            Cost Breakdown - {{ selectedSession?.lot_details?.name }}
                        </h5>
                        <button 
                            type="button" 
                            class="btn-close" 
                            @click="showBreakdownModal = false"
                        ></button>
                    </div>

                    <div class="modal-body">
                        <div v-if="selectedSession">
                            <!-- Session Details -->
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-info-circle me-1"></i>Session Details</h6>
                                    <table class="table table-sm">
                                        <tr>
                                            <td><strong>Location:</strong></td>
                                            <td>{{ selectedSession.lot_details?.name }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Spot:</strong></td>
                                            <td>{{ selectedSession.spot_details?.spot_number }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Vehicle:</strong></td>
                                            <td>{{ selectedSession.vehicle_number }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Date:</strong></td>
                                            <td>{{ formatDate(selectedSession.parking_start_time) }}</td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-clock me-1"></i>Timing Details</h6>
                                    <table class="table table-sm">
                                        <tr>
                                            <td><strong>Start Time:</strong></td>
                                            <td>{{ formatTime(selectedSession.parking_start_time) }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>End Time:</strong></td>
                                            <td>{{ formatTime(selectedSession.parking_end_time) }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Duration:</strong></td>
                                            <td>{{ selectedSession.duration_formatted }}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Hours:</strong></td>
                                            <td>{{ formatHours(selectedSession.duration_hours) }}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>

                            <!-- Cost Calculation -->
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6><i class="fas fa-calculator me-1"></i>Cost Calculation</h6>
                                    
                                    <div v-if="selectedSession.cost_breakdown" class="row">
                                        <div class="col-md-6">
                                            <table class="table table-sm">
                                                <tr>
                                                    <td>Actual Duration:</td>
                                                    <td><strong>{{ selectedSession.cost_breakdown.actual_duration_hours }} hours</strong></td>
                                                </tr>
                                                <tr>
                                                    <td>Billable Duration:</td>
                                                    <td><strong>{{ selectedSession.cost_breakdown.billable_hours }} hours</strong></td>
                                                </tr>
                                                <tr>
                                                    <td>Hourly Rate:</td>
                                                    <td><strong>₹{{ selectedSession.cost_breakdown.hourly_rate }}/hour</strong></td>
                                                </tr>
                                                <tr v-if="selectedSession.cost_breakdown.minimum_charge_applied">
                                                    <td colspan="2">
                                                        <small class="text-warning">
                                                            <i class="fas fa-info-circle me-1"></i>
                                                            Minimum 1-hour charge applied
                                                        </small>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="text-center p-3 bg-white rounded">
                                                <h6 class="text-muted">Total Cost</h6>
                                                <h2 class="text-success mb-0">₹{{ formatCurrency(selectedSession.total_cost) }}</h2>
                                                <small class="text-muted">
                                                    {{ selectedSession.cost_breakdown.breakdown_text }}
                                                </small>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-else class="text-center">
                                        <p class="text-muted">Cost breakdown not available for this session</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button 
                            type="button" 
                            class="btn btn-secondary" 
                            @click="showBreakdownModal = false"
                        >
                            Close
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-primary"
                            @click="downloadReceipt"
                            :disabled="!selectedSession"
                        >
                            <i class="fas fa-download me-2"></i>Download Receipt
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Backdrop -->
        <div 
            v-if="showBreakdownModal"
            class="modal-backdrop fade show"
            @click="showBreakdownModal = false"
        ></div>
    </div>
    `,

    data() {
        return {
            selectedPeriod: 30,
            loading: false,
            loadingHistory: false,
            error: null,
            
            // Cost data
            costSummary: {
                total_cost: 0,
                total_sessions: 0,
                average_cost_per_session: 0,
                total_hours_parked: 0,
                average_hourly_rate: 0,
                cost_by_lot: {},
                daily_breakdown: {},
                period: ''
            },
            
            detailedHistory: [],
            selectedSession: null,
            showBreakdownModal: false,
            
            // Pagination
            currentPage: 1,
            perPage: 10
        }
    },

    mounted() {
        console.log('💰 Cost Calculation component mounted');
        this.loadCostSummary();
    },

    methods: {
        /**
         * Load cost summary
         */
        async loadCostSummary() {
            this.loading = true;
            this.error = null;

            try {
                const response = await window.api.getCostSummary(this.selectedPeriod);
                this.costSummary = response;
                
                console.log('Cost Summary loaded:', response);
                
            } catch (error) {
                console.error('Failed to load cost summary:', error);
                this.error = 'Failed to load cost summary. Please try again.';
                
                // Set empty data
                this.costSummary = {
                    total_cost: 0,
                    total_sessions: 0,
                    average_cost_per_session: 0,
                    total_hours_parked: 0,
                    average_hourly_rate: 0,
                    cost_by_lot: {},
                    daily_breakdown: {},
                    period: `Last ${this.selectedPeriod} days`
                };
            } finally {
                this.loading = false;
            }
        },

        /**
         * Load detailed history
         */
        async loadDetailedHistory() {
            this.loadingHistory = true;

            try {
                const response = await window.api.getDetailedParkingHistory({
                    status: 'completed',
                    per_page: this.perPage,
                    page: this.currentPage
                });
                
                if (this.currentPage === 1) {
                    this.detailedHistory = response.reservations || [];
                } else {
                    this.detailedHistory.push(...(response.reservations || []));
                }
                
                console.log('Detailed history loaded:', response);
                
            } catch (error) {
                console.error('Failed to load detailed history:', error);
                if (window.utils?.showError) {
                    window.utils.showError('Failed to load detailed history');
                }
            } finally {
                this.loadingHistory = false;
            }
        },

        /**
         * Load more history
         */
        loadMoreHistory() {
            this.currentPage++;
            this.loadDetailedHistory();
        },

        /**
         * Show cost breakdown modal
         */
        showCostBreakdown(session) {
            this.selectedSession = session;
            this.showBreakdownModal = true;
        },

        /**
         * Download receipt
         */
        async downloadReceipt() {
            if (!this.selectedSession) return;

            try {
                // Create a simple receipt text
                const receipt = this.generateReceiptText(this.selectedSession);
                
                // Download as text file
                const blob = new Blob([receipt], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `parking-receipt-${this.selectedSession.id}.txt`;
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

Location: ${session.lot_details?.name || 'Unknown'}
Spot: ${session.spot_details?.spot_number || 'N/A'}
Vehicle: ${session.vehicle_number}
Date: ${this.formatDate(session.parking_start_time)}

TIMING DETAILS
--------------
Start Time: ${this.formatTime(session.parking_start_time)}
End Time: ${this.formatTime(session.parking_end_time)}
Duration: ${session.duration_formatted}
Hours: ${this.formatHours(session.duration_hours)}

COST BREAKDOWN
--------------
Hourly Rate: ₹${session.hourly_rate}/hour
${session.cost_breakdown?.minimum_charge_applied ? 'Minimum Charge: 1 hour\n' : ''}
Billable Hours: ${session.cost_breakdown?.billable_hours || session.duration_hours}

TOTAL AMOUNT: ₹${this.formatCurrency(session.total_cost)}

Thank you for using our parking service!
Generated on: ${new Date().toLocaleString('en-IN')}
            `.trim();
        },

        /**
         * Get sorted daily breakdown
         */
        getSortedDailyBreakdown() {
            const breakdown = this.costSummary.daily_breakdown || {};
            const sorted = {};
            
            Object.keys(breakdown)
                .sort((a, b) => new Date(b) - new Date(a))
                .slice(0, 8) // Show last 8 days
                .forEach(key => {
                    sorted[key] = breakdown[key];
                });
                
            return sorted;
        },

        /**
         * Get percentage
         */
        getPercentage(value, total) {
            if (!total || total === 0) return 0;
            return Math.round((value / total) * 100);
        },

        /**
         * Get most expensive session
         */
        getMostExpensiveSession() {
            if (!this.detailedHistory || this.detailedHistory.length === 0) return 0;
            return Math.max(...this.detailedHistory.map(s => s.total_cost || 0));
        },

        /**
         * Get cheapest session
         */
        getCheapestSession() {
            if (!this.detailedHistory || this.detailedHistory.length === 0) return 0;
            const costs = this.detailedHistory.map(s => s.total_cost || 0).filter(c => c > 0);
            return costs.length > 0 ? Math.min(...costs) : 0;
        },

        /**
         * Get favorite location
         */
        getFavoriteLocation() {
            const costByLot = this.costSummary.cost_by_lot || {};
            if (Object.keys(costByLot).length === 0) return 'None';
            
            let maxSessions = 0;
            let favoriteLot = 'None';
            
            Object.entries(costByLot).forEach(([lotName, data]) => {
                if (data.sessions > maxSessions) {
                    maxSessions = data.sessions;
                    favoriteLot = lotName;
                }
            });
            
            return favoriteLot;
        },

        /**
         * Get status badge class
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

        /**
         * Get status text
         */
        getStatusText(status) {
            const textMap = {
                'completed': 'Completed',
                'active': 'Active',
                'reserved': 'Reserved',
                'cancelled': 'Cancelled'
            };
            return textMap[status] || status;
        },

        /**
         * Format currency
         */
        formatCurrency(amount) {
            if (!amount && amount !== 0) return '0';
            return parseFloat(amount).toFixed(2);
        },

        /**
         * Format hours
         */
        formatHours(hours) {
            if (!hours && hours !== 0) return '0h';
            return `${parseFloat(hours).toFixed(1)}h`;
        },

        /**
         * Format date
         */
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        /**
         * Format time
         */
        formatTime(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
};

// Register component globally
if (window.Vue) {
    window.Vue.createApp({}).component('cost-calculation', window.CostCalculationComponent);
    console.log('✅ CostCalculationComponent registered globally');
}