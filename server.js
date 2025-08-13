const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        },
    },
}));

app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Mock data stores
let marketData = {
    btc_price: 45000,
    core_price: 1.2,
    last_updated: new Date(),
    protocols: {
        'CoreDAO Staking': {
            apy: 12.8,
            tvl: 125000000,
            risk_score: 3,
            liquidity: 'high'
        },
        'Bitcoin Bridge': {
            apy: 8.5,
            tvl: 89000000,
            risk_score: 2,
            liquidity: 'high'
        },
        'CORE-BTC LP': {
            apy: 15.2,
            tvl: 45000000,
            risk_score: 7,
            liquidity: 'medium'
        },
        'Lightning Yield': {
            apy: 6.8,
            tvl: 210000000,
            risk_score: 1,
            liquidity: 'very_high'
        },
        'Cross-Chain Pool': {
            apy: 18.5,
            tvl: 23000000,
            risk_score: 9,
            liquidity: 'low'
        }
    }
};

let userPortfolios = new Map();

// AI Optimization Engine
class AIOptimizer {
    constructor() {
        this.riskProfiles = {
            conservative: { maxRisk: 3, diversification: 0.8 },
            moderate: { maxRisk: 6, diversification: 0.6 },
            aggressive: { maxRisk: 10, diversification: 0.4 }
        };
    }

    optimizePortfolio(amount, riskTolerance, preferences = {}) {
        const profile = this.getRiskProfile(riskTolerance);
        const availableProtocols = this.filterProtocolsByRisk(profile.maxRisk);
        const allocation = this.calculateOptimalAllocation(
            amount, 
            availableProtocols, 
            profile,
            preferences
        );

        return {
            allocation,
            expectedAPY: this.calculateWeightedAPY(allocation),
            riskScore: this.calculatePortfolioRisk(allocation),
            diversificationScore: this.calculateDiversification(allocation),
            projectedYield: this.calculateProjectedYield(amount, allocation),
            rebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            confidence: this.calculateConfidence(allocation)
        };
    }

    getRiskProfile(tolerance) {
        if (tolerance <= 3) return this.riskProfiles.conservative;
        if (tolerance <= 7) return this.riskProfiles.moderate;
        return this.riskProfiles.aggressive;
    }

    filterProtocolsByRisk(maxRisk) {
        return Object.entries(marketData.protocols)
            .filter(([_, protocol]) => protocol.risk_score <= maxRisk)
            .reduce((acc, [name, protocol]) => {
                acc[name] = protocol;
                return acc;
            }, {});
    }

    calculateOptimalAllocation(amount, protocols, profile, preferences) {
        const allocation = {};
        const protocolNames = Object.keys(protocols);
        let remainingAmount = amount;

        // Sort protocols by risk-adjusted return
        const sortedProtocols = protocolNames
            .map(name => ({
                name,
                score: this.calculateRiskAdjustedReturn(protocols[name])
            }))
            .sort((a, b) => b.score - a.score);

        // Apply AI allocation strategy
        sortedProtocols.forEach((protocol, index) => {
            const baseWeight = Math.max(0.1, (sortedProtocols.length - index) / sortedProtocols.length);
            const diversificationPenalty = profile.diversification * (index + 1) / sortedProtocols.length;
            const finalWeight = baseWeight * (1 - diversificationPenalty);
            
            // Add some randomness for optimization variety
            const randomFactor = 0.8 + Math.random() * 0.4;
            const percentage = Math.min(60, Math.max(5, finalWeight * 100 * randomFactor));
            
            const allocatedAmount = (amount * percentage) / 100;
            
            if (allocatedAmount >= 100 && remainingAmount >= allocatedAmount) {
                allocation[protocol.name] = {
                    percentage: Math.round(percentage * 100) / 100,
                    amount: Math.round(allocatedAmount * 100) / 100,
                    apy: protocols[protocol.name].apy,
                    risk: protocols[protocol.name].risk_score,
                    tvl: protocols[protocol.name].tvl,
                    liquidity: protocols[protocol.name].liquidity
                };
                remainingAmount -= allocatedAmount;
            }
        });

        // Normalize to 100%
        const totalAllocated = Object.values(allocation).reduce((sum, item) => sum + item.amount, 0);
        if (totalAllocated > 0) {
            Object.keys(allocation).forEach(protocol => {
                const normalizedAmount = (allocation[protocol].amount / totalAllocated) * amount;
                allocation[protocol].amount = Math.round(normalizedAmount * 100) / 100;
                allocation[protocol].percentage = Math.round((normalizedAmount / amount) * 10000) / 100;
            });
        }

        return allocation;
    }

