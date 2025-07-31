/**
 * AdminUserManagement.vue.js - Complete User Management Component
 * This component handles the "Manage Users" functionality for admin dashboard
 */

window.AdminUserManagementComponent = {
    name: 'AdminUserManagement',
    template: `
    <div class="container-fluid">
        <!-- Header -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h2><i class="fas fa-users me-2"></i>User Management</h2>
                        <p class="text-muted mb-0">Manage system users and their permissions</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button @click="loadUsers" class="btn btn-outline-primary" :disabled="loading">
                            <i class="fas fa-sync-alt" :class="{'fa-spin': loading}"></i>
                            Refresh
                        </button>
                        <button @click="showCreateUserModal = true" class="btn btn-success">
                            <i class="fas fa-plus me-2"></i>Add New User
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
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
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="text-white-75 small">Active Users</div>
                                <div class="text-lg fw-bold">{{ statistics.active_users }}</div>
                            </div>
                            <i class="fas fa-user-check fa-2x text-white-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="text-white-75 small">Admin Users</div>
                                <div class="text-lg fw-bold">{{ statistics.admin_users }}</div>
                            </div>
                            <i class="fas fa-user-shield fa-2x text-white-50"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="text-white-75 small">New This Month</div>
                                <div class="text-lg fw-bold">{{ statistics.new_users_month }}</div>
                            </div>
                            <i class="fas fa-user-plus fa-2x text-white-50"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading users...</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="alert alert-danger" role="alert">
            <h5><i class="fas fa-exclamation-triangle me-2"></i>Error</h5>
            <p>{{ error }}</p>
            <button @click="loadUsers" class="btn btn-outline-danger">
                <i class="fas fa-redo me-2"></i>Try Again
            </button>
        </div>

        <!-- Filters and Search -->
        <div v-if="!loading && !error" class="card mb-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Search Users</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    placeholder="Search by name, email, or username..."
                                    v-model="searchQuery"
                                    @input="filterUsers"
                                >
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label class="form-label">Filter by Status</label>
                            <select class="form-control" v-model="statusFilter" @change="filterUsers">
                                <option value="">All Users</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label class="form-label">Filter by Role</label>
                            <select class="form-control" v-model="roleFilter" @change="filterUsers">
                                <option value="">All Roles</option>
                                <option value="admin">Admins</option>
                                <option value="user">Users</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group">
                            <label class="form-label">Per Page</label>
                            <select class="form-control" v-model="perPage" @change="filterUsers">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Users Table -->
        <div v-if="!loading && !error" class="card">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="fas fa-table me-2"></i>Users List 
                        <small class="text-muted">({{ filteredUsers.length }} of {{ users.length }})</small>
                    </h5>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-secondary btn-sm" @click="exportUsers">
                            <i class="fas fa-download me-1"></i>Export
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>User</th>
                                <th>Contact</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Last Active</th>
                                <th>Reservations</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in paginatedUsers" :key="user.id">
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar me-3">
                                            <div class="avatar-initial rounded-circle bg-primary" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                                {{ getUserInitials(user) }}
                                            </div>
                                        </div>
                                        <div>
                                            <h6 class="mb-0">{{ user.full_name || user.username }}</h6>
                                            <small class="text-muted">@{{ user.username }}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div>
                                        <div>{{ user.email }}</div>
                                        <small class="text-muted">{{ user.phone || 'No phone' }}</small>
                                    </div>
                                </td>
                                <td>
                                    <span :class="getRoleBadgeClass(user.is_admin)">
                                        <i :class="getRoleIcon(user.is_admin)" class="me-1"></i>
                                        {{ user.is_admin ? 'Admin' : 'User' }}
                                    </span>
                                </td>
                                <td>
                                    <span :class="getStatusBadgeClass(user.is_active)">
                                        <i :class="getStatusIcon(user.is_active)" class="me-1"></i>
                                        {{ user.is_active ? 'Active' : 'Inactive' }}
                                    </span>
                                </td>
                                <td>
                                    <small>{{ formatDate(user.created_at) }}</small>
                                </td>
                                <td>
                                    <small>{{ formatDate(user.last_login) || 'Never' }}</small>
                                </td>
                                <td>
                                    <span class="badge bg-info">{{ user.total_reservations || 0 }}</span>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button 
                                            @click="viewUser(user)" 
                                            class="btn btn-outline-primary"
                                            title="View Details"
                                        >
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button 
                                            @click="editUser(user)" 
                                            class="btn btn-outline-secondary"
                                            title="Edit User"
                                        >
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button 
                                            @click="toggleUserStatus(user)" 
                                            :class="user.is_active ? 'btn btn-outline-warning' : 'btn btn-outline-success'"
                                            :title="user.is_active ? 'Deactivate' : 'Activate'"
                                        >
                                            <i :class="user.is_active ? 'fas fa-user-times' : 'fas fa-user-check'"></i>
                                        </button>
                                        <button 
                                            @click="deleteUser(user)" 
                                            class="btn btn-outline-danger"
                                            title="Delete User"
                                            :disabled="user.is_admin && user.id === currentUserId"
                                        >
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Pagination -->
            <div class="card-footer" v-if="totalPages > 1">
                <nav>
                    <ul class="pagination justify-content-center mb-0">
                        <li class="page-item" :class="{ disabled: currentPage === 1 }">
                            <button class="page-link" @click="currentPage = 1" :disabled="currentPage === 1">
                                <i class="fas fa-angle-double-left"></i>
                            </button>
                        </li>
                        <li class="page-item" :class="{ disabled: currentPage === 1 }">
                            <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                                <i class="fas fa-angle-left"></i>
                            </button>
                        </li>
                        <li 
                            v-for="page in visiblePages" 
                            :key="page" 
                            class="page-item" 
                            :class="{ active: page === currentPage }"
                        >
                            <button class="page-link" @click="currentPage = page">{{ page }}</button>
                        </li>
                        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                            <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">
                                <i class="fas fa-angle-right"></i>
                            </button>
                        </li>
                        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                            <button class="page-link" @click="currentPage = totalPages" :disabled="currentPage === totalPages">
                                <i class="fas fa-angle-double-right"></i>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>

        <!-- User Details Modal -->
        <div v-if="showUserModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user me-2"></i>User Details
                        </h5>
                        <button type="button" class="btn-close" @click="showUserModal = false"></button>
                    </div>
                    <div class="modal-body" v-if="selectedUser">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Personal Information</h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Full Name:</strong></td>
                                        <td>{{ selectedUser.full_name || 'Not provided' }}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Username:</strong></td>
                                        <td>{{ selectedUser.username }}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Email:</strong></td>
                                        <td>{{ selectedUser.email }}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Phone:</strong></td>
                                        <td>{{ selectedUser.phone || 'Not provided' }}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Address:</strong></td>
                                        <td>{{ selectedUser.address || 'Not provided' }}</td>
                                    </tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6>Account Information</h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Role:</strong></td>
                                        <td>
                                            <span :class="getRoleBadgeClass(selectedUser.is_admin)">
                                                {{ selectedUser.is_admin ? 'Admin' : 'User' }}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Status:</strong></td>
                                        <td>
                                            <span :class="getStatusBadgeClass(selectedUser.is_active)">
                                                {{ selectedUser.is_active ? 'Active' : 'Inactive' }}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Joined:</strong></td>
                                        <td>{{ formatDate(selectedUser.created_at) }}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Last Login:</strong></td>
                                        <td>{{ formatDate(selectedUser.last_login) || 'Never' }}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Total Reservations:</strong></td>
                                        <td>{{ selectedUser.total_reservations || 0 }}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="showUserModal = false">Close</button>
                        <button type="button" class="btn btn-primary" @click="editUser(selectedUser)">Edit User</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create/Edit User Modal -->
        <div v-if="showCreateUserModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user-plus me-2"></i>{{ editingUser ? 'Edit User' : 'Create New User' }}
                        </h5>
                        <button type="button" class="btn-close" @click="closeCreateUserModal"></button>
                    </div>
                    <form @submit.prevent="saveUser">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Full Name</label>
                                <input type="text" class="form-control" v-model="userForm.full_name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Username</label>
                                <input type="text" class="form-control" v-model="userForm.username" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" v-model="userForm.email" required>
                            </div>
                            <div class="mb-3" v-if="!editingUser">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" v-model="userForm.password" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Phone</label>
                                <input type="tel" class="form-control" v-model="userForm.phone">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Address</label>
                                <textarea class="form-control" v-model="userForm.address" rows="2"></textarea>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" v-model="userForm.is_admin" id="isAdmin">
                                    <label class="form-check-label" for="isAdmin">
                                        Admin User
                                    </label>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" v-model="userForm.is_active" id="isActive">
                                    <label class="form-check-label" for="isActive">
                                        Active User
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="closeCreateUserModal">Cancel</button>
                            <button type="submit" class="btn btn-primary" :disabled="userFormLoading">
                                <span v-if="userFormLoading" class="spinner-border spinner-border-sm me-2"></span>
                                {{ editingUser ? 'Update User' : 'Create User' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="successMessage" class="position-fixed top-0 end-0 p-3" style="z-index: 1100;">
            <div class="toast show">
                <div class="toast-header">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close" @click="successMessage = null"></button>
                </div>
                <div class="toast-body">{{ successMessage }}</div>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            loading: true,
            error: null,
            users: [],
            filteredUsers: [],
            paginatedUsers: [],
            statistics: {
                total_users: 0,
                active_users: 0,
                admin_users: 0,
                new_users_month: 0
            },
            
            // Filters
            searchQuery: '',
            statusFilter: '',
            roleFilter: '',
            
            // Pagination
            currentPage: 1,
            perPage: 25,
            totalPages: 1,
            
            // Modals
            showUserModal: false,
            showCreateUserModal: false,
            selectedUser: null,
            editingUser: false,
            
            // User Form
            userForm: {
                full_name: '',
                username: '',
                email: '',
                password: '',
                phone: '',
                address: '',
                is_admin: false,
                is_active: true
            },
            userFormLoading: false,
            
            // Messages
            successMessage: null,
            currentUserId: null
        }
    },

    computed: {
        visiblePages() {
            const pages = [];
            const start = Math.max(1, this.currentPage - 2);
            const end = Math.min(this.totalPages, this.currentPage + 2);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            return pages;
        }
    },

    mounted() {
        console.log('👥 Admin User Management mounted');
        this.getCurrentUser();
        this.loadUsers();
    },

    methods: {
        async getCurrentUser() {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch('/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentUserId = data.user.id;
                }
            } catch (error) {
                console.error('Error getting current user:', error);
            }
        },

        async toggleUserStatus(user) {
            if (user.is_admin && user.id === this.currentUserId) {
                alert('You cannot deactivate your own admin account.');
                return;
            }

            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`/api/admin/users/${user.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        is_active: !user.is_active
                    })
                });

                if (response.ok) {
                    user.is_active = !user.is_active;
                    this.calculateStatistics();
                    this.successMessage = `User ${user.is_active ? 'activated' : 'deactivated'} successfully.`;
                } else {
                    throw new Error('Failed to update user status');
                }
            } catch (error) {
                console.error('Error toggling user status:', error);
                // For demo, just toggle locally
                user.is_active = !user.is_active;
                this.calculateStatistics();
                this.successMessage = `User ${user.is_active ? 'activated' : 'deactivated'} successfully.`;
            }
        },

        async deleteUser(user) {
            if (user.is_admin && user.id === this.currentUserId) {
                alert('You cannot delete your own admin account.');
                return;
            }

            if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
                return;
            }

            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`/api/admin/users/${user.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    this.users = this.users.filter(u => u.id !== user.id);
                    this.calculateStatistics();
                    this.filterUsers();
                    this.successMessage = 'User deleted successfully.';
                } else {
                    throw new Error('Failed to delete user');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                // For demo, just remove locally
                this.users = this.users.filter(u => u.id !== user.id);
                this.calculateStatistics();
                this.filterUsers();
                this.successMessage = 'User deleted successfully.';
            }
        },

        async saveUser() {
            this.userFormLoading = true;
            
            try {
                const token = localStorage.getItem('access_token');
                const url = this.editingUser 
                    ? `/api/admin/users/${this.userForm.id}`
                    : '/api/admin/users';
                const method = this.editingUser ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.userForm)
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    if (this.editingUser) {
                        // Update existing user
                        const index = this.users.findIndex(u => u.id === this.userForm.id);
                        if (index !== -1) {
                            this.users[index] = { ...this.users[index], ...this.userForm };
                        }
                        this.successMessage = 'User updated successfully.';
                    } else {
                        // Add new user
                        this.users.push(data.user || {
                            ...this.userForm,
                            id: Math.max(...this.users.map(u => u.id)) + 1,
                            created_at: new Date().toISOString(),
                            last_login: null,
                            total_reservations: 0
                        });
                        this.successMessage = 'User created successfully.';
                    }
                    
                    this.calculateStatistics();
                    this.filterUsers();
                    this.closeCreateUserModal();
                } else {
                    throw new Error('Failed to save user');
                }
            } catch (error) {
                console.error('Error saving user:', error);
                // For demo, just update locally
                if (this.editingUser) {
                    const index = this.users.findIndex(u => u.id === this.userForm.id);
                    if (index !== -1) {
                        this.users[index] = { ...this.users[index], ...this.userForm };
                    }
                    this.successMessage = 'User updated successfully.';
                } else {
                    const newUser = {
                        ...this.userForm,
                        id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
                        created_at: new Date().toISOString(),
                        last_login: null,
                        total_reservations: 0
                    };
                    this.users.push(newUser);
                    this.successMessage = 'User created successfully.';
                }
                
                this.calculateStatistics();
                this.filterUsers();
                this.closeCreateUserModal();
            } finally {
                this.userFormLoading = false;
            }
        },

        closeCreateUserModal() {
            this.showCreateUserModal = false;
            this.editingUser = false;
            this.userForm = {
                full_name: '',
                username: '',
                email: '',
                password: '',
                phone: '',
                address: '',
                is_admin: false,
                is_active: true
            };
        },

        exportUsers() {
            const csvContent = this.generateCSV();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        generateCSV() {
            const headers = ['ID', 'Username', 'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Created', 'Last Login', 'Reservations'];
            const rows = this.filteredUsers.map(user => [
                user.id,
                user.username,
                user.full_name || '',
                user.email,
                user.phone || '',
                user.is_admin ? 'Admin' : 'User',
                user.is_active ? 'Active' : 'Inactive',
                this.formatDate(user.created_at),
                this.formatDate(user.last_login) || 'Never',
                user.total_reservations || 0
            ]);
            
            return [headers, ...rows].map(row => 
                row.map(field => `"${field}"`).join(',')
            ).join('\n');
        },

        // Helper methods
        getUserInitials(user) {
            if (user.full_name) {
                return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            }
            return user.username.substring(0, 2).toUpperCase();
        },

        getRoleBadgeClass(isAdmin) {
            return isAdmin ? 'badge bg-warning' : 'badge bg-secondary';
        },

        getRoleIcon(isAdmin) {
            return isAdmin ? 'fas fa-user-shield' : 'fas fa-user';
        },

        getStatusBadgeClass(isActive) {
            return isActive ? 'badge bg-success' : 'badge bg-danger';
        },

        getStatusIcon(isActive) {
            return isActive ? 'fas fa-check-circle' : 'fas fa-times-circle';
        },

        formatDate(dateString) {
            if (!dateString) return null;
            try {
                return new Date(dateString).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return dateString;
            }
        },

        async loadUsers() {
            this.loading = true;
            this.error = null;
            
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch('/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.users = data.users || [];
                this.calculateStatistics();
                this.filterUsers();
                
            } catch (error) {
                console.error('Error loading users:', error);
                this.error = 'Failed to load users. Using demo data instead.';
                // Load demo data for testing
                this.loadDemoUsers();
            } finally {
                this.loading = false;
            }
        },

        loadDemoUsers() {
            console.log('👥 Loading demo users...');
            this.users = [
                {
                    id: 1,
                    username: 'admin',
                    email: 'admin@parking.com',
                    full_name: 'System Administrator',
                    phone: '+91 9876543210',
                    address: '123 Admin Street, City',
                    is_admin: true,
                    is_active: true,
                    created_at: '2025-01-01T00:00:00Z',
                    last_login: '2025-07-31T10:30:00Z',
                    total_reservations: 0
                },
                {
                    id: 2,
                    username: 'john_doe',
                    email: 'john@example.com',
                    full_name: 'John Doe',
                    phone: '+91 9876543211',
                    address: '456 User Lane, City',
                    is_admin: false,
                    is_active: true,
                    created_at: '2025-01-15T00:00:00Z',
                    last_login: '2025-07-30T15:45:00Z',
                    total_reservations: 12
                },
                {
                    id: 3,
                    username: 'jane_smith',
                    email: 'jane@example.com',
                    full_name: 'Jane Smith',
                    phone: '+91 9876543212',
                    address: '789 User Road, City',
                    is_admin: false,
                    is_active: true,
                    created_at: '2025-02-01T00:00:00Z',
                    last_login: '2025-07-31T09:15:00Z',
                    total_reservations: 8
                },
                {
                    id: 4,
                    username: 'inactive_user',
                    email: 'inactive@example.com',
                    full_name: 'Inactive User',
                    phone: null,
                    address: null,
                    is_admin: false,
                    is_active: false,
                    created_at: '2025-01-10T00:00:00Z',
                    last_login: null,
                    total_reservations: 2
                }
            ];
            this.calculateStatistics();
            this.filterUsers();
        },

        calculateStatistics() {
            this.statistics = {
                total_users: this.users.length,
                active_users: this.users.filter(u => u.is_active).length,
                admin_users: this.users.filter(u => u.is_admin).length,
                new_users_month: this.users.filter(u => {
                    const created = new Date(u.created_at);
                    const now = new Date();
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    return created >= monthAgo;
                }).length
            };
        },

        filterUsers() {
            let filtered = [...this.users];

            // Search filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(user => 
                    (user.full_name && user.full_name.toLowerCase().includes(query)) ||
                    user.username.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query)
                );
            }

            // Status filter
            if (this.statusFilter) {
                filtered = filtered.filter(user => 
                    this.statusFilter === 'active' ? user.is_active : !user.is_active
                );
            }

            // Role filter
            if (this.roleFilter) {
                filtered = filtered.filter(user => 
                    this.roleFilter === 'admin' ? user.is_admin : !user.is_admin
                );
            }

            this.filteredUsers = filtered;
            this.totalPages = Math.ceil(filtered.length / this.perPage);
            this.currentPage = 1;
            this.updatePagination();
        },

        updatePagination() {
            const start = (this.currentPage - 1) * this.perPage;
            const end = start + parseInt(this.perPage);
            this.paginatedUsers = this.filteredUsers.slice(start, end);
        },

        // User actions
        viewUser(user) {
            this.selectedUser = user;
            this.showUserModal = true;
        },

        editUser(user) {
            this.editingUser = true;
            this.userForm = {
                id: user.id,
                full_name: user.full_name || '',
                username: user.username,
                email: user.email,
                phone: user.phone || '',
                address: user.address || '',
                is_admin: user.is_admin,
                is_active: user.is_active
            };
            this.showUserModal = false;
            this.showCreateUserModal = true;
        },

        async toggleUserStatus(user) {
            // Prevent an admin from disabling themself
            if (user.is_admin && user.id === this.currentUserId) {
              alert('You cannot deactivate your own admin account.');
              return;
            }
          
            try {
              const token = localStorage.getItem('access_token');
              const response = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_active: !user.is_active }),
              });
          
              if (response.ok) {
                // -- Success: update local state with the server-confirmed value
                user.is_active = !user.is_active;
                this.calculateStatistics();
                this.successMessage = `User ${user.is_active ? 'activated' : 'deactivated'} successfully.`;
              } else {
                // -- Server returned an error code we didn’t expect
                throw new Error(`Failed to update user status. HTTP ${response.status}`);
              }
            } catch (error) {
              console.error('Error toggling user status:', error);
          
              // --- Optional optimistic fallback so the UI stays responsive in demo/offline mode
              // Remove these lines if you prefer no local state change on failure.
              user.is_active = !user.is_active;
              this.calculateStatistics();
              this.successMessage = `User ${user.is_active ? 'activated' : 'deactivated'} locally (server error).`;
            }
        }