import { useState, useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { VehicleState, EnvironmentUpdate } from '../../../shared-types';
import { VehiclePosition, SystemMetrics, TrafficAlert, SpeedZone } from '../types/web';

// Replace with your actual server IP
const SERVER_URL = 'http://192.168.1.36:3001';

export function useTrafficControl() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [vehicles, setVehicles] = useState<Record<string, VehiclePosition>>({});
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>(() => ({
    connectedDevices: { mobile: 0, tablet: 0, web: 0, test: 0 },
    serverUptime: 0,
    networkLatency: 0,
    messagesPerSecond: 0,
    lastUpdate: Date.now()
  }));
  const [speedZones, setSpeedZones] = useState<SpeedZone[]>([
    {
      id: 'zone-1',
      center: [-84.3880, 33.7490],
      radius: 500,
      speedLimit: 55,
      active: true
    }
  ]);
  const [alerts, setAlerts] = useState<TrafficAlert[]>([]);
  const latencyStartRef = useRef<number>(0);
  const messageCountRef = useRef<number>(0);
  const lastSecondRef = useRef<number>(0);

  useEffect(() => {
    console.log('Initializing traffic control connection...');
    lastSecondRef.current = Date.now();

    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Traffic control connected to server');
      setConnected(true);
      newSocket.emit('register-client', 'web');
    });

    newSocket.on('disconnect', () => {
      console.log('Traffic control disconnected from server');
      setConnected(false);
    });

    newSocket.on('vehicle-update', (data: VehicleState) => {
      const vehicleId = 'vehicle-1';

      const baseLatitude = 33.7490;
      const baseLongitude = -84.3880;

      const mapWidth = 0.01;
      const mapHeight = 0.01;
      const normalizedX = (data.motion.x - 400) / 800;
      const normalizedY = (data.motion.y - 300) / 600;
      const longitude = baseLongitude + (normalizedX * mapWidth);
      const latitude = baseLatitude + (normalizedY * mapHeight);

      const newPosition: VehiclePosition = {
        id: vehicleId,
        coordinates: [longitude, latitude],
        bearing: data.motion.direction,
        speed: data.motion.speed,
        lastUpdate: Date.now()
      };

      setVehicles(prev => ({
        ...prev,
        [vehicleId]: newPosition
      }));

      messageCountRef.current++;
      const now = Date.now();
      if (now - lastSecondRef.current >= 1000) {
        setSystemMetrics(prev => ({
          ...prev,
          messagesPerSecond: messageCountRef.current,
          lastUpdate: now
        }));
        messageCountRef.current = 0;
        lastSecondRef.current = now;
      }
    });

    newSocket.on('connect_error', (error) => {
      console.log('Traffic control connection error:', error);
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
      setSystemMetrics(prev => ({
        ...prev,
        networkLatency: latency
      }));
    });

    setSocket(newSocket);

    return () => {
      clearInterval(latencyInterval);
      newSocket.close();
    };
  }, []);

  const updateEnvironment = useCallback((update: EnvironmentUpdate) => {
    if (socket && connected) {
      socket.emit('environment-update', update);
    }
  }, [socket, connected]);

  const createAlert = useCallback((alert: Omit<TrafficAlert, 'id' | 'timestamp'>) => {
    const newAlert: TrafficAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      timestamp: Date.now()
    };

    setAlerts(prev => [...prev, newAlert]);

    updateEnvironment({
      alerts: [...alerts, newAlert].map(a => a.message)
    });
  }, [alerts, updateEnvironment]);

  const updateSpeedLimit = useCallback((limit: number) => {
    updateEnvironment({ speedLimit: limit });
  }, [updateEnvironment]);

  return {
    socket,
    connected,
    vehicles: Object.values(vehicles),
    systemMetrics,
    speedZones,
    alerts,
    updateEnvironment,
    createAlert,
    updateSpeedLimit
  };
}