    calculateRiskAdjustedReturn(protocol) {
        // Sharpe-like ratio: (return - risk_free_rate) / risk
        const riskFreeRate = 2.0; // Assume 2% risk-free rate
        return (protocol.apy - riskFreeRate) / Math.max(1, protocol.risk_score);
    }

    calculateWeightedAPY(allocation) {
        return Object.values(allocation).reduce((sum, item) => {
            return sum + (item.apy * item.percentage / 100);
        }, 0);
    }

    calculatePortfolioRisk(allocation) {
        return Object.values(allocation).reduce((sum, item) => {
            return sum + (item.risk * item.percentage / 100);
        }, 0);
    }

    calculateDiversification(allocation) {
        const numPositions = Object.keys(allocation).length;
        const maxConcentration = Math.max(...Object.values(allocation).map(item => item.percentage));
        return Math.min(10, (numPositions * 2) + (10 - maxConcentration / 10));
    }

    calculateProjectedYield(amount, allocation) {
        const yearlyYield = amount * this.calculateWeightedAPY(allocation) / 100;
        return {
            daily: Math.round(yearlyYield / 365 * 100) / 100,
            weekly: Math.round(yearlyYield / 52 * 100) / 100,
            monthly: Math.round(yearlyYield / 12 * 100) / 100,
            yearly: Math.round(yearlyYield * 100) / 100
        };
    }

    calculateConfidence(allocation) {
        // Calculate confidence based on diversification and liquidity
        const positions = Object.values(allocation);
        const avgLiquidity = positions.reduce((sum, pos) => {
            const liquidityScore = pos.liquidity === 'very_high' ? 5 : 
                                 pos.liquidity === 'high' ? 4 :
                                 pos.liquidity === 'medium' ? 3 :
                                 pos.liquidity === 'low' ? 2 : 1;
            return sum + liquidityScore * pos.percentage / 100;
        }, 0);
        
        const diversificationScore = Math.min(positions.length / 5, 1);
        const liquidityScore = avgLiquidity / 5;
        
        return Math.round((diversificationScore * 0.4 + liquidityScore * 0.6) * 100);
    }
}

const aiOptimizer = new AIOptimizer();

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/api/market-data', (req, res) => {
    // Simulate live market data with small variations
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    
    const liveData = {
        ...marketData,
        btc_price: Math.round(marketData.btc_price * (1 + variation)),
        core_price: Math.round(marketData.core_price * (1 + variation) * 1000) / 1000,
        last_updated: new Date()
    };
    
    res.json(liveData);
});

app.post('/api/optimize', async (req, res) => {
    try {
        const { amount, riskTolerance, preferences = {} } = req.body;

        // Validation
        if (!amount || amount < 100) {
            return res.status(400).json({
                error: 'Amount must be at least $100'
            });
        }

        if (!riskTolerance || riskTolerance < 1 || riskTolerance > 10) {
            return res.status(400).json({
                error: 'Risk tolerance must be between 1 and 10'
            });
        }

        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        const optimization = aiOptimizer.optimizePortfolio(amount, riskTolerance, preferences);

        // Store optimization result (in production, use database)
        const sessionId = req.headers['session-id'] || 'anonymous';
        userPortfolios.set(sessionId, {
            ...optimization,
            amount,
            riskTolerance,
            created_at: new Date()
        });

        res.json({
            success: true,
            ...optimization,
            sessionId
        });

    } catch (error) {
        console.error('Optimization error:', error);
        res.status(500).json({
            error: 'Internal server error during optimization'
        });
    }
});

