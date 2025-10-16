import React, { useState, useEffect } from 'react';
import { Bell, X, UserCheck, Clock } from 'lucide-react';
import useCurrentUser from '../../hooks/student/useCurrentUser';
import io from 'socket.io-client';

const VisitorNotification = () => {
  const { user } = useCurrentUser();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      // Initialize Socket.IO connection
      const socketConnection = io('http://localhost:4000');
      setSocket(socketConnection);

      // Listen for new OTP notifications
      socketConnection.on(`student-${user.id}`, (data) => {
        if (data.type === 'new_otp') {
          const notification = {
            id: data.otp._id,
            type: 'new_visitor',
            title: 'New Visitor Request',
            message: `${data.otp.visitorName} wants to visit you`,
            otp: data.otp,
            timestamp: new Date(),
            read: false
          };
          
          setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications
          
          // Auto-remove after 30 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
          }, 30000);
        }
      });

      return () => {
        socketConnection.disconnect();
      };
    }
  }, [user]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  if (notifications.length === 0) return null;

  return (
    <div className="visitor-notifications position-fixed" style={{ top: '80px', right: '20px', zIndex: 1050 }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`alert alert-info alert-dismissible fade show mb-2 shadow-sm ${
            !notification.read ? 'border-primary' : ''
          }`}
          style={{ maxWidth: '350px' }}
        >
          <div className="d-flex align-items-start">
            <UserCheck size={20} className="text-primary me-2 mt-1" />
            <div className="flex-grow-1">
              <h6 className="alert-heading mb-1">{notification.title}</h6>
              <p className="mb-1">{notification.message}</p>
              {notification.otp && (
                <div className="bg-white p-2 rounded border mt-2">
                  <small className="text-muted d-block">OTP to share:</small>
                  <strong className="font-monospace text-primary h6">
                    {notification.otp.otp}
                  </strong>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <small className="text-muted">
                      <Clock size={12} className="me-1" />
                      Expires in 10 min
                    </small>
                    <small className="text-muted">
                      Purpose: {notification.otp.purpose}
                    </small>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => dismissNotification(notification.id)}
            ></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VisitorNotification;
