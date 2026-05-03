// Shared type definitions for the Restaurant Kitchen Coordination System

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';
export type OrderPriority = 'normal' | 'urgent';
export type RushLevel = 'slow' | 'steady' | 'busy';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  priority: OrderPriority;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KitchenStatus {
  isOpen: boolean;
  currentRushLevel: RushLevel;
  message: string;
}

export interface AdminSettings {
  autoAdvanceOrders: boolean;
  showCompletedOrders: boolean;
}

export interface RestaurantState {
  orders: Order[];
  kitchenStatus: KitchenStatus;
  adminSettings: AdminSettings;
  timestamp: number;
}

export interface CreateOrderPayload {
  tableNumber: number;
  items: OrderItem[];
  priority: OrderPriority;
  notes?: string;
}

export interface UpdateOrderStatusPayload {
  orderId: string;
  status: OrderStatus;
}

export interface UpdateKitchenStatusPayload {
  isOpen?: boolean;
  currentRushLevel?: RushLevel;
  message?: string;
}

export type ClientType = 'mobile' | 'tablet' | 'web' | 'test';
