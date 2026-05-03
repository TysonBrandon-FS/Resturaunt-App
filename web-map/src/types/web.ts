import { VehicleState, EnvironmentUpdate } from '../../../shared-types';

export interface VehiclePosition {
  id: string;
  coordinates: [number, number];
  bearing: number;
  speed: number;
  lastUpdate: number;
}

export interface MapConfig {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  style: string;
}

export interface SpeedZone {
  id: string;
  center: [number, number];
  radius: number;
  speedLimit: number;
  active: boolean;
}

export interface TrafficAlert {
  id: string;
  type: 'construction' | 'accident' | 'weather' | 'emergency';
  coordinates: [number, number];
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  active: boolean;
}

export interface SystemMetrics {
  connectedDevices: {
    mobile: number;
    tablet: number;
    web: number;
    test: number;
  };
  serverUptime: number;
  networkLatency: number;
  messagesPerSecond: number;
  lastUpdate: number;
}

export interface ControlPanelProps {
  onSpeedLimitChange: (limit: number) => void;
  onAlertCreate: (alert: Omit<TrafficAlert, 'id' | 'timestamp'>) => void;
  onEnvironmentUpdate: (update: EnvironmentUpdate) => void;
  currentSpeedLimit: number;
  activeAlerts: TrafficAlert[];
}

export interface MapComponentProps {
  vehicles: VehiclePosition[];
  speedZones: SpeedZone[];
  alerts: TrafficAlert[];
  config: MapConfig;
  onMapClick: (x: number, y: number) => void;
}

export interface AdminDashboardProps {
  metrics: SystemMetrics;
  vehicleStates: Record<string, VehicleState>;
  connectionStatus: boolean;
}