import React, { useState, useEffect } from 'react';
import { subscribeToPush, isSubscribed, unsubscribeFromPush, isPushSupported } from '../pushNotification';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    checkPushStatus();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkPushStatus = async () => {
    const supported = isPushSupported();
    setPushSupported(supported);
    
    if (supported) {
      const subscribed = await isSubscribed();
      setPushEnabled(subscribed);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handlePushToggle = async () => {
    if (pushEnabled) {
      const result = await unsubscribeFromPush();
      if (result.success) {
        setPushEnabled(false);
        alert('🔕 Push notifications disabled');
      }
    } else {
      const result = await subscribeToPush();
      if (result.success) {
        setPushEnabled(true);
        alert('🔔 Push notifications enabled! Makakatanggap ka na ng notification kahit sarado ang app.');
      } else {
        alert(`❌ ${result.error}`);
      }
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'daily_schedule':
        return '📅';
      case 'session_end':
        return '✅';
      default:
        return '🔔';
    }
  };

  return (
    <div className="notification-wrapper">
      <button className="notification-bell" onClick={toggleDropdown}>
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          {/* Push Notification Toggle */}
          {pushSupported && (
            <div className="push-toggle">
              <div className="push-toggle-info">
                <span className="push-toggle-label">
                  {pushEnabled ? '🔔 Push Notifications ON' : '🔕 Push Notifications OFF'}
                </span>
                <span className="push-toggle-desc">
                  {pushEnabled 
                    ? 'Makakatanggap ka ng notif kahit sarado ang app' 
                    : 'I-enable para makatanggap ng notif'}
                </span>
              </div>
              <button 
                className={`push-toggle-btn ${pushEnabled ? 'active' : ''}`}
                onClick={handlePushToggle}
              >
                {pushEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">{formatTime(notif.created_at)}</div>
                  </div>
                  {!notif.is_read && <div className="notification-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;