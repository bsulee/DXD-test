// Types for our drone fleet
export interface Drone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'patrolling' | 'responding' | 'idle' | 'returning';
  battery: number;
  speed: number;
  heading: number;
}

export interface Alert {
  id: string;
  lat: number;
  lng: number;
  type: 'perimeter_breach' | 'motion_detected' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  description: string;
}

// Initial drone positions - centered around a facility
// Using coordinates near San Francisco for the demo
export const initialDrones: Drone[] = [
  {
    id: 'DXD-001',
    name: 'Alpha',
    lat: 37.7749,
    lng: -122.4194,
    status: 'patrolling',
    battery: 87,
    speed: 12,
    heading: 45,
  },
  {
    id: 'DXD-002',
    name: 'Bravo',
    lat: 37.7755,
    lng: -122.4180,
    status: 'idle',
    battery: 95,
    speed: 0,
    heading: 0,
  },
  {
    id: 'DXD-003',
    name: 'Charlie',
    lat: 37.7742,
    lng: -122.4210,
    status: 'patrolling',
    battery: 72,
    speed: 15,
    heading: 180,
  },
  {
    id: 'DXD-004',
    name: 'Delta',
    lat: 37.7760,
    lng: -122.4220,
    status: 'patrolling',
    battery: 64,
    speed: 10,
    heading: 270,
  },
];

// The alert that will appear after 5 seconds
export const scriptedAlert: Alert = {
  id: 'ALERT-001',
  lat: 37.7765,
  lng: -122.4165,
  type: 'perimeter_breach',
  severity: 'high',
  timestamp: new Date(),
  description: 'Motion detected at eastern perimeter fence',
};

// Map center point
export const mapCenter: [number, number] = [37.7750, -122.4195];
export const mapZoom = 16;

// Status colors for easy reference
export const statusColors = {
  patrolling: '#22c55e', // green
  responding: '#dc2626', // red
  idle: '#6b7280',       // gray
  returning: '#f59e0b',  // amber
};

export const severityColors = {
  low: '#22c55e',    // green
  medium: '#f59e0b', // amber
  high: '#dc2626',   // red
};
