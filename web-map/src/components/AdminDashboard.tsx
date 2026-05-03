import React from 'react';
import './AdminDashboard.css';
import { AdminDashboardProps } from '../types/web';

export default function AdminDashboard({
  orderCounts,
  connectionStatus
}: AdminDashboardProps) {
  return (
    <div className="admin-dashboard">
      <h3>System Overview</h3>

      <div className="status-grid">
        <div className="status-card">
          <span className="status-icon">🔗</span>
          <div className="status-body">
            <div className="status-title">Server Status</div>
            <div
              className={`status-value ${connectionStatus ? 'connected' : 'disconnected'}`}
            >
              {connectionStatus ? 'ONLINE' : 'OFFLINE'}
            </div>
            <div className="status-subtitle">Realtime feed active</div>
          </div>
        </div>
      </div>

      <div className="orders-stats-section">
        <h4>Order Counts</h4>
        <div className="order-stats-grid">
          <div className="order-stat-card pending">
            <div className="order-stat-value">{orderCounts.pending}</div>
            <div className="order-stat-label">Pending</div>
          </div>
          <div className="order-stat-card preparing">
            <div className="order-stat-value">{orderCounts.preparing}</div>
            <div className="order-stat-label">Preparing</div>
          </div>
          <div className="order-stat-card ready">
            <div className="order-stat-value">{orderCounts.ready}</div>
            <div className="order-stat-label">Ready</div>
          </div>
          <div className="order-stat-card completed">
            <div className="order-stat-value">{orderCounts.completed}</div>
            <div className="order-stat-label">Completed</div>
          </div>
          <div className="order-stat-card urgent">
            <div className="order-stat-value">{orderCounts.urgent}</div>
            <div className="order-stat-label">Urgent</div>
          </div>
        </div>
      </div>
    </div>
  );
}
