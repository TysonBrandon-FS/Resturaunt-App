import React, { useState } from 'react';
import './ControlPanel.css';
import { TrafficAlert} from '../types/web';
import {EnvironmentUpdate } from '../../../shared-types';

interface ControlPanelProps {
  onSpeedLimitChange: (limit: number) => void;
  onAlertCreate: (alert: Omit<TrafficAlert, 'id' | 'timestamp'>) => void;
  onEnvironmentUpdate: (update: EnvironmentUpdate) => void;
  currentSpeedLimit: number;
  activeAlerts: TrafficAlert[];
}

const SPEED_LIMITS = [25, 35, 45, 55, 65, 75, 85];
const ALERT_TYPES = [
  { value: 'construction', label: 'Construction Work', icon: '🚧' },
  { value: 'accident', label: 'Traffic Accident', icon: '💥' },
  { value: 'weather', label: 'Weather Hazard', icon: '🌧️' },
  { value: 'emergency', label: 'Emergency Response', icon: '🚨' }
] as const;

export default function ControlPanel({
  onSpeedLimitChange,
  onAlertCreate,
  onEnvironmentUpdate,
  currentSpeedLimit,
  activeAlerts
}: ControlPanelProps) {
  const [newAlert, setNewAlert] = useState({
    type: 'construction' as TrafficAlert['type'],
    coordinates: [-84.3880, 33.7490] as [number, number],
    message: '',
    severity: 'medium' as TrafficAlert['severity'],
    active: true
  });
  const [weatherCondition, setWeatherCondition] = useState<string>('clear');
  const [emergencyMode, setEmergencyMode] = useState(false);

  const handleSpeedLimitChange = (limit: number) => {
    onSpeedLimitChange(limit);
    onEnvironmentUpdate({ speedLimit: limit });
  };

  const handleCreateAlert = () => {
    if (!newAlert.message.trim()) {
      alert('Please enter an alert message');
      return;
    }

    onAlertCreate(newAlert);

    setNewAlert({
      ...newAlert,
      message: '',
      coordinates: [
        -84.3880 + (Math.random() - 0.5) * 0.02,
        33.7490 + (Math.random() - 0.5) * 0.02
      ] as [number, number]
    });
  };

  const handleWeatherChange = (condition: string) => {
    setWeatherCondition(condition);

    let weatherSpeedLimit = currentSpeedLimit;
    if (condition === 'rain' || condition === 'snow') {
      weatherSpeedLimit = Math.max(25, currentSpeedLimit - 15);
    } else if (condition === 'fog') {
      weatherSpeedLimit = Math.max(25, currentSpeedLimit - 25);
    }

    onEnvironmentUpdate({
      speedLimit: weatherSpeedLimit,
      alerts: [`Weather condition: ${condition}. Reduced speed limit in effect.`]
    });
  };

  const handleEmergencyMode = () => {
    const newEmergencyMode = !emergencyMode;
    setEmergencyMode(newEmergencyMode);

    if (newEmergencyMode) {
      onAlertCreate({
        type: 'emergency',
        coordinates: [-84.3880, 33.7490],
        message: 'EMERGENCY: All vehicles reduce speed and yield to emergency vehicles',
        severity: 'high',
        active: true
      });

      onEnvironmentUpdate({
        speedLimit: 35,
        alerts: ['EMERGENCY MODE ACTIVE - REDUCED SPEED LIMITS IN EFFECT']
      });
    } else {
      onEnvironmentUpdate({
        speedLimit: 55,
        alerts: ['Emergency mode deactivated - Normal traffic conditions resumed']
      });
    }
  };

  return (
    <div className="control-panel">
      <h3>Traffic Control Center</h3>

      <div className="control-section">
        <h4>Speed Limit Management</h4>
        <div className="speed-limit-controls">
          <div className="current-speed">
            <span>Current: </span>
            <span className="speed-value">{currentSpeedLimit} MPH</span>
          </div>
          <div className="speed-buttons">
            {SPEED_LIMITS.map(limit => (
              <button
                key={limit}
                className={`speed-button ${currentSpeedLimit === limit ? 'active' : ''}`}
                onClick={() => handleSpeedLimitChange(limit)}
              >
                {limit}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="control-section">
        <h4>Traffic Alert System</h4>
        <div className="alert-form">
          <div className="form-row">
            <label>Alert Type:</label>
            <select
              value={newAlert.type}
              onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as TrafficAlert['type'] })}
              className="alert-select"
            >
              {ALERT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Severity:</label>
            <div className="severity-buttons">
              {(['low', 'medium', 'high'] as const).map(severity => (
                <button
                  key={severity}
                  className={`severity-button ${severity} ${newAlert.severity === severity ? 'active' : ''}`}
                  onClick={() => setNewAlert({ ...newAlert, severity })}
                >
                  {severity.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label>Message:</label>
            <textarea
              value={newAlert.message}
              onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
              placeholder="Enter alert message for drivers..."
              className="alert-message"
              rows={2}
            />
          </div>

          <div className="form-row">
            <label>Position (Lat/Lng):</label>
            <div className="position-controls">
              <input
                type="range"
                min="-84.42"
                max="-84.35"
                step="0.001"
                value={newAlert.coordinates[0]}
                onChange={(e) => setNewAlert({
                  ...newAlert,
                  coordinates: [parseFloat(e.target.value), newAlert.coordinates[1]]
                })}
                className="position-slider"
              />
              <span className="position-label">Lng: {newAlert.coordinates[0].toFixed(4)}</span>

              <input
                type="range"
                min="33.72"
                max="33.78"
                step="0.001"
                value={newAlert.coordinates[1]}
                onChange={(e) => setNewAlert({
                  ...newAlert,
                  coordinates: [newAlert.coordinates[0], parseFloat(e.target.value)]
                })}
                className="position-slider"
              />
              <span className="position-label">Lat: {newAlert.coordinates[1].toFixed(4)}</span>
            </div>
          </div>

          <button className="create-alert-button" onClick={handleCreateAlert}>
            🚨 Create Alert
          </button>
        </div>
      </div>

      <div className="control-section">
        <h4>Environmental Conditions</h4>
        <div className="weather-controls">
          <div className="form-row">
            <label>Weather:</label>
            <select
              value={weatherCondition}
              onChange={(e) => handleWeatherChange(e.target.value)}
              className="weather-select"
            >
              <option value="clear">☀️ Clear</option>
              <option value="rain">🌧️ Rain</option>
              <option value="snow">❄️ Snow</option>
              <option value="fog">🌫️ Fog</option>
            </select>
          </div>
        </div>

        <div className="emergency-controls">
          <button
            className={`emergency-button ${emergencyMode ? 'active' : ''}`}
            onClick={handleEmergencyMode}
          >
            🚨 {emergencyMode ? 'DEACTIVATE' : 'ACTIVATE'} EMERGENCY MODE
          </button>
        </div>
      </div>

      <div className="control-section">
        <h4>Active Alerts ({activeAlerts.filter(a => a.active).length})</h4>
        <div className="active-alerts">
          {activeAlerts.filter(a => a.active).map(alert => (
            <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
              <span className="alert-icon">
                {alert.type === 'construction' ? '🚧' :
                 alert.type === 'accident' ? '💥' :
                 alert.type === 'weather' ? '🌧️' :
                 alert.type === 'emergency' ? '🚨' : '⚠️'}
              </span>
              <span className="alert-text">{alert.message}</span>
              <span className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {activeAlerts.filter(a => a.active).length === 0 && (
            <div className="no-alerts">No active alerts</div>
          )}
        </div>
      </div>
    </div>
  );
}