import React from 'react';
import './AdminDashboard.css';
import { SystemMetrics } from '../types/web';

interface AdminDashboardProps {
  metrics: SystemMetrics;
  connectionStatus: boolean;
}

export default function AdminDashboard({ metrics, connectionStatus }: AdminDashboardProps) {
  const formatUptime = (uptime: number): string => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalConnections = (): number => {
    return Object.values(metrics.connectedDevices).reduce((sum, count) => sum + count, 0);
  };

  const getLatencyStatus = (): { color: string; status: string } => {
    if (metrics.networkLatency < 50) return { color: '#00FF88', status: 'Excellent' };
    if (metrics.networkLatency < 100) return { color: '#FFD400', status: 'Good' };
    if (metrics.networkLatency < 200) return { color: '#FFA500', status: 'Fair' };
    return { color: '#FF4444', status: 'Poor' };
  };

  const latencyStatus = getLatencyStatus();

  return (
    <div className="admin-dashboard">
      <h3>System Administration</h3>

      <div className="status-grid">
        <div className="status-card">
          <div className="status-header">
            <span className="status-icon">🔗</span>
            <span className="status-title">Connection</span>
          </div>
          <div className={`status-value ${connectionStatus ? 'connected' : 'disconnected'}`}>
            {connectionStatus ? 'ONLINE' : 'OFFLINE'}
          </div>
          <div className="status-subtitle">Server Status</div>
        </div>

        <div className="status-card">
          <div className="status-header">
            <span className="status-icon">⏱️</span>
            <span className="status-title">Uptime</span>
          </div>
          <div className="status-value">
            {formatUptime(metrics.serverUptime)}
          </div>
          <div className="status-subtitle">Hours:Minutes:Seconds</div>
        </div>

        <div className="status-card">
          <div className="status-header">
            <span className="status-icon">📡</span>
            <span className="status-title">Latency</span>
          </div>
          <div className="status-value" style={{ color: latencyStatus.color }}>
            {metrics.networkLatency}ms
          </div>
          <div className="status-subtitle">{latencyStatus.status}</div>
        </div>

        <div className="status-card">
          <div className="status-header">
            <span className="status-icon">📊</span>
            <span className="status-title">Throughput</span>
          </div>
          <div className="status-value">
            {metrics.messagesPerSecond}
          </div>
          <div className="status-subtitle">Messages/Second</div>
        </div>
      </div>

      <div className="devices-section">
        <h4>Connected Devices ({getTotalConnections()})</h4>
        <div className="devices-grid">
          <div className="device-card mobile">
            <div className="device-icon">📱</div>
            <div className="device-info">
              <div className="device-type">Mobile Controls</div>
              <div className="device-count">{metrics.connectedDevices.mobile}</div>
            </div>
            <div className="device-status">
              <div className={`status-dot ${metrics.connectedDevices.mobile > 0 ? 'active' : 'inactive'}`}></div>
            </div>
          </div>

          <div className="device-card tablet">
            <div className="device-icon">📺</div>
            <div className="device-info">
              <div className="device-type">Tablet Clusters</div>
              <div className="device-count">{metrics.connectedDevices.tablet}</div>
            </div>
            <div className="device-status">
              <div className={`status-dot ${metrics.connectedDevices.tablet > 0 ? 'active' : 'inactive'}`}></div>
            </div>
          </div>

          <div className="device-card web">
            <div className="device-icon">🖥️</div>
            <div className="device-info">
              <div className="device-type">Web Interfaces</div>
              <div className="device-count">{metrics.connectedDevices.web}</div>
            </div>
            <div className="device-status">
              <div className={`status-dot ${metrics.connectedDevices.web > 0 ? 'active' : 'inactive'}`}></div>
            </div>
          </div>

          <div className="device-card test">
            <div className="device-icon">🔧</div>
            <div className="device-info">
              <div className="device-type">Test Clients</div>
              <div className="device-count">{metrics.connectedDevices.test}</div>
            </div>
            <div className="device-status">
              <div className={`status-dot ${metrics.connectedDevices.test > 0 ? 'active' : 'inactive'}`}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h4>Performance Metrics</h4>
        <div className="metrics-charts">
          <div className="metric-item">
            <div className="metric-label">Network Health</div>
            <div className="metric-bar">
              <div
                className="metric-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, 100 - (metrics.networkLatency / 2)))}%`,
                  backgroundColor: latencyStatus.color
                }}
              ></div>
            </div>
            <div className="metric-value">{100 - Math.min(100, Math.floor(metrics.networkLatency / 2))}%</div>
          </div>

          <div className="metric-item">
            <div className="metric-label">Message Rate</div>
            <div className="metric-bar">
              <div
                className="metric-fill"
                style={{
                  width: `${Math.min(100, (metrics.messagesPerSecond / 50) * 100)}%`,
                  backgroundColor: metrics.messagesPerSecond > 30 ? '#FF4444' :
                                   metrics.messagesPerSecond > 15 ? '#FFD400' : '#00FF88'
                }}
              ></div>
            </div>
            <div className="metric-value">{metrics.messagesPerSecond}/50 max</div>
          </div>

          <div className="metric-item">
            <div className="metric-label">System Load</div>
            <div className="metric-bar">
              <div
                className="metric-fill"
                style={{
                  width: `${Math.min(100, getTotalConnections() * 10)}%`,
                  backgroundColor: getTotalConnections() > 8 ? '#FF4444' :
                                   getTotalConnections() > 4 ? '#FFD400' : '#00FF88'
                }}
              ></div>
            </div>
            <div className="metric-value">{getTotalConnections()}/10 clients</div>
          </div>
        </div>
      </div>

      <div className="system-info">
        <div className="info-row">
          <span className="info-label">Last Update:</span>
          <span className="info-value">{new Date(metrics.lastUpdate).toLocaleTimeString()}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Server Version:</span>
          <span className="info-value">Automotive Suite v1.0.0</span>
        </div>
        <div className="info-row">
          <span className="info-label">Protocol:</span>
          <span className="info-value">WebSocket + Socket.IO</span>
        </div>
      </div>
    </div>
  );
}