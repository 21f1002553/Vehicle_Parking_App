<template>
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
                    <h3>{{ summary.peak_hour }} ({{ summary.peak_hour_sessions }})</h3>
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
  </template>
  
  <script>
  import Chart from 'chart.js/auto';
  
  export default {
    name: 'AdminDashboardCharts',
    data() {
      return {
        loading: true,
        error: null,
        selectedPeriod: 30,
        chartsData: {},
        summary: {},
        period: '',
        charts: {}
      }
    },
    mounted() {
      this.loadCharts();
    },
    beforeDestroy() {
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
          this.chartsData = data.charts;
          this.summary = data.summary;
          this.period = data.period;
  
          // Wait for DOM update then create charts
          this.$nextTick(() => {
            this.createAllCharts();
          });
  
        } catch (error) {
          console.error('Error loading charts:', error);
          this.error = 'Failed to load analytics data. Please try again.';
        } finally {
          this.loading = false;
        }
      },
  
      createAllCharts() {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
          if (chart) chart.destroy();
        });
        this.charts = {};
  
        try {
          // Revenue Timeline Chart
          if (this.chartsData.revenue_timeline && this.$refs.revenueChart) {
            this.charts.revenue = new Chart(this.$refs.revenueChart, {
              type: 'line',
              data: {
                labels: this.chartsData.revenue_timeline.labels,
                datasets: this.chartsData.revenue_timeline.datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: this.chartsData.revenue_timeline.title
                  },
                  legend: {
                    position: 'top'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
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
          }
  
          // User Distribution Chart
          if (this.chartsData.user_distribution && this.$refs.userDistributionChart) {
            this.charts.userDistribution = new Chart(this.$refs.userDistributionChart, {
              type: 'doughnut',
              data: {
                labels: this.chartsData.user_distribution.labels,
                datasets: this.chartsData.user_distribution.datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: this.chartsData.user_distribution.title
                  },
                  legend: {
                    position: 'bottom'
                  }
                }
              }
            });
          }
  
          // Lot Performance Chart
          if (this.chartsData.lot_performance && this.$refs.lotPerformanceChart) {
            this.charts.lotPerformance = new Chart(this.$refs.lotPerformanceChart, {
              type: 'bar',
              data: {
                labels: this.chartsData.lot_performance.labels,
                datasets: this.chartsData.lot_performance.datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: this.chartsData.lot_performance.title
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
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
          }
  
          // Hourly Pattern Chart
          if (this.chartsData.hourly_pattern && this.$refs.hourlyPatternChart) {
            this.charts.hourlyPattern = new Chart(this.$refs.hourlyPatternChart, {
              type: 'line',
              data: {
                labels: this.chartsData.hourly_pattern.labels,
                datasets: this.chartsData.hourly_pattern.datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: this.chartsData.hourly_pattern.title
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
          }
  
          // Monthly Comparison Chart
          if (this.chartsData.monthly_comparison && this.$refs.monthlyChart) {
            this.charts.monthly = new Chart(this.$refs.monthlyChart, {
              type: 'bar',
              data: {
                labels: this.chartsData.monthly_comparison.labels,
                datasets: this.chartsData.monthly_comparison.datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: this.chartsData.monthly_comparison.title
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
          }
  
          // Occupancy Trends Chart
          if (this.chartsData.occupancy_trends && this.$refs.occupancyChart) {
            this.charts.occupancy = new Chart(this.$refs.occupancyChart, {
              type: 'line',
              data: {
                labels: this.chartsData.occupancy_trends.labels,
                datasets: this.chartsData.occupancy_trends.datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: this.chartsData.occupancy_trends.title
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
          }
  
        } catch (error) {
          console.error('Error creating charts:', error);
          this.error = 'Failed to create charts. Please refresh the page.';
        }
      },
  
      formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(num || 0);
      }
    }
  }
  </script>
  
  <style scoped>
  .card {
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    border: 1px solid rgba(0, 0, 0, 0.125);
  }
  
  .opacity-50 {
    opacity: 0.5;
  }
  
  canvas {
    max-height: 400px;
  }
  
  @media (max-width: 768px) {
    .card-body canvas {
      height: 250px !important;
    }
  }
  </style>