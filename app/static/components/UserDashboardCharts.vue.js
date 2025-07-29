/**
 * UserDashboardCharts.vue.js - User Dashboard Charts Component
 * Displays personal parking analytics and statistics
 */

window.UserDashboardCharts = {
    name: 'UserDashboardCharts',
    template: `
    <div class="container-fluid">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Loading charts...</span>
            </div>
            <p class="mt-2">Loading your analytics...</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i> {{ error }}
        </div>

        <!-- Charts Dashboard -->
        <div v-if="!loading && !error">
            <!-- Personal Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h5>Total Spent</h5>
                                    <h3>₹{{ formatNumber(summary.total_spent) }}</h3>
                                </div>
                                <i class="fas fa-rupee-sign fa-2x opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h5>Total Sessions</h5>
                                    <h3>{{ summary.total_sessions }}</h3>
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
                                    <h5>Avg Session Cost</h5>
                                    <h3>₹{{ summary.avg_session_cost }}</h3>
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
                                    <h3>{{ summary.total_hours_parked }}h</h3>
                                </div>
                                <i class="fas fa-clock fa-2x opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Personal Insights Cards -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6 class="card-title text-muted">My Parking Insights</h6>
                            <div class="row">
                                <div class="col-6">
                                    <small class="text-muted">Most Used Lot</small>
                                    <p class="mb-1 font-weight-bold">{{ summary.most_used_lot || 'N/A' }}</p>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted">Favorite Day</small>
                                    <p class="mb-1 font-weight-bold">{{ summary.favorite_day || 'N/A' }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6 class="card-title text-muted">Usage Patterns</h6>
                            <div class="row">
                                <div class="col-6">
                                    <small class="text-muted">Avg Duration</small>
                                    <p class="mb-1 font-weight-bold">{{ summary.avg_session_duration }}h</p>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted">Peak Hour</small>
                                    <p class="mb-1 font-weight-bold">{{ summary.peak_parking_hour || 'N/A' }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row 1 -->
            <div class="row mb-4">
                <!-- Personal Spending Timeline -->
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-chart-line"></i> My Spending Over Time</h5>
                            <small class="text-muted">{{ period }}</small>
                        </div>
                        <div class="card-body">
                            <canvas ref="spendingChart" height="100"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Parking Lot Usage -->
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-chart-pie"></i> My Lot Usage</h5>
                        </div>
                        <div class="card-body">
                            <canvas ref="lotUsageChart" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row 2 -->
            <div class="row mb-4">
                <!-- Duration Patterns -->
                <div class="col-lg-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-chart-bar"></i> My Parking Duration Patterns</h5>
                        </div>
                        <div class="card-body">
                            <canvas ref="durationChart" height="150"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Weekly Pattern -->
                <div class="col-lg-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-chart-radar"></i> Weekly Usage Pattern</h5>
                        </div>
                        <div class="card-body">
                            <canvas ref="weeklyChart" height="150"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row 3 -->
            <div class="row mb-4">
                <!-- Monthly Trend -->
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-calendar"></i> Monthly Spending Trend</h5>
                        </div>
                        <div class="card-body">
                            <canvas ref="monthlyChart" height="120"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Hourly Usage -->
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-clock"></i> Hours I Park</h5>
                        </div>
                        <div class="card-body">
                            <canvas ref="hourlyChart" height="180"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <label for="periodSelect">Time Period:</label>
                                    <select id="periodSelect" v-model="selectedPeriod" @change="loadCharts" class="form-control d-inline-block ml-2" style="width: auto;">
                                        <option value="30">Last 30 days</option>
                                        <option value="90">Last 90 days</option>
                                        <option value="180">Last 6 months</option>
                                        <option value="365">Last year</option>
                                    </select>
                                </div>
                                <button @click="loadCharts" class="btn btn-primary">
                                    <i class="fas fa-sync-alt"></i> Refresh Charts
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            loading: true,
            error: null,
            selectedPeriod: 90,
            chartsData: {},
            summary: {},
            period: '',
            charts: {}
        }
    },

    mounted() {
        console.log('📊 User Dashboard Charts mounted');
        this.loadCharts();
    },

    beforeUnmount() {
        // Destroy all charts to prevent memory leaks
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    },

    methods: {
        async loadCharts() {
            this.loading = true;
            this.error = null;

            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`/api/user/analytics/charts/personal?days=${this.selectedPeriod}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.chartsData = data.charts || {};
                this.summary = data.summary || {};
                this.period = data.period || `Last ${this.selectedPeriod} days`;

                // Wait for DOM update then create charts
                this.$nextTick(() => {
                    this.createAllCharts();
                });

            } catch (error) {
                console.error('Error loading charts:', error);
                this.error = 'Failed to load your analytics data. Please try again.';
                
                // Load demo data as fallback
                this.loadDemoData();
            } finally {
                this.loading = false;
            }
        },

        loadDemoData() {
            // Demo data for testing
            this.summary = {
                total_spent: 1250,
                total_sessions: 15,
                avg_session_cost: 83.33,
                total_hours_parked: 45.5,
                avg_session_duration: 3.03,
                most_used_lot: 'Downtown Mall',
                most_used_lot_sessions: 8,
                peak_parking_hour: '14:00',
                favorite_day: 'Friday',
                period_days: this.selectedPeriod
            };
            
            this.period = `Last ${this.selectedPeriod} days`;
        },

        createAllCharts() {
            // Destroy existing charts
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            this.charts = {};

            try {
                // Check if Chart.js is available
                if (typeof Chart === 'undefined') {
                    console.error('Chart.js is not loaded');
                    this.error = 'Chart library not loaded. Please refresh the page.';
                    return;
                }

                // Create charts only if we have data
                if (this.chartsData.spending_timeline && this.$refs.spendingChart) {
                    this.createSpendingChart();
                }

                if (this.chartsData.lot_usage && this.$refs.lotUsageChart) {
                    this.createLotUsageChart();
                }

                if (this.chartsData.duration_distribution && this.$refs.durationChart) {
                    this.createDurationChart();
                }

                if (this.chartsData.weekly_pattern && this.$refs.weeklyChart) {
                    this.createWeeklyChart();
                }

                if (this.chartsData.monthly_trend && this.$refs.monthlyChart) {
                    this.createMonthlyChart();
                }

                if (this.chartsData.hourly_pattern && this.$refs.hourlyChart) {
                    this.createHourlyChart();
                }

            } catch (error) {
                console.error('Error creating charts:', error);
                this.error = 'Failed to create charts. Please refresh the page.';
            }
        },

        createSpendingChart() {
            const ctx = this.$refs.spendingChart.getContext('2d');
            this.charts.spending = new Chart(ctx, {
                type: 'line',
                data: this.chartsData.spending_timeline,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Spending (₹)'
                            }
                        }
                    }
                }
            });
        },

        createLotUsageChart() {
            const ctx = this.$refs.lotUsageChart.getContext('2d');
            this.charts.lotUsage = new Chart(ctx, {
                type: 'doughnut',
                data: this.chartsData.lot_usage,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },

        createDurationChart() {
            const ctx = this.$refs.durationChart.getContext('2d');
            this.charts.duration = new Chart(ctx, {
                type: 'bar',
                data: this.chartsData.duration_distribution,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Sessions'
                            }
                        }
                    }
                }
            });
        },

        createWeeklyChart() {
            const ctx = this.$refs.weeklyChart.getContext('2d');
            this.charts.weekly = new Chart(ctx, {
                type: 'radar',
                data: this.chartsData.weekly_pattern,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true
                        }
                    }
                }
            });
        },

        createMonthlyChart() {
            const ctx = this.$refs.monthlyChart.getContext('2d');
            this.charts.monthly = new Chart(ctx, {
                type: 'line',
                data: this.chartsData.monthly_trend,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Spending (₹)'
                            }
                        }
                    }
                }
            });
        },

        createHourlyChart() {
            const ctx = this.$refs.hourlyChart.getContext('2d');
            this.charts.hourly = new Chart(ctx, {
                type: 'bar',
                data: this.chartsData.hourly_pattern,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Sessions Started'
                            }
                        }
                    }
                }
            });
        },

        formatNumber(num) {
            return new Intl.NumberFormat('en-IN').format(num || 0);
        }
    }
};

// Register component globally
if (window.Vue) {
    console.log('✅ UserDashboardCharts component registered');
}