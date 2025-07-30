/**
 * AdminParkingLots.vue.js - Admin Parking Lot Management Component
 * Complete CRUD operations for parking lots with spot management
 */

window.AdminParkingLotsComponent = {
    name: 'AdminParkingLots',
    template: `
    <div class="container-fluid">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2><i class="fas fa-building me-2"></i>Parking Lot Management</h2>
                <p class="text-muted mb-0">Create, edit, and manage parking lots and their spots</p>
            </div>
            <button 
                class="btn btn-primary" 
                @click="showCreateModal = true"
                :disabled="loading"
            >
                <i class="fas fa-plus me-2"></i>Create New Lot
            </button>
        </div>

        <!-- Statistics Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h5>Total Lots</h5>
                                <h3>{{ statistics.total_lots }}</h3>
                            </div>
                            <i class="fas fa-building fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h5>Total Spots</h5>
                                <h3>{{ statistics.total_spots }}</h3>
                            </div>
                            <i class="fas fa-car fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h5>Occupied</h5>
                                <h3>{{ statistics.occupied_spots }}</h3>
                            </div>
                            <i class="fas fa-car-side fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h5>Available</h5>
                                <h3>{{ statistics.available_spots }}</h3>
                            </div>
                            <i class="fas fa-parking fa-2x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Filters -->
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
                                placeholder="Search lots by name or location..."
                                v-model="searchQuery"
                                @input="filterLots"
                            >
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select 
                            class="form-select" 
                            v-model="statusFilter"
                            @change="filterLots"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select 
                            class="form-select" 
                            v-model="sortBy"
                            @change="sortLots"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="created_at">Sort by Date</option>
                            <option value="total_spots">Sort by Spots</option>
                            <option value="occupancy_rate">Sort by Occupancy</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button 
                            class="btn btn-outline-secondary w-100"
                            @click="refreshLots"
                            :disabled="loading"
                        >
                            <i class="fas fa-sync-alt" :class="{'fa-spin': loading}"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Parking Lots Grid -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading parking lots...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>{{ error }}
            <button class="btn btn-sm btn-outline-danger ms-2" @click="refreshLots">
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
                        <div class="dropdown">
                            <button 
                                class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                type="button" 
                                :id="'dropdown-' + lot.id"
                                data-bs-toggle="dropdown"
                            >
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu" :aria-labelledby="'dropdown-' + lot.id">
                                <li>
                                    <a class="dropdown-item" href="#" @click.prevent="editLot(lot)">
                                        <i class="fas fa-edit me-2"></i>Edit
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#" @click.prevent="viewSpots(lot)">
                                        <i class="fas fa-car me-2"></i>View Spots
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        class="dropdown-item" 
                                        href="#" 
                                        @click.prevent="toggleLotStatus(lot)"
                                    >
                                        <i 
                                            :class="lot.is_active ? 'fas fa-pause' : 'fas fa-play'" 
                                            class="me-2"
                                        ></i>
                                        {{ lot.is_active ? 'Deactivate' : 'Activate' }}
                                    </a>
                                </li>
                                <li><hr class="dropdown-divider"></li>
                                <li>
                                    <a 
                                        class="dropdown-item text-danger" 
                                        href="#" 
                                        @click.prevent="deleteLot(lot)"
                                        :class="{ disabled: lot.occupied_spots > 0 }"
                                    >
                                        <i class="fas fa-trash me-2"></i>Delete
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <div class="mb-3">
                            <small class="text-muted">
                                <i class="fas fa-map-marker-alt me-1"></i>
                                {{ lot.address }}
                            </small>
                            <br>
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
                                <small>Occupancy Rate</small>
                                <small>{{ lot.occupancy_rate }}%</small>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div 
                                    class="progress-bar" 
                                    :class="getOccupancyColor(lot.occupancy_rate)"
                                    :style="{ width: lot.occupancy_rate + '%' }"
                                ></div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="text-success mb-0">₹{{ lot.price_per_hour }}/hr</h5>
                            </div>
                            <span 
                                class="badge" 
                                :class="lot.is_active ? 'bg-success' : 'bg-secondary'"
                            >
                                {{ lot.is_active ? 'Active' : 'Inactive' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- No results -->
            <div v-if="filteredLots.length === 0" class="col-12">
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5>No parking lots found</h5>
                    <p class="text-muted">Try adjusting your search criteria or create a new parking lot.</p>
                    <button class="btn btn-primary" @click="showCreateModal = true">
                        <i class="fas fa-plus me-2"></i>Create First Lot
                    </button>
                </div>
            </div>
        </div>

        <!-- Create/Edit Modal -->
        <div 
            class="modal fade" 
            :class="{ show: showCreateModal || showEditModal }"
            :style="{ display: (showCreateModal || showEditModal) ? 'block' : 'none' }"
            tabindex="-1"
        >
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-building me-2"></i>
                            {{ currentLot.id ? 'Edit' : 'Create' }} Parking Lot
                        </h5>
                        <button 
                            type="button" 
                            class="btn-close" 
                            @click="closeModal"
                        ></button>
                    </div>

                    <div class="modal-body">
                        <form @submit.prevent="saveLot">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-building me-1"></i>Lot Name *
                                    </label>
                                    <input 
                                        type="text" 
                                        class="form-control"
                                        v-model="currentLot.name"
                                        :class="{ 'is-invalid': errors.name }"
                                        placeholder="Enter lot name"
                                        required
                                    >
                                    <div v-if="errors.name" class="invalid-feedback">
                                        {{ errors.name }}
                                    </div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-rupee-sign me-1"></i>Price per Hour *
                                    </label>
                                    <div class="input-group">
                                        <span class="input-group-text">₹</span>
                                        <input 
                                            type="number" 
                                            class="form-control"
                                            v-model.number="currentLot.price_per_hour"
                                            :class="{ 'is-invalid': errors.price_per_hour }"
                                            placeholder="50.00"
                                            min="1"
                                            step="0.01"
                                            required
                                        >
                                    </div>
                                    <div v-if="errors.price_per_hour" class="invalid-feedback">
                                        {{ errors.price_per_hour }}
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="fas fa-map-marker-alt me-1"></i>Address *
                                </label>
                                <textarea 
                                    class="form-control"
                                    v-model="currentLot.address"
                                    :class="{ 'is-invalid': errors.address }"
                                    placeholder="Enter complete address"
                                    rows="2"
                                    required
                                ></textarea>
                                <div v-if="errors.address" class="invalid-feedback">
                                    {{ errors.address }}
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-map-pin me-1"></i>PIN Code *
                                    </label>
                                    <input 
                                        type="text" 
                                        class="form-control"
                                        v-model="currentLot.pin_code"
                                        :class="{ 'is-invalid': errors.pin_code }"
                                        placeholder="123456"
                                        maxlength="6"
                                        pattern="[0-9]{6}"
                                        required
                                    >
                                    <div v-if="errors.pin_code" class="invalid-feedback">
                                        {{ errors.pin_code }}
                                    </div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-car me-1"></i>Total Spots *
                                    </label>
                                    <input 
                                        type="number" 
                                        class="form-control"
                                        v-model.number="currentLot.total_spots"
                                        :class="{ 'is-invalid': errors.total_spots }"
                                        placeholder="50"
                                        min="1"
                                        max="1000"
                                        required
                                        :disabled="currentLot.id && currentLot.occupied_spots > 0"
                                    >
                                    <div v-if="errors.total_spots" class="invalid-feedback">
                                        {{ errors.total_spots }}
                                    </div>
                                    <small v-if="currentLot.id && currentLot.occupied_spots > 0" class="text-warning">
                                        Cannot modify spots while lot has occupied spaces
                                    </small>
                                </div>
                            </div>

                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Note:</strong> Parking spots will be automatically created based on the total spots number. 
                                Each spot will be numbered sequentially (e.g., A001, A002, etc.).
                            </div>
                        </form>
                    </div>

                    <div class="modal-footer">
                        <button 
                            type="button" 
                            class="btn btn-secondary" 
                            @click="closeModal"
                            :disabled="saving"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-primary" 
                            @click="saveLot"
                            :disabled="saving"
                        >
                            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="fas fa-save me-2"></i>
                            {{ saving ? 'Saving...' : (currentLot.id ? 'Update' : 'Create') }} Lot
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Spots View Modal -->
        <div 
            class="modal fade" 
            :class="{ show: showSpotsModal }"
            :style="{ display: showSpotsModal ? 'block' : 'none' }"
            tabindex="-1"
        >
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-car me-2"></i>
                            Parking Spots - {{ selectedLot?.name }}
                        </h5>
                        <button 
                            type="button" 
                            class="btn-close" 
                            @click="showSpotsModal = false"
                        ></button>
                    </div>

                    <div class="modal-body">
                        <div v-if="selectedLot" class="row">
                            <!-- Spots Grid -->
                            <div 
                                v-for="spot in selectedLot.spot_details" 
                                :key="spot.id"
                                class="col-md-2 col-sm-3 col-4 mb-3"
                            >
                                <div 
                                    class="card text-center h-100"
                                    :class="{
                                        'border-success': !spot.is_occupied && spot.is_active,
                                        'border-danger': spot.is_occupied,
                                        'border-secondary': !spot.is_active
                                    }"
                                >
                                    <div class="card-body p-2">
                                        <h6 class="card-title mb-1">{{ spot.spot_number }}</h6>
                                        <small 
                                            class="badge"
                                            :class="{
                                                'bg-success': !spot.is_occupied && spot.is_active,
                                                'bg-danger': spot.is_occupied,
                                                'bg-secondary': !spot.is_active
                                            }"
                                        >
                                            {{ getSpotStatus(spot) }}
                                        </small>
                                        <div v-if="spot.vehicle_number" class="mt-1">
                                            <small class="text-muted">{{ spot.vehicle_number }}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Backdrop -->
        <div 
            v-if="showCreateModal || showEditModal || showSpotsModal"
            class="modal-backdrop fade show"
            @click="closeModal"
        ></div>
    </div>
    `,

    data() {
        return {
            parkingLots: [],
            filteredLots: [],
            loading: false,
            error: null,
            saving: false,
            
            // Modals
            showCreateModal: false,
            showEditModal: false,
            showSpotsModal: false,
            
            // Current lot being edited
            currentLot: this.getEmptyLot(),
            selectedLot: null,
            errors: {},
            
            // Search and filter
            searchQuery: '',
            statusFilter: '',
            sortBy: 'name',
            
            // Statistics
            statistics: {
                total_lots: 0,
                total_spots: 0,
                occupied_spots: 0,
                available_spots: 0
            }
        }
    },

    mounted() {
        console.log('🏢 Admin Parking Lots Management mounted');
        this.loadParkingLots();
    },

    methods: {
        /**
         * Load all parking lots
         */
        async loadParkingLots() {
            this.loading = true;
            this.error = null;

            try {
                const response = await window.api.getAdminParkingLots();
                this.parkingLots = response.parking_lots || [];
                this.filteredLots = [...this.parkingLots];
                this.updateStatistics();
                this.filterLots();
            } catch (error) {
                console.error('Failed to load parking lots:', error);
                this.error = 'Failed to load parking lots. Please try again.';
            } finally {
                this.loading = false;
            }
        },

        /**
         * Update statistics
         */
        updateStatistics() {
            this.statistics = {
                total_lots: this.parkingLots.length,
                total_spots: this.parkingLots.reduce((sum, lot) => sum + lot.total_spots, 0),
                occupied_spots: this.parkingLots.reduce((sum, lot) => sum + lot.occupied_spots, 0),
                available_spots: this.parkingLots.reduce((sum, lot) => sum + lot.available_spots, 0)
            };
        },

        /**
         * Filter parking lots based on search and status
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

            // Status filter
            if (this.statusFilter) {
                filtered = filtered.filter(lot => {
                    if (this.statusFilter === 'active') return lot.is_active;
                    if (this.statusFilter === 'inactive') return !lot.is_active;
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
                    case 'created_at':
                        return new Date(b.created_at) - new Date(a.created_at);
                    case 'total_spots':
                        return b.total_spots - a.total_spots;
                    case 'occupancy_rate':
                        return b.occupancy_rate - a.occupancy_rate;
                    default:
                        return 0;
                }
            });
        },

        /**
         * Refresh lots
         */
        refreshLots() {
            this.loadParkingLots();
        },

        /**
         * Edit lot
         */
        editLot(lot) {
            this.currentLot = { ...lot };
            this.errors = {};
            this.showEditModal = true;
        },

        /**
         * View spots
         */
        viewSpots(lot) {
            this.selectedLot = lot;
            this.showSpotsModal = true;
        },

        /**
         * Toggle lot status
         */
        async toggleLotStatus(lot) {
            try {
                const updatedData = { is_active: !lot.is_active };
                await window.api.updateParkingLot(lot.id, updatedData);
                
                lot.is_active = !lot.is_active;
                
                if (window.utils?.showSuccess) {
                    window.utils.showSuccess(`Lot ${lot.is_active ? 'activated' : 'deactivated'} successfully`);
                }
            } catch (error) {
                console.error('Failed to toggle lot status:', error);
                if (window.utils?.showError) {
                    window.utils.showError('Failed to update lot status');
                }
            }
        },

        /**
         * Delete lot
         */
        async deleteLot(lot) {
            if (lot.occupied_spots > 0) {
                if (window.utils?.showError) {
                    window.utils.showError('Cannot delete lot with occupied spots');
                }
                return;
            }

            if (!confirm(`Are you sure you want to delete "${lot.name}"? This action cannot be undone.`)) {
                return;
            }

            try {
                await window.api.deleteParkingLot(lot.id);
                
                // Remove from local arrays
                this.parkingLots = this.parkingLots.filter(l => l.id !== lot.id);
                this.filteredLots = this.filteredLots.filter(l => l.id !== lot.id);
                this.updateStatistics();
                
                if (window.utils?.showSuccess) {
                    window.utils.showSuccess('Parking lot deleted successfully');
                }
            } catch (error) {
                console.error('Failed to delete lot:', error);
                if (window.utils?.showError) {
                    window.utils.showError('Failed to delete parking lot');
                }
            }
        },

        /**
         * Save lot (create or update)
         */
        async saveLot() {
            if (!this.validateLot()) return;

            this.saving = true;

            try {
                if (this.currentLot.id) {
                    // Update existing lot
                    const response = await window.api.updateParkingLot(this.currentLot.id, this.currentLot);
                    
                    // Update in local array
                    const index = this.parkingLots.findIndex(l => l.id === this.currentLot.id);
                    if (index !== -1) {
                        this.parkingLots[index] = response.parking_lot;
                    }
                    
                    if (window.utils?.showSuccess) {
                        window.utils.showSuccess('Parking lot updated successfully');
                    }
                } else {
                    // Create new lot
                    const response = await window.api.createParkingLot(this.currentLot);
                    
                    // Add to local array
                    this.parkingLots.push(response.parking_lot);
                    
                    if (window.utils?.showSuccess) {
                        window.utils.showSuccess(`Parking lot created with ${response.spots_created} spots`);
                    }
                }

                this.updateStatistics();
                this.filterLots();
                this.closeModal();
                
            } catch (error) {
                console.error('Failed to save lot:', error);
                this.handleSaveError(error);
            } finally {
                this.saving = false;
            }
        },

        /**
         * Validate lot form
         */
        validateLot() {
            this.errors = {};

            if (!this.currentLot.name || this.currentLot.name.trim().length < 3) {
                this.errors.name = 'Name must be at least 3 characters';
            }

            if (!this.currentLot.address || this.currentLot.address.trim().length < 10) {
                this.errors.address = 'Please enter a complete address';
            }

            if (!this.currentLot.pin_code || !/^\d{6}$/.test(this.currentLot.pin_code)) {
                this.errors.pin_code = 'PIN code must be 6 digits';
            }

            if (!this.currentLot.price_per_hour || this.currentLot.price_per_hour < 1) {
                this.errors.price_per_hour = 'Price must be at least ₹1';
            }

            if (!this.currentLot.total_spots || this.currentLot.total_spots < 1 || this.currentLot.total_spots > 1000) {
                this.errors.total_spots = 'Spots must be between 1 and 1000';
            }

            return Object.keys(this.errors).length === 0;
        },

        /**
         * Handle save errors
         */
        handleSaveError(error) {
            if (error.message.includes('already exists')) {
                this.errors.name = 'A parking lot with this name already exists';
            } else {
                if (window.utils?.showError) {
                    window.utils.showError('Failed to save parking lot');
                }
            }
        },

        /**
         * Close modal
         */
        closeModal() {
            this.showCreateModal = false;
            this.showEditModal = false;
            this.showSpotsModal = false;
            this.currentLot = this.getEmptyLot();
            this.selectedLot = null;
            this.errors = {};
        },

        /**
         * Get empty lot object
         */
        getEmptyLot() {
            return {
                id: null,
                name: '',
                address: '',
                pin_code: '',
                total_spots: '',
                price_per_hour: '',
                is_active: true
            };
        },

        /**
         * Get occupancy color class
         */
        getOccupancyColor(rate) {
            if (rate >= 90) return 'bg-danger';
            if (rate >= 70) return 'bg-warning';
            if (rate >= 50) return 'bg-info';
            return 'bg-success';
        },

        /**
         * Get spot status text
         */
        getSpotStatus(spot) {
            if (!spot.is_active) return 'Inactive';
            if (spot.is_occupied) return 'Occupied';
            return 'Available';
        }
    }
};

// Register component globally
if (window.Vue) {
    window.Vue.createApp({}).component('admin-parking-lots', window.AdminParkingLotsComponent);
    console.log('✅ AdminParkingLotsComponent registered globally');
}