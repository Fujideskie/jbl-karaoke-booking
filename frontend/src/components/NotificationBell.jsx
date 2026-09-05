import React, { useState, useEffect } from 'react';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
    <span>📬 Notifications</span>
    {unreadCount > 0 && (
      <button className="mark-all-read" onClick={markAllAsRead}>
        Mark all read
      </button>
    )}
  </div>
  
  <div className="notification-list">
    {notifications.length === 0 ? (
      <div className="notification-empty">No new notifications</div>
    ) : (
      notifications.slice(0, 10).map((notif) => (
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