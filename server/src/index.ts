import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  RestaurantState,
  Order,
  OrderItem,
  OrderStatus,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  UpdateKitchenStatusPayload,
  ClientType
} from '../../shared-types/index.js';

const app = express();
const server = createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory store for the restaurant state.
// Real systems would use a database; this is intentionally simple for the demo.
let restaurantState: RestaurantState = {
  orders: buildStarterOrders(),
  kitchenStatus: {
    isOpen: true,
    currentRushLevel: 'steady',
    message: 'Kitchen is open and accepting orders.'
  },
  adminSettings: {
    autoAdvanceOrders: false,
    showCompletedOrders: true
  },
  timestamp: Date.now()
};

interface ConnectedClients {
  [key: string]: number;
}

const connectedClients: ConnectedClients = {
  mobile: 0,
  tablet: 0,
  web: 0,
  test: 0
};

declare module 'socket.io' {
  interface Socket {
    clientType?: ClientType;
  }
}

io.on('connection', (socket) => {
  // Send the current restaurant snapshot to the new client immediately.
  socket.emit('restaurant-update', restaurantState);

  socket.on('register-client', (clientType: ClientType) => {
    if (clientType in connectedClients) {
      socket.clientType = clientType;
      connectedClients[clientType]++;
    }
  });

  socket.on('order:create', (payload: CreateOrderPayload) => {
    if (!validateCreateOrderPayload(payload)) return;
    createOrder(payload);
    broadcastState();
  });

  socket.on('order:updateStatus', (payload: UpdateOrderStatusPayload) => {
    if (!payload || typeof payload.orderId !== 'string') return;
    updateOrderStatus(payload.orderId, payload.status);
    broadcastState();
  });

  socket.on('order:complete', (payload: { orderId: string }) => {
    if (!payload || typeof payload.orderId !== 'string') return;
    updateOrderStatus(payload.orderId, 'completed');
    broadcastState();
  });

  socket.on('admin:resetQueue', () => {
    resetQueue();
    broadcastState();
  });

  socket.on('admin:updateKitchenStatus', (payload: UpdateKitchenStatusPayload) => {
    if (!payload) return;
    if (typeof payload.isOpen === 'boolean') {
      restaurantState.kitchenStatus.isOpen = payload.isOpen;
    }
    if (payload.currentRushLevel) {
      restaurantState.kitchenStatus.currentRushLevel = payload.currentRushLevel;
    }
    if (typeof payload.message === 'string') {
      restaurantState.kitchenStatus.message = payload.message;
    }
    broadcastState();
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', () => {
    if (socket.clientType && socket.clientType in connectedClients) {
      connectedClients[socket.clientType] = Math.max(
        0,
        connectedClients[socket.clientType] - 1
      );
    }
  });
});

function broadcastState(): void {
  restaurantState.timestamp = Date.now();
  io.emit('restaurant-update', restaurantState);
}

function createOrder(payload: CreateOrderPayload): Order {
  const now = Date.now();
  const order: Order = {
    id: `order-${now}-${Math.floor(Math.random() * 1000)}`,
    tableNumber: payload.tableNumber,
    items: payload.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: Math.max(1, Math.floor(item.quantity || 1)),
      category: item.category
    })),
    status: 'pending',
    priority: payload.priority,
    notes: payload.notes,
    createdAt: now,
    updatedAt: now
  };
  restaurantState.orders.push(order);
  return order;
}

function updateOrderStatus(orderId: string, status: OrderStatus): void {
  const order = restaurantState.orders.find((o) => o.id === orderId);
  if (!order) return;
  order.status = status;
  order.updatedAt = Date.now();
}

function resetQueue(): void {
  restaurantState.orders = buildStarterOrders();
}

function validateCreateOrderPayload(payload: CreateOrderPayload): boolean {
  if (!payload) return false;
  if (typeof payload.tableNumber !== 'number' || payload.tableNumber <= 0) return false;
  if (!Array.isArray(payload.items) || payload.items.length === 0) return false;
  if (payload.priority !== 'normal' && payload.priority !== 'urgent') return false;
  for (const item of payload.items) {
    if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') {
      return false;
    }
  }
  return true;
}

function buildStarterOrders(): Order[] {
  const now = Date.now();
  const make = (
    id: string,
    tableNumber: number,
    items: OrderItem[],
    status: OrderStatus,
    priority: 'normal' | 'urgent',
    minutesAgo: number
  ): Order => ({
    id,
    tableNumber,
    items,
    status,
    priority,
    createdAt: now - minutesAgo * 60 * 1000,
    updatedAt: now - minutesAgo * 60 * 1000
  });

  return [
    make(
      'order-seed-1',
      4,
      [
        { id: 'm-burger', name: 'Cheeseburger', quantity: 2, category: 'mains' },
        { id: 'm-fries', name: 'Fries', quantity: 2, category: 'sides' }
      ],
      'preparing',
      'normal',
      6
    ),
    make(
      'order-seed-2',
      7,
      [
        { id: 'm-pasta', name: 'Pasta Alfredo', quantity: 1, category: 'mains' },
        { id: 'm-salad', name: 'Caesar Salad', quantity: 1, category: 'sides' }
      ],
      'pending',
      'urgent',
      2
    ),
    make(
      'order-seed-3',
      2,
      [
        { id: 'm-wings', name: 'Buffalo Wings', quantity: 1, category: 'starters' },
        { id: 'm-soda', name: 'Soda', quantity: 2, category: 'drinks' }
      ],
      'ready',
      'normal',
      9
    )
  ];
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Restaurant Kitchen Server running on port ${PORT}`);
});
