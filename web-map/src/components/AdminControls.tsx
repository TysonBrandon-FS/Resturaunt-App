import React, { useState, useEffect } from 'react';
import './AdminControls.css';
import { AdminControlsProps } from '../types/web';
import { RushLevel } from '../../../shared-types';

const RUSH_LEVELS: { value: RushLevel; label: string; emoji: string }[] = [
  { value: 'slow', label: 'Slow', emoji: '🟢' },
  { value: 'steady', label: 'Steady', emoji: '🟡' },
  { value: 'busy', label: 'Busy', emoji: '🔴' }
];

export default function AdminControls({
  kitchenStatus,
  onResetQueue,
  onToggleOpen,
  onSetRushLevel,
  onUpdateKitchenStatus,
  activeOrderCount
}: AdminControlsProps) {
  const [messageDraft, setMessageDraft] = useState(kitchenStatus.message);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    setMessageDraft(kitchenStatus.message);
  }, [kitchenStatus.message]);

  const handleResetClick = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 4000);
      return;
    }
    onResetQueue();
    setResetConfirm(false);
  };

  const handlePushMessage = () => {
    onUpdateKitchenStatus({ message: messageDraft });
  };

  return (
    <div className="admin-controls">
      <h3>Manager Controls</h3>

      <div className="control-section">
        <h4>Kitchen Status</h4>
        <div className="kitchen-toggle-row">
          <button
            type="button"
            className={`kitchen-toggle ${kitchenStatus.isOpen ? 'open' : 'closed'}`}
            onClick={onToggleOpen}
          >
            {kitchenStatus.isOpen ? 'Kitchen Open' : 'Kitchen Closed'}
          </button>
          <span className="kitchen-toggle-hint">
            Click to {kitchenStatus.isOpen ? 'close' : 'open'} the kitchen
          </span>
        </div>
      </div>

      <div className="control-section">
        <h4>Rush Level</h4>
        <div className="rush-buttons">
          {RUSH_LEVELS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`rush-button rush-${opt.value} ${
                kitchenStatus.currentRushLevel === opt.value ? 'active' : ''
              }`}
              onClick={() => onSetRushLevel(opt.value)}
            >
              <span className="rush-emoji">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h4>Kitchen Message</h4>
        <div className="message-form">
          <textarea
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
            placeholder="Message shown to staff and dashboards..."
            rows={2}
            className="message-input"
          />
          <button
            type="button"
            className="message-button"
            onClick={handlePushMessage}
          >
            Push Message
          </button>
        </div>
      </div>

      <div className="control-section">
        <h4>Queue Management</h4>
        <div className="queue-row">
          <div className="queue-stat">
            <span className="queue-label">Active Orders</span>
            <span className="queue-value">{activeOrderCount}</span>
          </div>
          <button
            type="button"
            className={`reset-button ${resetConfirm ? 'confirm' : ''}`}
            onClick={handleResetClick}
          >
            {resetConfirm ? 'Click again to confirm' : '↻ Reset Queue'}
          </button>
        </div>
        <p className="queue-hint">
          Reset replaces all current orders with the demo starter set.
        </p>
      </div>
    </div>
  );
}
