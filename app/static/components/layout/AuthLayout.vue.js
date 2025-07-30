
 //Authentication Layout Component

window.AuthLayoutComponent = {
    name: 'AuthLayout',
    template: `
    <div class="auth-layout">
        <div class="auth-background"></div>
        <div class="container-fluid h-100">
            <div class="row h-100">
                <!-- Left Side - Branding -->
                <div class="col-lg-6 d-none d-lg-flex auth-branding">
                    <div class="d-flex flex-column justify-content-center align-items-center text-white h-100 p-5">
                        <div class="auth-brand-content text-center">
                            <i class="fas fa-car fa-5x mb-4 text-white opacity-75"></i>
                            <h1 class="display-4 fw-bold mb-3">Vehicle Parking System</h1>
                            <p class="lead mb-4">Smart parking management made simple</p>
                            <div class="row text-center">
                                <div class="col-4">
                                    <i class="fas fa-parking fa-2x mb-2 text-warning"></i>
                                    <h6>Smart Allocation</h6>
                                </div>
                                <div class="col-4">
                                    <i class="fas fa-clock fa-2x mb-2 text-info"></i>
                                    <h6>Real-time Tracking</h6>
                                </div>
                                <div class="col-4">
                                    <i class="fas fa-chart-line fa-2x mb-2 text-success"></i>
                                    <h6>Analytics</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Side - Auth Forms -->
                <div class="col-lg-6 d-flex align-items-center justify-content-center auth-form-container">
                    <div class="auth-form-wrapper w-100">
                        <div class="card border-0 shadow-lg">
                            <div class="card-body p-5">
                                <!-- Mobile Brand -->
                                <div class="d-lg-none text-center mb-4">
                                    <i class="fas fa-car fa-3x text-primary mb-2"></i>
                                    <h4 class="text-primary fw-bold">Vehicle Parking System</h4>
                                </div>

                                <!-- Dynamic Content Slot -->
                                <slot></slot>

                                <!-- Footer -->
                                <div class="text-center mt-4 pt-4 border-top">
                                    <small class="text-muted">
                                        &copy; 2025 Vehicle Parking System. All rights reserved.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    
    mounted() {
        console.log('🎨 Auth Layout mounted');
        document.body.classList.add('auth-page');
    },
    
    beforeUnmount() {
        document.body.classList.remove('auth-page');
    }
};


if (window.Vue) {
    window.Vue.createApp({}).component('auth-layout', window.AuthLayoutComponent);
}