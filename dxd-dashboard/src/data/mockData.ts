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
  sector: string;
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

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'patrol' | 'alert' | 'dispatch' | 'arrival' | 'system';
  message: string;
}

// Initial drone positions - centered around ASU Tempe campus
export const initialDrones: Drone[] = [
  {
    id: 'DXD-001',
    name: 'Alpha',
    lat: 33.4240,
    lng: -111.9380,
    status: 'patrolling',
    battery: 87,
    speed: 12,
    heading: 45,
    sector: 'Sector A',
  },
  {
    id: 'DXD-002',
    name: 'Bravo',
    lat: 33.4260,
    lng: -111.9410,
    status: 'idle',
    battery: 95,
    speed: 0,
    heading: 0,
    sector: 'Sector B',
  },
  {
    id: 'DXD-003',
    name: 'Charlie',
    lat: 33.4245,
    lng: -111.9430,
    status: 'patrolling',
    battery: 72,
    speed: 15,
    heading: 180,
    sector: 'Sector C',
  },
  {
    id: 'DXD-004',
    name: 'Delta',
    lat: 33.4270,
    lng: -111.9370,
    status: 'patrolling',
    battery: 64,
    speed: 10,
    heading: 270,
    sector: 'Sector D',
  },
];

// The alert that will appear after 5 seconds (inside geofence)
export const scriptedAlert: Alert = {
  id: 'ALERT-001',
  lat: 33.4265,
  lng: -111.9380,
  type: 'perimeter_breach',
  severity: 'high',
  timestamp: new Date(),
  description: 'Motion detected at eastern perimeter fence',
};

// External alert that appears after 15 seconds (outside geofence)
export const externalAlert: Alert = {
  id: 'ALERT-002',
  lat: 33.4295,
  lng: -111.9320,
  type: 'unauthorized_access',
  severity: 'high',
  timestamp: new Date(),
  description: 'Unauthorized vehicle detected outside perimeter',
};

// Geofence boundary - secured perimeter polygon
export const geofenceBoundary: [number, number][] = [
  [33.4285, -111.9450],  // NW corner
  [33.4285, -111.9350],  // NE corner
  [33.4225, -111.9350],  // SE corner
  [33.4225, -111.9450],  // SW corner
];

// Helper function to check if a point is inside the geofence
export function isInsideGeofence(lat: number, lng: number): boolean {
  const lats = geofenceBoundary.map(p => p[0]);
  const lngs = geofenceBoundary.map(p => p[1]);
  return (
    lat >= Math.min(...lats) &&
    lat <= Math.max(...lats) &&
    lng >= Math.min(...lngs) &&
    lng <= Math.max(...lngs)
  );
}

// Map center point - ASU Tempe Campus
export const mapCenter: [number, number] = [33.4255, -111.9400];
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

export const logTypeColors = {
  patrol: '#3b82f6',   // blue
  alert: '#dc2626',    // red
  dispatch: '#eab308', // yellow
  arrival: '#22c55e',  // green
  system: '#6b7280',   // gray
};
