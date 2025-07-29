/**
 * AdminDashboardCharts.vue.js - Admin Dashboard Charts Component
 * Displays comprehensive analytics for admin users
 */

window.AdminDashboardCharts = {
  name: 'AdminDashboardCharts',
  template: `
  <div class="container-fluid">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
              <span class="sr-only">Loading charts...</span>
          </div>
          <p class="mt-2">Loading analytics...</p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="alert alert-danger" role="alert">
          <i class="fas fa-exclamation-triangle"></i> {{ error }}
      </div>

      <!-- Charts Dashboard -->
      <div v-if="!loading && !error">
          <!-- Summary Cards -->
          <div class="row mb-4">
              <div class="col-md-3">
                  <div class="card bg-primary text-white">
                      <div class="card-body">
                          <div class="d-flex justify-content-between">
                              <div>
                                  <h5>Total Revenue</h5>
                                  <h3>₹{{ formatNumber(summary.total_revenue) }}</h3>
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
                                  <h5>Avg Session Value</h5>
                                  <h3>₹{{ summary.avg_session_value }}</h3>
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
                                  <h5>Peak Hour</h5>
                                  <h3>{{ summary.peak_hour }}</h3>
                                  <small>{{ summary.peak_hour_sessions }} sessions</small>
                              </div>
                              <i class="fas fa-clock fa-2x opacity-50"></i>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Charts Row 1 -->
          <div class="row mb-4">
              <!-- Revenue Timeline -->
              <div class="col-lg-8">
                  <div class="card">
                      <div class="card-header">
                          <h5><i class="fas fa-chart-line"></i> Revenue Over Time</h5>
                          <small class="text-muted">{{ period }}</small>
                      </div>
                      <div class="card-body">
                          <canvas ref="revenueChart" height="100"></canvas>
                      </div>
                  </div>
              </div>

              <!-- User Distribution -->
              <div class="col-lg-4">
                  <div class="card">
                      <div class="card-header">
                          <h5><i class="fas fa-chart-pie"></i> Revenue by User</h5>
                      </div>
                      <div class="card-body">
                          <canvas ref="userDistributionChart" height="200"></canvas>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Charts Row 2 -->
          <div class="row mb-4">
              <!-- Lot Performance -->
              <div class="col-lg-6">
                  <div class="card">
                      <div class="card-header">
                          <h5><i class="fas fa-chart-bar"></i> Parking Lot Performance</h5>
                      </div>
                      <div class="card-body">
                          <canvas ref="lotPerformanceChart" height="150"></canvas>
                      </div>
                  </div>
              </div>

              <!-- Hourly Pattern -->
              <div class="col-lg-6">
                  <div class="card">
                      <div class="card-header">
                          <h5><i class="fas fa-clock"></i> Hourly Usage Pattern</h5>
                      </div>
                      <div class="card-body">
                          <canvas ref="hourlyPatternChart" height="150"></canvas>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Charts Row 3 -->
          <div class="row mb-4">
              <!-- Monthly Comparison -->
              <div class="col-lg-8">
                  <div class="card">
                      <div class="card-header">
                          <h5><i class="fas fa-calendar"></i> Monthly Comparison</h5>
                      </div>
                      <div class="card-body">
                          <canvas ref="monthlyChart" height="120"></canvas>
                      </div>
                  </div>
              </div>

              <!-- Occupancy Trends -->
              <div class="col-lg-4">
                  <div class="card">
                      <div class="card-header">
                          <h5><i class="fas fa-chart-area"></i> Occupancy Trends</h5>
                      </div>
                      <div class="card-body">
                          <canvas ref="occupancyChart" height="180"></canvas>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Additional Analytics Row -->
          <div class="row mb-4">
              <!-- Top Parking Lots -->
              <div class="col-lg-6">
                  <div class="card">
                      <div class="card-header">
                          <h5><i class="fas fa-trophy"></i> Top Performing Lots</h5>
                      </div>
                      <div class="card-body">
                          <div class="table-responsive">
                              <table class="table table-sm">
                                  <thead>
                                      <tr>
                                          <th>Parking Lot</th>
                                          <th>Revenue</th>
                                          <th>Sessions</th>
                                          <th>Occupancy</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      <tr v-for="lot in topLots" :key="lot.name">
                                          <td>{{ lot.name }}</td>
                                          <td>₹{{ formatNumber(lot.revenue) }}</td>
                                          <td>{{ lot.sessions }}</td>
                                          <td>
                                              <div class="progress" style="height: 20px;">
                                                  <div class="progress-bar" 
                                                       :class="getOccupancyClass(lot.occupancy)"
                                                       :style="{width: lot.occupancy + '%'}">
                                                      {{ lot.occupancy }}%
                                                  </div>
                                              </div>
                                          </td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- System Stats -->
              <div class="col-lg-6">
                  <div class="card">
                      <div class="card-header">
                          <h5><i class="fas fa-info-circle"></i> System Statistics</h5>
                      </div>
                      <div class="card-body">
                          <div class="row text-center">
                              <div class="col-6 mb-3">
                                  <h6 class="text-muted">Total Users</h6>
                                  <h4>{{ systemStats.total_users }}</h4>
                              </div>
                              <div class="col-6 mb-3">
                                  <h6 class="text-muted">Active Lots</h6>
                                  <h4>{{ systemStats.active_lots }}</h4>
                              </div>
                              <div class="col-6">
                                  <h6 class="text-muted">Total Spots</h6>
                                  <h4>{{ systemStats.total_spots }}</h4>
                              </div>
                              <div class="col-6">
                                  <h6 class="text-muted">Available Now</h6>
                                  <h4 class="text-success">{{ systemStats.available_spots }}</h4>
                              </div>
                          </div>
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
                                      <option value="7">Last 7 days</option>
                                      <option value="30">Last 30 days</option>
                                      <option value="90">Last 90 days</option>
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
          selectedPeriod: 30,
          chartsData: {},
          summary: {},
          period: '',
          charts: {},
          topLots: [],
          systemStats: {
              total_users: 0,
              active_lots: 0,
              total_spots: 0,
              available_spots: 0
          }
      }
  },

  mounted() {
      console.log('📊 Admin Dashboard Charts mounted');
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
              const response = await fetch(`/api/admin/analytics/charts/dashboard?days=${this.selectedPeriod}`, {
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

              // Load additional data
              await this.loadSystemStats();
              await this.loadTopLots();

              // Wait for DOM update then create charts
              this.$nextTick(() => {
                  this.createAllCharts();
              });

          } catch (error) {
              console.error('Error loading charts:', error);
              this.error = 'Failed to load analytics data. Please try again.';
              
              // Load demo data as fallback
              this.loadDemoData();
          } finally {
              this.loading = false;
          }
      },

      async loadSystemStats() {
          try {
              const token = localStorage.getItem('access_token');
              const response = await fetch('/api/admin/dashboard', {
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                  }
              });

              if (response.ok) {
                  const data = await response.json();
                  const stats = data.statistics || {};
                  this.systemStats = {
                      total_users: stats.total_users || 0,
                      active_lots: stats.total_parking_lots || 0,
                      total_spots: stats.total_parking_spots || 0,
                      available_spots: stats.available_spots || 0
                  };
              }
          } catch (error) {
              console.error('Error loading system stats:', error);
          }
      },

      async loadTopLots() {
          // This would normally come from the API
          // For now, use demo data
          this.topLots = [
              { name: 'Downtown Mall', revenue: 15000, sessions: 150, occupancy: 85 },
              { name: 'Airport Parking', revenue: 12000, sessions: 80, occupancy: 70 },
              { name: 'Metro Station', revenue: 8000, sessions: 200, occupancy: 60 },
              { name: 'IT Park', revenue: 10000, sessions: 120, occupancy: 75 }
          ];
      },

      loadDemoData() {
          // Demo data for testing
          this.summary = {
              total_revenue: 45000,
              total_sessions: 550,
              avg_session_value: 81.82,
              peak_hour: '14:00',
              peak_hour_sessions: 45,
              period_days: this.selectedPeriod
          };
          
          this.period = `Last ${this.selectedPeriod} days`;
          
          this.systemStats = {
              total_users: 125,
              active_lots: 5,
              total_spots: 405,
              available_spots: 120
          };
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

              // Create charts
              if (this.chartsData.revenue_timeline && this.$refs.revenueChart) {
                  this.createRevenueChart();
              }

              if (this.chartsData.user_distribution && this.$refs.userDistributionChart) {
                  this.createUserDistributionChart();
              }

              if (this.chartsData.lot_performance && this.$refs.lotPerformanceChart) {
                  this.createLotPerformanceChart();
              }

              if (this.chartsData.hourly_pattern && this.$refs.hourlyPatternChart) {
                  this.createHourlyPatternChart();
              }

              if (this.chartsData.monthly_comparison && this.$refs.monthlyChart) {
                  this.createMonthlyChart();
              }

              if (this.chartsData.occupancy_trends && this.$refs.occupancyChart) {
                  this.createOccupancyChart();
              }

          } catch (error) {
              console.error('Error creating charts:', error);
              this.error = 'Failed to create charts. Please refresh the page.';
          }
      },

      createRevenueChart() {
          const ctx = this.$refs.revenueChart.getContext('2d');
          this.charts.revenue = new Chart(ctx, {
              type: 'line',
              data: this.chartsData.revenue_timeline,
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                      mode: 'index',
                      intersect: false,
                  },
                  plugins: {
                      legend: {
                          position: 'top',
                      }
                  },
                  scales: {
                      y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          title: {
                              display: true,
                              text: 'Revenue (₹)'
                          }
                      },
                      y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          title: {
                              display: true,
                              text: 'Sessions'
                          },
                          grid: {
                              drawOnChartArea: false,
                          },
                      }
                  }
              }
          });
      },

      createUserDistributionChart() {
          const ctx = this.$refs.userDistributionChart.getContext('2d');
          this.charts.userDistribution = new Chart(ctx, {
              type: 'doughnut',
              data: this.chartsData.user_distribution,
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

      createLotPerformanceChart() {
          const ctx = this.$refs.lotPerformanceChart.getContext('2d');
          this.charts.lotPerformance = new Chart(ctx, {
              type: 'bar',
              data: this.chartsData.lot_performance,
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: {
                          position: 'top',
                      }
                  },
                  scales: {
                      y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          title: {
                              display: true,
                              text: 'Revenue (₹)'
                          }
                      },
                      y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          title: {
                              display: true,
                              text: 'Sessions'
                          },
                          grid: {
                              drawOnChartArea: false,
                          },
                      }
                  }
              }
          });
      },

      createHourlyPatternChart() {
          const ctx = this.$refs.hourlyPatternChart.getContext('2d');
          this.charts.hourlyPattern = new Chart(ctx, {
              type: 'line',
              data: this.chartsData.hourly_pattern,
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: {
                          position: 'top',
                      }
                  },
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

      createMonthlyChart() {
          const ctx = this.$refs.monthlyChart.getContext('2d');
          this.charts.monthly = new Chart(ctx, {
              type: 'bar',
              data: this.chartsData.monthly_comparison,
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: {
                          position: 'top',
                      }
                  },
                  scales: {
                      y: {
                          beginAtZero: true,
                          title: {
                              display: true,
                              text: 'Revenue (₹)'
                          }
                      }
                  }
              }
          });
      },

      createOccupancyChart() {
          const ctx = this.$refs.occupancyChart.getContext('2d');
          this.charts.occupancy = new Chart(ctx, {
              type: 'line',
              data: this.chartsData.occupancy_trends,
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: {
                          position: 'top',
                      },
                      filler: {
                          propagate: false,
                      }
                  },
                  scales: {
                      y: {
                          beginAtZero: true,
                          title: {
                              display: true,
                              text: 'Sessions'
                          }
                      }
                  },
                  elements: {
                      line: {
                          tension: 0.4
                      }
                  }
              }
          });
      },

      formatNumber(num) {
          return new Intl.NumberFormat('en-IN').format(num || 0);
      },

      getOccupancyClass(occupancy) {
          if (occupancy >= 80) return 'bg-danger';
          if (occupancy >= 60) return 'bg-warning';
          return 'bg-success';
      }
  }
};

// Register component globally
if (window.Vue) {
  console.log('✅ AdminDashboardCharts component registered');
}