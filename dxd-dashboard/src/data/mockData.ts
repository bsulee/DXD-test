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
  locationName: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'patrol' | 'alert' | 'dispatch' | 'arrival' | 'system';
  message: string;
}

// ASU Campus alert locations
export const asuAlertLocations = [
  { lat: 33.4242, lng: -111.9281, name: "Hayden Library", inside: true },
  { lat: 33.4218, lng: -111.9346, name: "Memorial Union", inside: true },
  { lat: 33.4255, lng: -111.9325, name: "Old Main", inside: true },
  { lat: 33.4203, lng: -111.9340, name: "Sun Devil Stadium", inside: false },
  { lat: 33.4237, lng: -111.9450, name: "Wells Fargo Arena", inside: false },
];

// Alert types for variety
const alertTypes: { type: Alert['type']; description: string }[] = [
  { type: 'perimeter_breach', description: 'Perimeter breach detected' },
  { type: 'motion_detected', description: 'Suspicious motion detected' },
  { type: 'unauthorized_access', description: 'Unauthorized access attempt' },
];

// Generate a random alert from ASU locations
export function generateAlert(): Alert {
  const location = asuAlertLocations[Math.floor(Math.random() * asuAlertLocations.length)];
  const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];

  return {
    id: `ALERT-${Date.now()}`,
    lat: location.lat,
    lng: location.lng,
    type: alertType.type,
    severity: 'high',
    timestamp: new Date(),
    description: `${alertType.description} at ${location.name}`,
    locationName: location.name,
  };
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

// Geofence boundary - secured perimeter polygon (expanded to cover ASU campus)
export const geofenceBoundary: [number, number][] = [
  [33.4280, -111.9460],  // NW corner
  [33.4280, -111.9260],  // NE corner
  [33.4190, -111.9260],  // SE corner
  [33.4190, -111.9460],  // SW corner
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
export const mapCenter: [number, number] = [33.4235, -111.9360];
export const mapZoom = 15;

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
