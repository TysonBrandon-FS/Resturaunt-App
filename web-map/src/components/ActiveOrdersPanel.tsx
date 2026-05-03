import React from 'react';
import './ActiveOrdersPanel.css';
import { ActiveOrdersPanelProps, OrderStatus } from '../types/web';

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'completed',
  completed: null
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed'
};

const ACTION_LABEL: Record<OrderStatus, string | null> = {
  pending: 'Start',
  preparing: 'Mark Ready',
  ready: 'Complete',
  completed: null
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function relativeMins(ts: number): string {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return 'just now';
  if (min === 1) return '1 min ago';
  return `${min} min ago`;
}

export default function ActiveOrdersPanel({
  orders,
  onUpdateOrderStatus
}: ActiveOrdersPanelProps) {
  const active = orders.filter((o) => o.status !== 'completed');
  const recentlyCompleted = orders
    .filter((o) => o.status === 'completed')
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  return (
    <div className="orders-panel">
      <div className="orders-header">
        <h3>Active Orders</h3>
        <span className="orders-count">{active.length} active</span>
      </div>

      <div className="orders-grid">
        {active.length === 0 ? (
          <div className="orders-empty">No active orders right now.</div>
        ) : (
          active.map((order) => {
            const next = STATUS_FLOW[order.status];
            const action = ACTION_LABEL[order.status];
            return (
              <div
                key={order.id}
                className={`order-card status-${order.status} priority-${order.priority}`}
              >
                <div className="order-card-top">
                  <div className="order-table">
                    <span className="order-table-label">Table</span>
                    <span className="order-table-num">{order.tableNumber}</span>
                  </div>
                  <div className="order-badges">
                    <span className={`status-badge status-${order.status}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                    {order.priority === 'urgent' && (
                      <span className="priority-badge urgent">URGENT</span>
                    )}
                  </div>
                </div>

                <ul className="order-items">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">x{item.quantity}</span>
                    </li>
                  ))}
                </ul>

                {order.notes && (
                  <div className="order-notes">📝 {order.notes}</div>
                )}

                <div className="order-card-bottom">
                  <span className="order-time">
                    {formatTime(order.createdAt)} • {relativeMins(order.createdAt)}
                  </span>
                  {next && action && (
                    <button
                      type="button"
                      className="advance-button"
                      onClick={() => onUpdateOrderStatus(order.id, next)}
                    >
                      {action} ▸
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {recentlyCompleted.length > 0 && (
        <div className="completed-section">
          <h4>Recently Completed</h4>
          <ul className="completed-list">
            {recentlyCompleted.map((order) => (
              <li key={order.id}>
                <span>Table {order.tableNumber}</span>
                <span className="completed-meta">
                  {order.items.length} item{order.items.length === 1 ? '' : 's'} •{' '}
                  {formatTime(order.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
