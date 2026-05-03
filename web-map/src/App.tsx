import React, { useState } from 'react';
import './App.css';
import { useRestaurantAdmin } from './hooks/useRestaurantAdmin';
import { useAdminAuth } from './hooks/useAdminAuth';
import ActiveOrdersPanel from './components/ActiveOrdersPanel';
import AdminControls from './components/AdminControls';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const {
    connected,
    orders,
    kitchenStatus,
    orderCounts,
    systemMetrics,
    updateOrderStatus,
    resetQueue,
    updateKitchenStatus
  } = useRestaurantAdmin();

  const { isAuthenticated, currentUser, login, logout, error } = useAdminAuth();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(usernameInput, passwordInput);
    setPasswordInput('');
  };

  const handleToggleOpen = () => {
    updateKitchenStatus({ isOpen: !kitchenStatus.isOpen });
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-left">
          <h1>🍽️ Restaurant Manager Dashboard</h1>
          <div className="header-info">
            <span>Real-time Kitchen Coordination System</span>
          </div>
        </div>

        <div className="header-status">
          <div className="kitchen-pill">
            <span className="pill-dot" data-state={kitchenStatus.isOpen ? 'open' : 'closed'} />
            <span>{kitchenStatus.isOpen ? 'Kitchen Open' : 'Kitchen Closed'}</span>
          </div>
          <div className="message-pill">
            "{kitchenStatus.message}"
          </div>
        </div>

        <div className="header-auth">
          {isAuthenticated ? (
            <div className="auth-logged-in">
              <span className="auth-user">Manager: {currentUser}</span>
              <button type="button" className="logout-button" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleLoginSubmit}>
              <input
                type="text"
                className="login-input"
                placeholder="Username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />
              <input
                type="password"
                className="login-input"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              <button type="submit" className="login-button">
                Login
              </button>
              {error && <span className="login-error">{error}</span>}
            </form>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="main-grid">
          <div className="orders-section">
            <ActiveOrdersPanel
              orders={orders}
              onUpdateOrderStatus={updateOrderStatus}
            />
          </div>

          <div className="control-section">
            {isAuthenticated ? (
              <AdminControls
                kitchenStatus={kitchenStatus}
                onResetQueue={resetQueue}
                onToggleOpen={handleToggleOpen}
                onSetRushLevel={(level) =>
                  updateKitchenStatus({ currentRushLevel: level })
                }
                onUpdateMessage={(msg) => updateKitchenStatus({ message: msg })}
                onUpdateKitchenStatus={updateKitchenStatus}
                activeOrderCount={orderCounts.active}
              />
            ) : (
              <div className="control-locked">
                <div className="control-locked-title">Manager Login Required</div>
                <div className="control-locked-text">
                  Access admin controls and system settings.
                </div>
                <small>Default credentials: manager / 1234</small>
              </div>
            )}
          </div>
        </div>

        <div className="admin-section">
          <AdminDashboard
            metrics={systemMetrics}
            orderCounts={orderCounts}
            kitchenStatus={kitchenStatus}
            connectionStatus={connected}
          />
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span>Restaurant Kitchen Coordination System • Live Demo</span>
          <span>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
