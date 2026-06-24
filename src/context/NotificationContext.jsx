import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { account } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotifications, setNewNotifications] = useState([]);
  const clientRef = useRef(null);
  const userIdRef = useRef(null);

  const getUserId = useCallback(() => {
    if (!account) return null;
    return account.id || account.userId || null;
  }, [account]);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setUnreadCount(0);
      userIdRef.current = null;
      return;
    }

    if (userId === userIdRef.current && clientRef.current?.connected) return;
    userIdRef.current = userId;

    if (clientRef.current) {
      clientRef.current.deactivate();
    }

    const client = new Client({
      brokerURL: `ws://${window.location.hostname}:8080/ws`,
      connectHeaders: {},
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/notifications/${userId}`, (message) => {
        try {
          const notification = JSON.parse(message.body);
          setNewNotifications((prev) => [notification, ...prev.slice(0, 49)]);
          setUnreadCount((prev) => prev + 1);
        } catch (e) {
          console.error('Failed to parse notification:', e);
        }
      });
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [account, getUserId]);

  const resetUnreadCount = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  const clearNewNotifications = useCallback(() => {
    setNewNotifications([]);
  }, []);

  const value = useMemo(() => ({
    unreadCount,
    newNotifications,
    resetUnreadCount,
    clearNewNotifications,
  }), [unreadCount, newNotifications, resetUnreadCount, clearNewNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
