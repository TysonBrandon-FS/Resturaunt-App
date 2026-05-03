import {
  RestaurantState,
  Order,
  OrderStatus,
  OrderPriority,
  RushLevel,
  KitchenStatus,
  UpdateKitchenStatusPayload
} from '../../../shared-types';

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

export interface OrderCounts {
  pending: number;
  preparing: number;
  ready: number;
  completed: number;
  urgent: number;
  total: number;
  active: number;
}

export interface AdminControlsProps {
  kitchenStatus: KitchenStatus;
  onResetQueue: () => void;
  onToggleOpen: () => void;
  onSetRushLevel: (level: RushLevel) => void;
  onUpdateMessage: (message: string) => void;
  onUpdateKitchenStatus: (payload: UpdateKitchenStatusPayload) => void;
  activeOrderCount: number;
}

export interface ActiveOrdersPanelProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export interface AdminDashboardProps {
  metrics: SystemMetrics;
  orderCounts: OrderCounts;
  kitchenStatus: KitchenStatus;
  connectionStatus: boolean;
}

export type { Order, OrderStatus, OrderPriority, RushLevel, KitchenStatus, RestaurantState };