app.get('/api/portfolio/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const portfolio = userPortfolios.get(sessionId);

    if (!portfolio) {
        return res.status(404).json({
            error: 'Portfolio not found'
        });
    }

    res.json(portfolio);
});

app.post('/api/simulate', async (req, res) => {
    try {
        const { allocation, days = 30 } = req.body;

        if (!allocation || typeof allocation !== 'object') {
            return res.status(400).json({
                error: 'Valid allocation object required'
            });
        }

        // Simulate portfolio performance over time
        const simulation = generatePortfolioSimulation(allocation, days);

        res.json({
            success: true,
            simulation,
            metadata: {
                days,
                protocols: Object.keys(allocation).length,
                generated_at: new Date()
            }
        });

    } catch (error) {
        console.error('Simulation error:', error);
        res.status(500).json({
            error: 'Internal server error during simulation'
        });
    }
});

app.get('/api/protocols', (req, res) => {
    const { risk_max, apy_min, liquidity } = req.query;
    
    let filteredProtocols = { ...marketData.protocols };

    // Apply filters
    if (risk_max) {
        Object.keys(filteredProtocols).forEach(protocol => {
            if (filteredProtocols[protocol].risk_score > parseInt(risk_max)) {
                delete filteredProtocols[protocol];
            }
        });
    }

    if (apy_min) {
        Object.keys(filteredProtocols).forEach(protocol => {
            if (filteredProtocols[protocol].apy < parseFloat(apy_min)) {
                delete filteredProtocols[protocol];
            }
        });
    }

    if (liquidity) {
        Object.keys(filteredProtocols).forEach(protocol => {
            if (filteredProtocols[protocol].liquidity !== liquidity) {
                delete filteredProtocols[protocol];
            }
        });
    }

    res.json({
        protocols: filteredProtocols,
        count: Object.keys(filteredProtocols).length
    });
});

// Utility functions
function generatePortfolioSimulation(allocation, days) {
    const simulation = [];
    const startDate = new Date();
    
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        let totalValue = 0;
        const dailyReturns = {};

        Object.entries(allocation).forEach(([protocol, data]) => {
            // Simulate daily returns with realistic volatility
            const dailyAPY = data.apy / 365;
            const volatility = data.risk * 0.01; // Higher risk = more volatility
            const randomReturn = (Math.random() - 0.5) * volatility * 2;
            const dailyReturn = dailyAPY + randomReturn;
            
            const protocolValue = data.amount * Math.pow(1 + dailyReturn / 100, i + 1);
            totalValue += protocolValue;
            
            dailyReturns[protocol] = {
                value: Math.round(protocolValue * 100) / 100,
                return: Math.round(dailyReturn * 10000) / 10000
            };
        });

        simulation.push({
            date: date.toISOString().split('T')[0],
            totalValue: Math.round(totalValue * 100) / 100,
            dailyReturns
        });
    }

    return simulation;
}

// Scheduled tasks
cron.schedule('*/30 * * * * *', () => {
    // Update market data every 30 seconds
    const btcVariation = (Math.random() - 0.5) * 0.01;
    const coreVariation = (Math.random() - 0.5) * 0.02;
    
    marketData.btc_price = Math.max(30000, Math.min(60000, 
        marketData.btc_price * (1 + btcVariation)
    ));
    marketData.core_price = Math.max(0.5, Math.min(2.0,
        marketData.core_price * (1 + coreVariation)
    ));
    marketData.last_updated = new Date();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            error: 'API endpoint not found'
        });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 BitcoinYield Pro server running on port ${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`🌐 Frontend available at http://localhost:${PORT}/`);
});

module.exports = app;
