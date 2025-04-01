// Trading System Core
class BinaryTradingSystem {
  constructor() {
    this.balance = 10000.00;
    this.currentTradeAmount = 50;
    this.dailyProfitTarget = 500;
    this.dailyLossLimit = -300;
    this.consecutiveLosses = 0;
    this.maxConsecutiveLosses = 3;
    this.tradeHistory = [];
    this.isTradingPaused = false;
    this.todayStats = {
      profit: 0,
      trades: 0,
      wins: 0,
      losses: 0
    };
  }

  placeTrade(direction, amount, asset, expiry) {
    if (this.isTradingPaused) {
      this.showNotification("Trading paused after 3 consecutive losses");
      return false;
    }

    // Simulate trade outcome (70% win rate for demo)
    const isWin = Math.random() < 0.7;
    const payout = isWin ? amount * 1.8 : -amount;
    
    const trade = {
      id: Date.now(),
      asset,
      direction,
      amount,
      expiry,
      result: isWin ? "win" : "loss",
      payout,
      timestamp: new Date()
    };

    // Update system state
    this.balance += payout;
    this.todayStats.profit += payout;
    this.todayStats.trades++;
    isWin ? this.todayStats.wins++ : this.todayStats.losses++;
    
    if (isWin) {
      this.consecutiveLosses = 0;
    } else {
      this.consecutiveLosses++;
      if (this.consecutiveLosses >= this.maxConsecutiveLosses) {
        this.isTradingPaused = true;
      }
    }

    this.tradeHistory.unshift(trade);
    this.updateUI();
    this.saveToLocalStorage();
    return trade;
  }

  resetDailyStats() {
    this.todayStats = {
      profit: 0,
      trades: 0,
      wins: 0,
      losses: 0
    };
    this.isTradingPaused = false;
    this.consecutiveLosses = 0;
    this.updateUI();
  }

  saveToLocalStorage() {
    localStorage.setItem('tradingData', JSON.stringify({
      balance: this.balance,
      tradeHistory: this.tradeHistory,
      todayStats: this.todayStats,
      settings: {
        dailyProfitTarget: this.dailyProfitTarget,
        dailyLossLimit: this.dailyLossLimit,
        maxConsecutiveLosses: this.maxConsecutiveLosses
      }
    }));
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem('tradingData');
    if (data) {
      const parsed = JSON.parse(data);
      this.balance = parsed.balance || 10000;
      this.tradeHistory = parsed.tradeHistory || [];
      this.todayStats = parsed.todayStats || this.todayStats;
      this.dailyProfitTarget = parsed.settings?.dailyProfitTarget || 500;
      this.dailyLossLimit = parsed.settings?.dailyLossLimit || -300;
      this.maxConsecutiveLosses = parsed.settings?.maxConsecutiveLosses || 3;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  updateUI() {
    // Update balance display
    document.getElementById('currentBalance').textContent = this.balance.toFixed(2);
    document.getElementById('todayProfit').textContent = this.todayStats.profit.toFixed(2);
    
    // Update win rate
    const winRate = this.todayStats.trades > 0 
      ? (this.todayStats.wins / this.todayStats.trades * 100).toFixed(1) 
      : 0;
    document.getElementById('winRate').textContent = winRate;
    
    // Update trade count
    document.getElementById('tradeCount').textContent = this.todayStats.trades;
    
    // Update risk exposure
    const riskPercentage = (this.currentTradeAmount / this.balance * 100).toFixed(1);
    document.getElementById('riskExposure').textContent = `${riskPercentage}%`;
    
    // Update trade history table
    this.updateTradeHistoryTable();
    
    // Check trading limits
    this.checkTradingLimits();
  }

  updateTradeHistoryTable() {
    const tableBody = document.querySelector('.trades-table tbody');
    tableBody.innerHTML = '';
    
    // Show last 5 trades
    const recentTrades = this.tradeHistory.slice(0, 5);
    
    recentTrades.forEach(trade => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${trade.asset}</td>
        <td>${trade.direction}</td>
        <td>$${trade.amount.toFixed(2)}</td>
        <td>
          <span class="trade-status status-${trade.result}">
            ${trade.payout > 0 ? '+' : ''}${trade.payout.toFixed(2)}
          </span>
        </td>
        <td>${new Date(trade.timestamp).toLocaleTimeString()}</td>
      `;
      
      tableBody.appendChild(row);
    });
  }

  checkTradingLimits() {
    // Check daily profit target
    if (this.todayStats.profit >= this.dailyProfitTarget) {
      this.showNotification(`Daily profit target reached! $${this.dailyProfitTarget}`, 'success');
    }
    
    // Check daily loss limit
    if (this.todayStats.profit <= this.dailyLossLimit) {
      this.showNotification(`Daily loss limit hit! $${this.dailyLossLimit}`, 'danger');
    }
    
    // Check consecutive losses
    if (this.consecutiveLosses >= this.maxConsecutiveLosses) {
      this.showNotification(`Trading paused after ${this.maxConsecutiveLosses} consecutive losses`, 'warning');
    }
  }
}

// Initialize the trading system
const tradingSystem = new BinaryTradingSystem();

// DOM Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  tradingSystem.loadFromLocalStorage();
  tradingSystem.updateUI();
  
  // Trade execution
  document.getElementById('executeCall').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('tradeAmount').value) || tradingSystem.currentTradeAmount;
    const asset = document.getElementById('assetSelect').value;
    const expiry = document.getElementById('expirySelect').value;
    
    tradingSystem.placeTrade('CALL', amount, asset, expiry);
  });
  
  document.getElementById('executePut').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('tradeAmount').value) || tradingSystem.currentTradeAmount;
    const asset = document.getElementById('assetSelect').value;
    const expiry = document.getElementById('expirySelect').value;
    
    tradingSystem.placeTrade('PUT', amount, asset, expiry);
  });
  
  // Settings
  document.getElementById('saveSettings').addEventListener('click', () => {
    tradingSystem.dailyProfitTarget = parseFloat(document.getElementById('profitTarget').value) || 500;
    tradingSystem.dailyLossLimit = parseFloat(document.getElementById('lossLimit').value) || -300;
    tradingSystem.maxConsecutiveLosses = parseInt(document.getElementById('maxLosses').value) || 3;
    tradingSystem.currentTradeAmount = parseFloat(document.getElementById('defaultAmount').value) || 50;
    
    tradingSystem.saveToLocalStorage();
    tradingSystem.showNotification('Settings saved successfully!', 'success');
  });
  
  // Reset day
  document.getElementById('resetDay').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset daily stats?')) {
      tradingSystem.resetDailyStats();
    }
  });
});
