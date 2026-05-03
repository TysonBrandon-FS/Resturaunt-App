import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { VehicleState, ControlInput, EnvironmentUpdate, ClientType } from '../../shared-types/index.js'; // check this import points to the right level depending on if you added a /src directory or not

const app = express();
const server = createServer(app);

// Enable CORS for all domains (development only)
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// This will hold the current state of the vehicle
// Typically, a database or in-memory store would be used,
// but for simplicity, we'll use a single object here.
let vehicleState: VehicleState = {
  motion: {
    speed: 0,        // Current speed in MPH
    direction: 0,    // Heading in degrees (0-359)
    x: 100,         // Position X coordinate
    y: 100,         // Position Y coordinate
    accelerating: false
  },
  controls: {
    throttle: 0,    // 0-1 (idle to full throttle)
    brake: 0,       // 0-1 (no brake to full brake)
    steering: 0,    // -1 to 1 (full left to full right)
    gear: 'P'       // P, R, N, D, S
  },
  systems: {
    lights: false,
    leftSignal: false,
    rightSignal: false,
    hazards: false
  },
  cluster: {
    rpm: 0,
    fuel: 85,       // Percentage
    battery: 75,    // Percentage for electric vehicles
    warnings: [],   // Array of warning strings
    trip: 0,        // Trip odometer
    odometer: 45234 // Total mileage
  },
  environment: {
    speedLimit: 55,
    nearbyTraffic: [],
    alerts: []
  },
  timestamp: Date.now()
};

// Track connected clients by type with proper typing
interface ConnectedClients {
  [key: string]: number;
}

const connectedClients: ConnectedClients = {
  mobile: 0,
  tablet: 0,
  web: 0,
  test: 0
};

// Extend Socket interface to include clientType
declare module 'socket.io' {
  interface Socket {
    clientType?: ClientType;
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current state to newly connected client
  socket.emit('vehicle-update', vehicleState);

  // Handle client type registration with type safety
  socket.on('register-client', (clientType: ClientType) => {
    socket.clientType = clientType;
    connectedClients[clientType]++;
    console.log(`${clientType} client connected. Total: ${connectedClients[clientType]}`);
  });

  // Handle control inputs from mobile app with type safety
  socket.on('control-input', (data: ControlInput) => {
    const { type, value } = data;

    // Update vehicle state based on input with type-safe operations
    switch(type) {
      case 'throttle':
        vehicleState.controls.throttle = Math.max(0, Math.min(1, value as number));
        break;
      case 'brake':
        vehicleState.controls.brake = Math.max(0, Math.min(1, value as number));
        break;
      case 'steering':
        vehicleState.controls.steering = Math.max(-1, Math.min(1, value as number));
        break;
      case 'gear':
        vehicleState.controls.gear = value as 'P' | 'R' | 'N' | 'D' | 'S';
        break;
      case 'lights':
        vehicleState.systems.lights = value as boolean;
        break;
      case 'leftSignal':
        vehicleState.systems.leftSignal = value as boolean;
        break;
      case 'rightSignal':
        vehicleState.systems.rightSignal = value as boolean;
        break;
      case 'hazards':
        vehicleState.systems.hazards = value as boolean;
        break;
    }

    vehicleState.timestamp = Date.now();

    // Broadcast updated state to all clients
    io.emit('vehicle-update', vehicleState);
  });
});

// Simple physics simulation (runs at 20 FPS) with type-safe operations
setInterval(() => {
  updateVehiclePhysics();
  io.emit('vehicle-update', vehicleState);
}, 50);

function updateVehiclePhysics(): void {
  const { controls, motion } = vehicleState;

  // Simple acceleration/deceleration model
  if (controls.throttle > 0 && (controls.gear === 'D' || controls.gear === 'R')) {
    motion.speed += controls.throttle * 0.5; // Acceleration
    motion.accelerating = true;
  } else if (controls.brake > 0) {
    motion.speed -= controls.brake * 1.0; // Braking
    motion.accelerating = false;
  } else {
    motion.speed *= 0.98; // Natural deceleration
    motion.accelerating = false;
  }

  // Apply speed limits
  motion.speed = Math.max(-100, Math.min(120, motion.speed));

  // Update RPM based on speed and gear
  if (controls.gear === 'D') {
    vehicleState.cluster.rpm = Math.min(6000, motion.speed * 50 + controls.throttle * 1000);
  } else {
    vehicleState.cluster.rpm *= 0.95; // RPM decay
  }

  // Update position based on speed and steering
  if (motion.speed > 0) {
    motion.direction += controls.steering * motion.speed * 0.1;
    motion.direction = motion.direction % 360;

    const radians = (motion.direction * Math.PI) / 180;
    motion.x += Math.cos(radians) * motion.speed * 0.1;
    motion.y += Math.sin(radians) * motion.speed * 0.1;
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚗 Vehicle Server running on port ${PORT}`);
  console.log('Waiting for clients to connect...');
});