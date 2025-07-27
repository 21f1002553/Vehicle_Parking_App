<template>
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
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  name: 'UserDashboardCharts',
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
        this.chartsData = data.charts;
        this.summary = data.summary;
        this.period = data.period;

        // Wait for DOM update then create charts
        this.$nextTick(() => {
          this.createAllCharts();
        });

      } catch (error) {
        console.error('Error loading charts:', error);
        this.error = 'Failed to load your analytics data. Please try again.';
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
        // Personal Spending Timeline Chart
        if (this.chartsData.spending_timeline && this.$refs.spendingChart) {
          this.charts.spending = new Chart(this.$refs.spendingChart, {
            type: 'line',
            data: {
              labels: this.chartsData.spending_timeline.labels,
              datasets: this.chartsData.spending_timeline.datasets
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: this.chartsData.spending_timeline.title
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
                    text: 'Spending (₹)'
                  }
                }
              }
            }
          });
        }

        // Lot Usage Chart
        if (this.chartsData.lot_usage && this.$refs.lotUsageChart) {
          this.charts.lotUsage = new Chart(this.$refs.lotUsageChart, {
            type: 'doughnut',
            data: {
              labels: this.chartsData.lot_usage.labels,
              datasets: this.chartsData.lot_usage.datasets
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: this.chartsData.lot_usage.title
                },
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        }

        // Duration Distribution Chart
        if (this.chartsData.duration_distribution && this.$refs.durationChart) {
          this.charts.duration = new Chart(this.$refs.durationChart, {
            type: 'bar',
            data: {
              labels: this.chartsData.duration_distribution.labels,
              datasets: this.chartsData.duration_distribution.datasets
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: this.chartsData.duration_distribution.title
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

        // Weekly Pattern Chart
        if (this.chartsData.weekly_pattern && this.$refs.weeklyChart) {
          this.charts.weekly = new Chart(this.$refs.weeklyChart, {
            type: 'radar',
            data: {
              labels: this.chartsData.weekly_pattern.labels,
              datasets: this.chartsData.weekly_pattern.datasets
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: this.chartsData.weekly_pattern.title
                }
              },
              scales: {
                r: {
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

        // Monthly Trend Chart
        if (this.chartsData.monthly_trend && this.$refs.monthlyChart) {
          this.charts.monthly = new Chart(this.$refs.monthlyChart, {
            type: 'line',
            data: {
              labels: this.chartsData.monthly_trend.labels,
              datasets: this.chartsData.monthly_trend.datasets
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: this.chartsData.monthly_trend.title
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
        }

        // Hourly Pattern Chart
        if (this.chartsData.hourly_pattern && this.$refs.hourlyChart) {
          this.charts.hourly = new Chart(this.$refs.hourlyChart, {
            type: 'bar',
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
                    text: 'Sessions Started'
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

.font-weight-bold {
  font-weight: 600;
}
</style>