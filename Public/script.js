// BitcoinYield Pro - Complete Frontend Logic
class BitcoinYieldPro {
    constructor() {
        this.currentTab = 'dashboard';
        this.marketData = { btc_price: 45000, core_price: 1.2 };
        this.portfolioChart = null;
        this.yieldChart = null;
        this.isConnected = false;
        this.notifications = [];
        this.userPortfolio = {
            totalValue: 12450.50,
            positions: []
        };
        
        this.init();
    }

    async init() {
        // Initialize the application
        await this.delay(2000); // Simulate loading
        this.hideLoading();
        this.initializeCharts();
        this.loadMarketData();
        this.updateConversions();
        this.startDataRefresh();
        this.initializeEventListeners();
        
        console.log('🚀 BitcoinYield Pro initialized successfully!');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.style.display = 'none', 500);
        }
    }

    // Tab Management
    showTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab and activate button
        const targetTab = document.getElementById(tabName);
        const targetBtn = document.querySelector(`[onclick="app.showTab('${tabName}')"]`);
        
        if (targetTab && targetBtn) {
            targetTab.classList.add('active');
            targetBtn.classList.add('active');
            this.currentTab = tabName;
        }

        // Resize charts when switching tabs
        if (tabName === 'dashboard') {
            setTimeout(() => this.resizeCharts(), 100);
        }
    }

    // Chart Initialization
    initializeCharts() {
        this.initPortfolioChart();
        this.initYieldChart();
    }

    initPortfolioChart() {
        const ctx = document.getElementById('portfolioChart');
        if (!ctx) return;

        this.portfolioChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['CoreDAO Staking', 'Bitcoin Bridge', 'CORE-BTC LP', 'Cash'],
                datasets: [{
                    data: [40, 30, 20, 10],
                    backgroundColor: [
                        '#667eea',
                        '#10b981',
                        '#f59e0b',
                        '#e5e7eb'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    initYieldChart() {
        const ctx = document.getElementById('yieldChart');
        if (!ctx) return;

        const data = this.generateYieldData('7d');
        
        this.yieldChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Portfolio Yield %',
                    data: data.values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        }
                    },
                    x: {
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });
    }

    generateYieldData(period) {
        const now = new Date();
        const data = { labels: [], values: [] };
        
        let days, points;
        switch (period) {
            case '7d': days = 7; points = 7; break;
            case '30d': days = 30; points = 15; break;
            case '90d': days = 90; points = 18; break;
            default: days = 7; points = 7;
        }

        for (let i = points - 1; i >= 0; i--) {
            const date = new Date(now - (i * (days / points) * 24 * 60 * 60 * 1000));
            data.labels.push(date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }));
            
            // Generate realistic yield data
            const baseYield = 11.8;
            const variance = (Math.random() - 0.5) * 2;
            data.values.push(baseYield + variance);
        }

        return data;
    }

    updateChart(period) {
        // Update active chart button
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[onclick="app.updateChart('${period}')"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Update chart data
        const data = this.generateYieldData(period);
        this.yieldChart.data.labels = data.labels;
        this.yieldChart.data.datasets[0].data = data.values;
        this.yieldChart.update();
    }

    resizeCharts() {
        if (this.portfolioChart) this.portfolioChart.resize();
        if (this.yieldChart) this.yieldChart.resize();
    }

    // Market Data Management
    async loadMarketData() {
        try {
            // Simulate API call with realistic data
            await this.delay(100);
            this.marketData = {
                btc_price: 45000 + (Math.random() - 0.5) * 2000,
                core_price: 1.2 + (Math.random() - 0.5) * 0.2,
                change_24h: (Math.random() - 0.5) * 10
            };
        } catch (error) {
            console.warn('Using cached market data:', error.message);
        }
        
        this.updateMarketDisplay();
    }

    updateMarketDisplay() {
        const btcPriceEl = document.getElementById('btc-price');
        const coreAPYEl = document.getElementById('core-apy');
        
        if (btcPriceEl) {
            btcPriceEl.textContent = `$${this.marketData.btc_price.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        }
        
        if (coreAPYEl) {
            coreAPYEl.textContent = '12.8%';
        }
    }

    updateConversions() {
        const paymentAmount = document.getElementById('paymentAmount');
        const usdEquivalent = document.getElementById('usdEquivalent');
        
        if (paymentAmount) {
            paymentAmount.addEventListener('input', (e) => {
                const btcAmount = parseFloat(e.target.value) || 0;
                const usdValue = (btcAmount * this.marketData.btc_price).toFixed(2);
                if (usdEquivalent) {
                    usdEquivalent.textContent = usdValue;
                }
            });
        }
    }

    startDataRefresh() {
        // Refresh market data every 30 seconds
        setInterval(() => {
            this.loadMarketData();
        }, 30000);
    }

    initializeEventListeners() {
        // Risk tolerance slider
        const riskSlider = document.getElementById('riskSlider');
        const riskValue = document.getElementById('riskValue');
        
        if (riskSlider && riskValue) {
            riskSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                riskValue.textContent = value;
                
                const riskLabels = ['Conservative', 'Moderate', 'Aggressive'];
                const riskLabel = document.getElementById('riskLabel');
                if (riskLabel) {
                    if (value <= 3) riskLabel.textContent = riskLabels[0];
                    else if (value <= 7) riskLabel.textContent = riskLabels[1];
                    else riskLabel.textContent = riskLabels[2];
                }
            });
        }

        // Mobile menu toggle
        const menuToggle = document.querySelector('.menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Window resize handler for charts
        window.addEventListener('resize', () => {
            this.resizeCharts();
        });
    }

    // AI Optimization
    async optimizePortfolio() {
        const amount = document.getElementById('investAmount').value;
        const riskTolerance = document.getElementById('riskSlider').value;
        
        if (!amount || amount < 100) {
            this.showToast('Please enter an amount of at least $100', 'error');
            return;
        }

        // Show loading state
        const optimizeBtn = document.querySelector('.optimize-btn');
        const originalText = optimizeBtn.innerHTML;
        optimizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...';
        optimizeBtn.disabled = true;

        try {
            // Simulate AI optimization
            await this.delay(2000);
            
            const result = this.generateOptimizationResult(parseFloat(amount), parseInt(riskTolerance));
            this.displayOptimizationResult(result);
            this.showToast('Portfolio optimized successfully!');
            
        } catch (error) {
            this.showToast('Optimization failed. Please try again.', 'error');
            console.error('Optimization error:', error);
        } finally {
            optimizeBtn.innerHTML = originalText;
            optimizeBtn.disabled = false;
        }
    }

    generateOptimizationResult(amount, risk) {
        const protocols = {
            'CoreDAO Staking': { apy: 12.8, risk: 3 },
            'Bitcoin Bridge': { apy: 8.5, risk: 2 },
            'CORE-BTC LP': { apy: 15.2, risk: 7 },
            'Lightning Yield': { apy: 6.8, risk: 1 },
            'Cross-Chain Pool': { apy: 18.5, risk: 9 }
        };

        const allocation = {};
        let totalPercentage = 0;
        let weightedAPY = 0;
        let weightedRisk = 0;

        // AI allocation logic based on risk tolerance
        Object.entries(protocols).forEach(([protocol, data]) => {
            let percentage = 0;
            
            if (risk <= 3) { // Conservative
                if (data.risk <= 3) percentage = Math.random() * 40 + 10;
            } else if (risk <= 7) { // Moderate
                if (data.risk <= 6) percentage = Math.random() * 30 + 15;
            } else { // Aggressive
                percentage = Math.random() * 25 + 10;
            }
            
            if (percentage > 0) {
                allocation[protocol] = {
                    percentage: Math.round(percentage),
                    amount: (amount * percentage / 100).toFixed(2),
                    apy: data.apy,
                    risk: data.risk
                };
                totalPercentage += percentage;
                weightedAPY += data.apy * (percentage / 100);
                weightedRisk += data.risk * (percentage / 100);
            }
        });

        // Normalize percentages to 100%
        Object.keys(allocation).forEach(protocol => {
            const normalizedPercentage = (allocation[protocol].percentage / totalPercentage) * 100;
            allocation[protocol].percentage = Math.round(normalizedPercentage);
            allocation[protocol].amount = (amount * normalizedPercentage / 100).toFixed(2);
        });

        return {
            allocation,
            expectedAPY: weightedAPY,
            riskScore: Math.round(weightedRisk * 10) / 10,
            projectedYield: {
                monthly: (amount * weightedAPY / 100 / 12).toFixed(2),
                yearly: (amount * weightedAPY / 100).toFixed(2)
            }
        };
    }

    displayOptimizationResult(result) {
        const resultDiv = document.getElementById('optimizationResult');
        const allocationGrid = document.getElementById('allocationGrid');
        const expectedAPY = document.getElementById('expectedAPY');
        const riskScore = document.getElementById('riskScore');
        const monthlyYield = document.getElementById('monthlyYield');
        const yearlyYield = document.getElementById('yearlyYield');

        // Clear previous results
        if (allocationGrid) allocationGrid.innerHTML = '';

        // Display allocations
        Object.entries(result.allocation).forEach(([protocol, data]) => {
            const allocationItem = document.createElement('div');
            allocationItem.className = 'allocation-item';
            allocationItem.innerHTML = `
                <div class="allocation-header">
                    <h5>${protocol}</h5>
                    <div class="allocation-percentage">${data.percentage}%</div>
                </div>
                <div class="allocation-details">
                    <p><strong>Amount:</strong> $${parseFloat(data.amount).toLocaleString()}</p>
                    <p><strong>APY:</strong> ${data.apy}% | <strong>Risk:</strong> ${data.risk}/10</p>
                </div>
                <div class="allocation-progress">
                    <div class="progress-bar" style="width: ${data.percentage}%"></div>
                </div>
            `;
            if (allocationGrid) allocationGrid.appendChild(allocationItem);
        });

        // Update summary
        if (expectedAPY) expectedAPY.textContent = `${result.expectedAPY.toFixed(2)}%`;
        if (riskScore) riskScore.textContent = `${result.riskScore}/10`;
        if (monthlyYield) monthlyYield.textContent = `$${result.projectedYield.monthly}`;
        if (yearlyYield) yearlyYield.textContent = `$${result.projectedYield.yearly}`;

        // Show results
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Wallet Connection
    async connectWallet() {
        const connectBtn = document.querySelector('.connect-wallet-btn');
        const originalText = connectBtn.innerHTML;
        
        connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        connectBtn.disabled = true;

        try {
            await this.delay(1500); // Simulate connection time
            
            this.isConnected = true;
            connectBtn.innerHTML = '<i class="fas fa-check"></i> Connected';
            connectBtn.classList.add('connected');
            
            this.showToast('Wallet connected successfully!');
            this.updateWalletDisplay();
            
        } catch (error) {
            this.showToast('Failed to connect wallet', 'error');
            connectBtn.innerHTML = originalText;
        } finally {
            connectBtn.disabled = false;
        }
    }

    updateWalletDisplay() {
        const walletAddress = document.getElementById('walletAddress');
        const portfolioValue = document.getElementById('portfolioValue');
        
        if (walletAddress) {
            walletAddress.textContent = 'bc1q...x7k9';
        }
        
        if (portfolioValue) {
            portfolioValue.textContent = `$${this.userPortfolio.totalValue.toLocaleString()}`;
        }
    }

    // Notification System
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        const container = document.getElementById('toastContainer') || this.createToastContainer();
        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatPercentage(value) {
        return `${value.toFixed(2)}%`;
    }

    // Export portfolio data
    exportPortfolio() {
        const portfolioData = {
            timestamp: new Date().toISOString(),
            totalValue: this.userPortfolio.totalValue,
            positions: this.userPortfolio.positions,
            marketData: this.marketData
        };

        const dataStr = JSON.stringify(portfolioData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `bitcoinyield-portfolio-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('Portfolio exported successfully!');
    }
}

// Global app instance
let app;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new BitcoinYieldPro();
});

// Global functions for HTML onclick handlers
function showTab(tabName) {
    app.showTab(tabName);
}

function updateChart(period) {
    app.updateChart(period);
}

function optimizePortfolio() {
    app.optimizePortfolio();
}

function connectWallet() {
    app.connectWallet();
}

function exportPortfolio() {
    app.exportPortfolio();
}
