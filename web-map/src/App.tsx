import React, { useState } from 'react';
import './App.css';
import { useTrafficControl } from './hooks/useTrafficControl';
import { useAdminAuth } from './hooks/useAdminAuth';
import VehicleMap from './components/VehicleMap';
import ControlPanel from './components/ControlPanel';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const {
    connected,
    vehicles,
    systemMetrics,
    speedZones,
    alerts,
    updateEnvironment,
    createAlert,
    updateSpeedLimit
  } = useTrafficControl();

  const { isAuthenticated, currentUser, login, logout, error } = useAdminAuth();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const handleMapClick = (lng: number, lat: number) => {
    console.log(`Map clicked at: (${lng.toFixed(4)}, ${lat.toFixed(4)})`);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(usernameInput, passwordInput);
    setPasswordInput('');
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-left">
          <h1>🚦 Automotive Traffic Control Center</h1>
          <div className="header-info">
            <span>Real-time Vehicle Monitoring & Management System</span>
          </div>
        </div>

        <div className="header-auth">
          {isAuthenticated ? (
            <div className="auth-logged-in">
              <span className="auth-user">Admin: {currentUser}</span>
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
          <div className="map-section">
            <VehicleMap
              vehicles={vehicles}
              speedZones={speedZones}
              alerts={alerts}
              onMapClick={handleMapClick}
            />
          </div>

          <div className="control-section">
            {isAuthenticated ? (
              <ControlPanel
                onSpeedLimitChange={updateSpeedLimit}
                onAlertCreate={createAlert}
                onEnvironmentUpdate={updateEnvironment}
                currentSpeedLimit={55}
                activeAlerts={alerts}
              />
            ) : (
              <div className="control-locked">
                🔒 Admin login required to use traffic controls.
              </div>
            )}
          </div>
        </div>

        <div className="admin-section">
          <AdminDashboard
            metrics={systemMetrics}
            connectionStatus={connected}
          />
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span>Automotive Interface Suite • Lesson 4: Web Traffic Control Center</span>
          <span>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
