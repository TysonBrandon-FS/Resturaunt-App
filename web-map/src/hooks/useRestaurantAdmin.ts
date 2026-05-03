import { useState, useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import {
  RestaurantState,
  OrderStatus,
  UpdateKitchenStatusPayload
} from '../../../shared-types';
import { SystemMetrics, OrderCounts } from '../types/web';

const SERVER_URL = 'http://192.168.1.36:3001';

const INITIAL_STATE: RestaurantState = {
  orders: [],
  kitchenStatus: {
    isOpen: true,
    currentRushLevel: 'steady',
    message: 'Connecting to server...'
  },
  adminSettings: {
    autoAdvanceOrders: false,
    showCompletedOrders: true
  },
  timestamp: Date.now()
};

export function useRestaurantAdmin() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [restaurantState, setRestaurantState] = useState<RestaurantState>(INITIAL_STATE);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>(() => ({
    connectedDevices: { mobile: 0, tablet: 0, web: 0, test: 0 },
    serverUptime: 0,
    networkLatency: 0,
    messagesPerSecond: 0,
    lastUpdate: Date.now()
  }));

  const latencyStartRef = useRef<number>(0);
  const messageCountRef = useRef<number>(0);
  const lastSecondRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    lastSecondRef.current = Date.now();
    startTimeRef.current = Date.now();

    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('register-client', 'web');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('restaurant-update', (data: RestaurantState) => {
      setRestaurantState(data);

      messageCountRef.current++;
      const now = Date.now();
      if (now - lastSecondRef.current >= 1000) {
        setSystemMetrics((prev) => ({
          ...prev,
          messagesPerSecond: messageCountRef.current,
          serverUptime: Math.floor((now - startTimeRef.current) / 1000),
          lastUpdate: now
        }));
        messageCountRef.current = 0;
        lastSecondRef.current = now;
      }
    });

    newSocket.on('connect_error', () => {
      setConnected(false);
    });

    const latencyInterval = setInterval(() => {
      if (newSocket.connected) {
        latencyStartRef.current = Date.now();
        newSocket.emit('ping');
      }
    }, 5000);

    newSocket.on('pong', () => {
      const latency = Date.now() - latencyStartRef.current;
      setSystemMetrics((prev) => ({
        ...prev,
        networkLatency: latency
      }));
    });

    const uptimeInterval = setInterval(() => {
      setSystemMetrics((prev) => ({
        ...prev,
        serverUptime: Math.floor((Date.now() - startTimeRef.current) / 1000)
      }));
    }, 1000);

    setSocket(newSocket);

    return () => {
      clearInterval(latencyInterval);
      clearInterval(uptimeInterval);
      newSocket.close();
    };
  }, []);

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      if (socket && connected) {
        socket.emit('order:updateStatus', { orderId, status });
      }
    },
    [socket, connected]
  );

  const resetQueue = useCallback(() => {
    if (socket && connected) {
      socket.emit('admin:resetQueue');
    }
  }, [socket, connected]);

  const updateKitchenStatus = useCallback(
    (payload: UpdateKitchenStatusPayload) => {
      if (socket && connected) {
        socket.emit('admin:updateKitchenStatus', payload);
      }
    },
    [socket, connected]
  );

  const orderCounts: OrderCounts = restaurantState.orders.reduce(
    (acc, o) => {
      acc[o.status]++;
      if (o.priority === 'urgent') acc.urgent++;
      if (o.status !== 'completed') acc.active++;
      acc.total++;
      return acc;
    },
    {
      pending: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      urgent: 0,
      active: 0,
      total: 0
    } as OrderCounts
  );

  return {
    socket,
    connected,
    restaurantState,
    orders: restaurantState.orders,
    kitchenStatus: restaurantState.kitchenStatus,
    orderCounts,
    systemMetrics,
    updateOrderStatus,
    resetQueue,
    updateKitchenStatus
  };
}
