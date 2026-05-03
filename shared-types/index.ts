// Shared type definitions for the entire automotive suite
export interface VehicleMotion {
    speed: number;        // Current speed in MPH
    direction: number;    // Heading in degrees (0-359)
    x: number;           // Position X coordinate
    y: number;           // Position Y coordinate
    accelerating: boolean;
  }
  
  export interface VehicleControls {
    throttle: number;    // 0-1 (idle to full throttle)
    brake: number;       // 0-1 (no brake to full brake)
    steering: number;    // -1 to 1 (full left to full right)
    gear: 'P' | 'R' | 'N' | 'D' | 'S';
  }
  
  export interface VehicleSystems {
    lights: boolean;
    leftSignal: boolean;
    rightSignal: boolean;
    hazards: boolean;
  }
  
  export interface VehicleCluster {
    rpm: number;
    fuel: number;       // Percentage
    battery: number;    // Percentage for electric vehicles
    warnings: string[]; // Array of warning strings
    trip: number;       // Trip odometer
    odometer: number;   // Total mileage
  }
  
  export interface VehicleEnvironment {
    speedLimit: number;
    nearbyTraffic: any[];
    alerts: string[];
  }
  
  export interface VehicleState {
    motion: VehicleMotion;
    controls: VehicleControls;
    systems: VehicleSystems;
    cluster: VehicleCluster;
    environment: VehicleEnvironment;
    timestamp: number;
  }
  
  export interface ControlInput {
    type: 'throttle' | 'brake' | 'steering' | 'gear' | 'lights' | 'leftSignal' | 'rightSignal' | 'hazards';
    value: number | string | boolean;
  }
  
  export interface EnvironmentUpdate {
    speedLimit?: number;
    alerts?: string[];
  }
  
  export type ClientType = 'mobile' | 'tablet' | 'web' | 'test';