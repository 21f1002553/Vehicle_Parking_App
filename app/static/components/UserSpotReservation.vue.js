/**
 * UserSpotReservation.vue.js - User Spot Reservation System Component
 * Complete parking spot reservation and management for users
 */

window.UserSpotReservationComponent = {
    name: 'UserSpotReservation',
    template: `
    <div class="container-fluid">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2><i class="fas fa-car me-2"></i>Find & Reserve Parking</h2>
                <p class="text-muted mb-0">Find available parking spots and manage your reservations</p>
            </div>
            <div class="d-flex gap-2">
                <button 
                    class="btn btn-outline-primary" 
                    @click="loadParkingLots"
                    :disabled="loading"
                >
                    <i class="fas fa-sync-alt" :class="{'fa-spin': loading}"></i>
                    Refresh
                </button>
                <button 
                    class="btn btn-info" 
                    @click="showHistoryModal = true"
                >
                    <i class="fas fa-history me-2"></i>My History
                </button>
            </div>
        </div>

        <!-- Active Reservation Alert -->
        <div v-if="activeReservation" class="alert alert-warning mb-4">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="alert-heading mb-2">
                        <i class="fas fa-car-side me-2"></i>Active Reservation
                    </h5>
                    <p class="mb-1">
                        <strong>{{ activeReservation.lot_name || 'Parking Lot' }}</strong> - 
                        Spot {{ activeReservation.spot?.spot_number }}
                    </p>
                    <p class="mb-0">
                        <small class="text-muted">
                            Vehicle: {{ activeReservation.vehicle_number }} | 
                            Status: {{ getReservationStatusText(activeReservation.status) }} |
                            Reserved: {{ formatDateTime(activeReservation.reservation_time) }}
                        </small>
                    </p>
                </div>
                <div class="d-flex gap-2">
                    <button 
                        v-if="activeReservation.status === 'reserved'"
                        class="btn btn-success btn-sm" 
                        @click="occupySpot(activeReservation.id)"
                        :disabled="processing"
                    >
                        <i class="fas fa-play me-1"></i>Start Parking
                    </button>
                    <button 
                        v-if="activeReservation.status === 'active'"
                        class="btn btn-danger btn-sm" 
                        @click="releaseSpot(activeReservation.id)"
                        :disabled="processing"
                    >
                        <i class="fas fa-stop me-1"></i>End Parking
                    </button>
                    <button 
                        class="btn btn-outline-secondary btn-sm" 
                        @click="loadActiveReservation"
                    >
                        <i class="fas fa-info-circle"></i>Details
                    </button>
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                            <input 
                                type="text" 
                                class="form-control" 
                                placeholder="Search by location, name..."
                                v-model="searchQuery"
                                @input="filterLots"
                            >
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select 
                            class="form-select" 
                            v-model="priceFilter"
                            @change="filterLots"
                        >
                            <option value="">All Prices</option>
                            <option value="0-25">₹0 - ₹25/hr</option>
                            <option value="25-50">₹25 - ₹50/hr</option>
                            <option value="50-100">₹50 - ₹100/hr</option>
                            <option value="100+">₹100+/hr</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select 
                            class="form-select" 
                            v-model="availabilityFilter"
                            @change="filterLots"
                        >
                            <option value="">All Lots</option>
                            <option value="available">Available Only</option>
                            <option value="full">Full Lots</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select 
                            class="form-select" 
                            v-model="sortBy"
                            @change="sortLots"
                        >
                            <option value="name">Name</option>
                            <option value="price">Price</option>
                            <option value="availability">Availability</option>
                            <option value="distance">Distance</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Parking Lots Grid -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Finding available parking spots...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>{{ error }}
            <button class="btn btn-sm btn-outline-danger ms-2" @click="loadParkingLots">
                <i class="fas fa-retry me-1"></i>Retry
            </button>
        </div>

        <div v-else class="row">
            <div 
                v-for="lot in filteredLots" 
                :key="lot.id" 
                class="col-md-6 col-lg-4 mb-4"
            >
                <div class="card h-100 parking-lot-card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">{{ lot.name }}</h5>
                        <span 
                            class="badge fs-6"
                            :class="getAvailabilityBadgeClass(lot.available_spots)"
                        >
                            {{ lot.available_spots }} available
                        </span>
                    </div>
                    
                    <div class="card-body">
                        <div class="mb-3">
                            <p class="text-muted mb-1">
                                <i class="fas fa-map-marker-alt me-1"></i>
                                {{ lot.address }}
                            </p>
                            <small class="text-muted">
                                <i class="fas fa-map-pin me-1"></i>
                                PIN: {{ lot.pin_code }}
                            </small>
                        </div>

                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <h6 class="text-primary">{{ lot.total_spots }}</h6>
                                <small class="text-muted">Total</small>
                            </div>
                            <div class="col-4">
                                <h6 class="text-success">{{ lot.available_spots }}</h6>
                                <small class="text-muted">Available</small>
                            </div>
                            <div class="col-4">
                                <h6 class="text-warning">{{ lot.occupied_spots }}</h6>
                                <small class="text-muted">Occupied</small>
                            </div>
                        </div>

                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small>Availability</small>
                                <small>{{ Math.round((lot.available_spots / lot.total_spots) * 100) }}%</small>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div 
                                    class="progress-bar bg-success" 
                                    :style="{ width: ((lot.available_spots / lot.total_spots) * 100) + '%' }"
                                ></div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h4 class="text-success mb-0">₹{{ lot.price_per_hour }}/hr</h4>
                            </div>
                            <div class="text-end">
                                <small class="text-muted">Distance</small><br>
                                <small class="badge bg-light text-dark">~{{ getDistance(lot) }} km</small>
                            </div>
                        </div>

                        <div class="d-grid">
                            <button 
                                class="btn"
                                :class="lot.available_spots > 0 ? 'btn-primary' : 'btn-outline-secondary'"
                                :disabled="lot.available_spots === 0 || activeReservation || processing"
                                @click="selectLot(lot)"
                            >
                                <i v-if="lot.available_spots > 0" class="fas fa-parking me-2"></i>
                                <i v-else class="fas fa-ban me-2"></i>
                                {{ lot.available_spots > 0 ? 'Reserve Spot' : 'No Spots Available' }}
                            </button>
                        </div>

                        <div class="mt-2">
                            <button 
                                class="btn btn-outline-info btn-sm w-100" 
                                @click="viewLotDetails(lot)"
                            >
                                <i class="fas fa-info-circle me-1"></i>View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- No results -->
            <div v-if="filteredLots.length === 0" class="col-12">
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5>No parking lots found</h5>
                    <p class="text-muted">Try adjusting your search criteria or check back later.</p>
                    <button class="btn btn-primary" @click="clearFilters">
                        <i class="fas fa-eraser me-2"></i>Clear Filters
                    </button>
                </div>
            </div>
        </div>

        <!-- Reservation Modal -->
        <div 
            class="modal fade" 
            :class="{ show: showReservationModal }"
            :style="{ display: showReservationModal ? 'block' : 'none' }"
            tabindex="-1"
        >
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-parking me-2"></i>
                            Reserve Parking Spot
                        </h5>
                        <button 
                            type="button" 
                            class="btn-close" 
                            @click="showReservationModal = false"
                        ></button>
                    </div>

                    <div class="modal-body">
                        <div v-if="selectedLot">
                            <!-- Lot Information -->
                            <div class="alert alert-info">
                                <h6><i class="fas fa-building me-2"></i>{{ selectedLot.name }}</h6>
                                <p class="mb-1">
                                    <i class="fas fa-map-marker-alt me-1"></i>
                                    {{ selectedLot.address }}
                                </p>
                                <p class="mb-1">
                                    <strong>Price:</strong> ₹{{ selectedLot.price_per_hour }}/hour |
                                    <strong>Available:</strong> {{ selectedLot.available_spots }} spots
                                </p>
                            </div>

                            <!-- Reservation Form -->
                            <form @submit.prevent="confirmReservation">
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-car me-1"></i>Vehicle Number *
                                    </label>
                                    <input 
                                        type="text" 
                                        class="form-control text-uppercase"
                                        v-model="reservationForm.vehicle_number"
                                        :class="{ 'is-invalid': errors.vehicle_number }"
                                        placeholder="Enter vehicle number (e.g., KA01AB1234)"
                                        required
                                        @input="validateVehicleNumber"
                                    >
                                    <div v-if="errors.vehicle_number" class="invalid-feedback">
                                        {{ errors.vehicle_number }}
                                    </div>
                                    <small class="text-muted">
                                        Enter your vehicle registration number. This will be used to identify your vehicle.
                                    </small>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-clock me-1"></i>Expected Duration (hours)
                                    </label>
                                    <select 
                                        class="form-select" 
                                        v-model="reservationForm.expected_duration"
                                    >
                                        <option value="1">1 hour</option>
                                        <option value="2">2 hours</option>
                                        <option value="4">4 hours</option>
                                        <option value="8">8 hours (Full day)</option>
                                        <option value="24">24 hours</option>
                                    </select>
                                    <small class="text-muted">
                                        This is for estimation only. You'll pay based on actual usage.
                                    </small>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-sticky-note me-1"></i>Additional Notes (Optional)
                                    </label>
                                    <textarea 
                                        class="form-control"
                                        v-model="reservationForm.notes"
                                        placeholder="Any special instructions or notes..."
                                        rows="2"
                                    ></textarea>
                                </div>

                                <!-- Cost Estimation -->
                                <div class="alert alert-success">
                                    <h6><i class="fas fa-calculator me-2"></i>Cost Estimation</h6>
                                    <div class="row">
                                        <div class="col-6">
                                            <strong>Rate:</strong> ₹{{ selectedLot.price_per_hour }}/hour
                                        </div>
                                        <div class="col-6">
                                            <strong>Est. Duration:</strong> {{ reservationForm.expected_duration }} hours
                                        </div>
                                        <div class="col-12 mt-2">
                                            <strong>Estimated Cost:</strong> 
                                            <span class="h5 text-success">
                                                ₹{{ (selectedLot.price_per_hour * reservationForm.expected_duration).toFixed(2) }}
                                            </span>
                                        </div>
                                    </div>
                                    <small class="text-muted">
                                        * Final cost will be calculated based on actual parking duration (minimum 1 hour)
                                    </small>
                                </div>

                                <!-- Terms -->
                                <div class="form-check mb-3">
                                    <input 
                                        class="form-check-input" 
                                        type="checkbox" 
                                        id="terms"
                                        v-model="reservationForm.acceptTerms"
                                        :class="{ 'is-invalid': errors.acceptTerms }"
                                        required
                                    >
                                    <label class="form-check-label" for="terms">
                                        I agree to the <a href="#" class="text-decoration-none">parking terms and conditions</a> *
                                    </label>
                                    <div v-if="errors.acceptTerms" class="invalid-feedback">
                                        {{ errors.acceptTerms }}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button 
                            type="button" 
                            class="btn btn-secondary" 
                            @click="showReservationModal = false"
                            :disabled="processing"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-primary" 
                            @click="confirmReservation"
                            :disabled="processing || !isReservationFormValid"
                        >
                            <span v-if="processing" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="fas fa-check me-2"></i>
                            {{ processing ? 'Reserving...' : 'Confirm Reservation' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Lot Details Modal -->
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
                            {{ selectedLot?.name }} - Details
                        </h5>
                        <button 
                            type="button" 
                            class="btn-close" 
                            @click="showDetailsModal = false"
                        ></button>
                    </div>

                    <div class="modal-body">
                        <div v-if="selectedLot">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <h6><i class="fas fa-building me-1"></i>Location Information</h6>
                                    <p class="mb-1"><strong>Name:</strong> {{ selectedLot.name }}</p>
                                    <p class="mb-1"><strong>Address:</strong> {{ selectedLot.address }}</p>
                                    <p class="mb-1"><strong>PIN Code:</strong> {{ selectedLot.pin_code }}</p>
                                    <p class="mb-0"><strong>Distance:</strong> ~{{ getDistance(selectedLot) }} km</p>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <h6><i class="fas fa-rupee-sign me-1"></i>Pricing & Availability</h6>
                                    <p class="mb-1"><strong>Rate:</strong> ₹{{ selectedLot.price_per_hour }}/hour</p>
                                    <p class="mb-1"><strong>Total Spots:</strong> {{ selectedLot.total_spots }}</p>
                                    <p class="mb-1"><strong>Available:</strong> {{ selectedLot.available_spots }}</p>
                                    <p class="mb-0"><strong>Occupied:</strong> {{ selectedLot.occupied_spots }}</p>
                                </div>
                            </div>

                            <!-- Availability Chart -->
                            <div class="mb-3">
                                <h6><i class="fas fa-chart-pie me-1"></i>Current Occupancy</h6>
                                <div class="progress" style="height: 20px;">
                                    <div 
                                        class="progress-bar bg-success" 
                                        :style="{ width: ((selectedLot.available_spots / selectedLot.total_spots) * 100) + '%' }"
                                    >
                                        Available ({{ selectedLot.available_spots }})
                                    </div>
                                    <div 
                                        class="progress-bar bg-warning" 
                                        :style="{ width: ((selectedLot.occupied_spots / selectedLot.total_spots) * 100) + '%' }"
                                    >
                                        Occupied ({{ selectedLot.occupied_spots }})
                                    </div>
                                </div>
                            </div>

                            <!-- Available Spots Preview -->
                            <div v-if="selectedLot.available_spots_details && selectedLot.available_spots_details.length > 0">
                                <h6><i class="fas fa-car me-1"></i>Available Spots (First 10)</h6>
                                <div class="row">
                                    <div 
                                        v-for="spot in selectedLot.available_spots_details.slice(0, 10)" 
                                        :key="spot.id"
                                        class="col-md-2 col-sm-3 col-4 mb-2"
                                    >
                                        <div class="card text-center">
                                            <div class="card-body p-2">
                                                <small class="badge bg-success">{{ spot.spot_number }}</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p v-if="selectedLot.available_spots_details.length > 10" class="text-muted small">
                                    ... and {{ selectedLot.available_spots_details.length - 10 }} more spots
                                </p>
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
                            v-if="selectedLot && selectedLot.available_spots > 0 && !activeReservation"
                            type="button" 
                            class="btn btn-primary" 
                            @click="selectLotFromDetails"
                        >
                            <i class="fas fa-parking me-2"></i>Reserve Spot
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- History Modal -->
        <div 
            class="modal fade" 
            :class="{ show: showHistoryModal }"
            :style="{ display: showHistoryModal ? 'block' : 'none' }"
            tabindex="-1"
        >
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-history me-2"></i>
                            My Parking History
                        </h5>
                        <button 
                            type="button" 
                            class="btn-close" 
                            @click="showHistoryModal = false"
                        ></button>
                    </div>

                    <div class="modal-body">
                        <div v-if="loadingHistory" class="text-center py-3">
                            <div class="spinner-border text-primary"></div>
                            <p class="mt-2">Loading history...</p>
                        </div>

                        <div v-else-if="parkingHistory.length === 0" class="text-center py-5">
                            <i class="fas fa-history fa-3x text-muted mb-3"></i>
                            <h5>No parking history</h5>
                            <p class="text-muted">Your parking sessions will appear here once you start using the service.</p>
                        </div>

                        <div v-else class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Location</th>
                                        <th>Vehicle</th>
                                        <th>Duration</th>
                                        <th>Cost</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="session in parkingHistory" :key="session.id">
                                        <td>
                                            <small>{{ formatDateTime(session.reservation_time) }}</small>
                                        </td>
                                        <td>
                                            <strong>{{ session.lot_name || 'Unknown' }}</strong><br>
                                            <small class="text-muted">Spot: {{ session.spot_number || 'N/A' }}</small>
                                        </td>
                                        <td>{{ session.vehicle_number }}</td>
                                        <td>{{ session.duration_formatted || 'N/A' }}</td>
                                        <td>
                                            <span v-if="session.total_cost" class="text-success">
                                                ₹{{ session.total_cost }}
                                            </span>
                                            <span v-else class="text-muted">-</span>
                                        </td>
                                        <td>
                                            <span 
                                                class="badge"
                                                :class="getStatusBadgeClass(session.status)"
                                            >
                                                {{ getReservationStatusText(session.status) }}
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

        <!-- Modal Backdrop -->
        <div 
            v-if="showReservationModal || showDetailsModal || showHistoryModal"
            class="modal-backdrop fade show"
            @click="closeModals"
        ></div>
    </div>
    `,

    data() {
        return {
            parkingLots: [],
            filteredLots: [],
            activeReservation: null,
            parkingHistory: [],
            loading: false,
            loadingHistory: false,
            processing: false,
            error: null,
            
            // Modals
            showReservationModal: false,
            showDetailsModal: false,
            showHistoryModal: false,
            
            // Selected lot
            selectedLot: null,
            
            // Search and filter
            searchQuery: '',
            priceFilter: '',
            availabilityFilter: '',
            sortBy: 'name',
            
            // Reservation form
            reservationForm: {
                vehicle_number: '',
                expected_duration: 2,
                notes: '',
                acceptTerms: false
            },
            errors: {}
        }
    },

    computed: {
        isReservationFormValid() {
            return this.reservationForm.vehicle_number && 
                   this.reservationForm.acceptTerms &&
                   Object.keys(this.errors).length === 0;
        }
    },

    mounted() {
        console.log('🚗 User Spot Reservation mounted');
        this.loadParkingLots();
        this.loadActiveReservation();
    },

    methods: {
        /**
         * Load available parking lots
         */
        async loadParkingLots() {
            this.loading = true;
            this.error = null;

            try {
                const response = await window.api.getParkingLots();
                this.parkingLots = response.parking_lots || [];
                this.filteredLots = [...this.parkingLots];
                this.filterLots();
            } catch (error) {
                console.error('Failed to load parking lots:', error);
                this.error = 'Failed to load parking lots. Please try again.';
            } finally {
                this.loading = false;
            }
        },

        /**
         * Load active reservation
         */
        async loadActiveReservation() {
            try {
                const response = await window.api.getActiveReservation();
                this.activeReservation = response;
            } catch (error) {
                // No active reservation is normal
                this.activeReservation = null;
            }
        },

        /**
         * Load parking history
         */
        async loadParkingHistory() {
            this.loadingHistory = true;
            
            try {
                const response = await window.api.getParkingHistory();
                this.parkingHistory = response.reservations || [];
            } catch (error) {
                console.error('Failed to load parking history:', error);
                this.parkingHistory = [];
            } finally {
                this.loadingHistory = false;
            }
        },

        /**
         * Filter parking lots
         */
        filterLots() {
            let filtered = [...this.parkingLots];

            // Search filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(lot => 
                    lot.name.toLowerCase().includes(query) ||
                    lot.address.toLowerCase().includes(query) ||
                    lot.pin_code.includes(query)
                );
            }

            // Price filter
            if (this.priceFilter) {
                filtered = filtered.filter(lot => {
                    const price = lot.price_per_hour;
                    switch (this.priceFilter) {
                        case '0-25': return price <= 25;
                        case '25-50': return price > 25 && price <= 50;
                        case '50-100': return price > 50 && price <= 100;
                        case '100+': return price > 100;
                        default: return true;
                    }
                });
            }

            // Availability filter
            if (this.availabilityFilter) {
                filtered = filtered.filter(lot => {
                    if (this.availabilityFilter === 'available') return lot.available_spots > 0;
                    if (this.availabilityFilter === 'full') return lot.available_spots === 0;
                    return true;
                });
            }

            this.filteredLots = filtered;
            this.sortLots();
        },

        /**
         * Sort parking lots
         */
        sortLots() {
            this.filteredLots.sort((a, b) => {
                switch (this.sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'price':
                        return a.price_per_hour - b.price_per_hour;
                    case 'availability':
                        return b.available_spots - a.available_spots;
                    case 'distance':
                        return this.getDistance(a) - this.getDistance(b);
                    default:
                        return 0;
                }
            });
        },

        /**
         * Clear all filters
         */
        clearFilters() {
            this.searchQuery = '';
            this.priceFilter = '';
            this.availabilityFilter = '';
            this.sortBy = 'name';
            this.filterLots();
        },

        /**
         * Select lot for reservation
         */
        selectLot(lot) {
            if (lot.available_spots === 0 || this.activeReservation) return;
            
            this.selectedLot = lot;
            this.resetReservationForm();
            this.showReservationModal = true;
        },

        /**
         * Select lot from details modal
         */
        selectLotFromDetails() {
            this.showDetailsModal = false;
            this.selectLot(this.selectedLot);
        },

        /**
         * View lot details
         */
        viewLotDetails(lot) {
            this.selectedLot = lot;
            this.showDetailsModal = true;
        },

        /**
         * Confirm reservation
         */
        async confirmReservation() {
            if (!this.validateReservationForm()) return;

            this.processing = true;

            try {
                const response = await window.api.reserveSpot(
                    this.selectedLot.id,
                    this.reservationForm.vehicle_number.toUpperCase()
                );

                if (window.utils?.showSuccess) {
                    window.utils.showSuccess(
                        `Parking spot reserved successfully! Spot: ${response.spot.spot_number}`
                    );
                }

                // Update active reservation
                this.activeReservation = response.reservation;
                this.activeReservation.lot_name = this.selectedLot.name;
                this.activeReservation.spot = response.spot;

                // Refresh parking lots to update availability
                this.loadParkingLots();
                
                // Close modal
                this.showReservationModal = false;
                
            } catch (error) {
                console.error('Failed to reserve spot:', error);
                this.handleReservationError(error);
            } finally {
                this.processing = false;
            }
        },

        /**
         * Occupy parking spot
         */
        async occupySpot(reservationId) {
            this.processing = true;

            try {
                const response = await window.api.occupySpot(reservationId);
                
                if (window.utils?.showSuccess) {
                    window.utils.showSuccess('Parking started successfully!');
                }

                // Update active reservation status
                if (this.activeReservation) {
                    this.activeReservation.status = 'active';
                    this.activeReservation.parking_start_time = new Date().toISOString();
                }

                this.loadParkingLots();
                
            } catch (error) {
                console.error('Failed to occupy spot:', error);
                if (window.utils?.showError) {
                    window.utils.showError('Failed to start parking session');
                }
            } finally {
                this.processing = false;
            }
        },

        /**
         * Release parking spot
         */
        async releaseSpot(reservationId) {
            if (!confirm('Are you sure you want to end your parking session? This will calculate the final cost.')) {
                return;
            }

            this.processing = true;

            try {
                const response = await window.api.releaseSpot(reservationId);
                
                if (window.utils?.showSuccess) {
                    window.utils.showSuccess(
                        `Parking ended successfully! Total cost: ₹${response.total_cost}`
                    );
                }

                // Clear active reservation
                this.activeReservation = null;
                
                // Refresh data
                this.loadParkingLots();
                
            } catch (error) {
                console.error('Failed to release spot:', error);
                if (window.utils?.showError) {
                    window.utils.showError('Failed to end parking session');
                }
            } finally {
                this.processing = false;
            }
        },

        /**
         * Validate reservation form
         */
        validateReservationForm() {
            this.errors = {};

            if (!this.reservationForm.vehicle_number) {
                this.errors.vehicle_number = 'Vehicle number is required';
            } else if (!this.isValidVehicleNumber(this.reservationForm.vehicle_number)) {
                this.errors.vehicle_number = 'Please enter a valid vehicle number';
            }

            if (!this.reservationForm.acceptTerms) {
                this.errors.acceptTerms = 'You must accept the terms and conditions';
            }

            return Object.keys(this.errors).length === 0;
        },

        /**
         * Validate vehicle number
         */
        validateVehicleNumber() {
            if (this.reservationForm.vehicle_number) {
                this.reservationForm.vehicle_number = this.reservationForm.vehicle_number.toUpperCase();
                
                if (!this.isValidVehicleNumber(this.reservationForm.vehicle_number)) {
                    this.errors.vehicle_number = 'Invalid vehicle number format';
                } else {
                    delete this.errors.vehicle_number;
                }
            }
        },

        /**
         * Check if vehicle number is valid
         */
        isValidVehicleNumber(vehicleNumber) {
            // Basic validation for Indian vehicle numbers
            const cleanedNumber = vehicleNumber.replace(/\s/g, '');
            return cleanedNumber.length >= 6 && cleanedNumber.length <= 12;
        },

        /**
         * Handle reservation errors
         */
        handleReservationError(error) {
            if (error.message.includes('already have an active reservation')) {
                if (window.utils?.showError) {
                    window.utils.showError('You already have an active reservation');
                }
                this.loadActiveReservation();
            } else if (error.message.includes('No available spots')) {
                if (window.utils?.showError) {
                    window.utils.showError('No spots available in this parking lot');
                }
                this.loadParkingLots();
            } else {
                if (window.utils?.showError) {
                    window.utils.showError('Failed to reserve parking spot');
                }
            }
        },

        /**
         * Reset reservation form
         */
        resetReservationForm() {
            this.reservationForm = {
                vehicle_number: '',
                expected_duration: 2,
                notes: '',
                acceptTerms: false
            };
            this.errors = {};
        },

        /**
         * Close modals
         */
        closeModals() {
            this.showReservationModal = false;
            this.showDetailsModal = false;
            this.showHistoryModal = false;
        },

        /**
         * Get availability badge class
         */
        getAvailabilityBadgeClass(availableSpots) {
            if (availableSpots === 0) return 'bg-danger';
            if (availableSpots <= 5) return 'bg-warning';
            return 'bg-success';
        },

        /**
         * Get distance (mock function)
         */
        getDistance(lot) {
            // Mock distance calculation
            return (Math.random() * 10 + 0.5).toFixed(1);
        },

        /**
         * Get reservation status text
         */
        getReservationStatusText(status) {
            const statusMap = {
                'reserved': 'Reserved',
                'active': 'Parking',
                'completed': 'Completed',
                'cancelled': 'Cancelled'
            };
            return statusMap[status] || status;
        },

        /**
         * Get status badge class
         */
        getStatusBadgeClass(status) {
            const classMap = {
                'reserved': 'bg-warning',
                'active': 'bg-primary',
                'completed': 'bg-success',
                'cancelled': 'bg-secondary'
            };
            return classMap[status] || 'bg-secondary';
        },

        /**
         * Format date time
         */
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
    },

    watch: {
        showHistoryModal(newValue) {
            if (newValue) {
                this.loadParkingHistory();
            }
        }
    }
};

// Register component globally
if (window.Vue) {
    window.Vue.createApp({}).component('user-spot-reservation', window.UserSpotReservationComponent);
    console.log('✅ UserSpotReservationComponent registered globally');
}