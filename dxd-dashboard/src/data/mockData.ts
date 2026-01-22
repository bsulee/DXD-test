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

// ASU Campus alert locations - updated to match comprehensive campus
export const asuAlertLocations = [
  { lat: 33.4197, lng: -111.9342, name: "Hayden Library", inside: true },
  { lat: 33.4178, lng: -111.9362, name: "Memorial Union", inside: true },
  { lat: 33.4181, lng: -111.9326, name: "Old Main", inside: true },
  { lat: 33.4265, lng: -111.9325, name: "Sun Devil Stadium", inside: true },
  { lat: 33.4140, lng: -111.9405, name: "Gammage Auditorium", inside: true },
  { lat: 33.4212, lng: -111.9315, name: "Engineering Center", inside: true },
  { lat: 33.4130, lng: -111.9280, name: "Rural Road (External)", inside: false },
  { lat: 33.4280, lng: -111.9400, name: "North Perimeter", inside: false },
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
// 2 patrolling, 2 idle (landed on buildings)
export const initialDrones: Drone[] = [
  {
    id: 'DXD-001',
    name: 'Alpha',
    lat: 33.4265,
    lng: -111.9325,
    status: 'patrolling',
    battery: 87,
    speed: 12,
    heading: 45,
    sector: 'Stadium District',
  },
  {
    id: 'DXD-002',
    name: 'Bravo',
    lat: 33.4197,
    lng: -111.9342,
    status: 'idle',
    battery: 95,
    speed: 0,
    heading: 0,
    sector: 'Hayden Library',
  },
  {
    id: 'DXD-003',
    name: 'Charlie',
    lat: 33.4188,
    lng: -111.9345,
    status: 'patrolling',
    battery: 72,
    speed: 12,
    heading: 180,
    sector: 'Central Campus',
  },
  {
    id: 'DXD-004',
    name: 'Delta',
    lat: 33.4178,
    lng: -111.9362,
    status: 'idle',
    battery: 64,
    speed: 0,
    heading: 0,
    sector: 'Memorial Union',
  },
];

// Geofence boundary - secured perimeter polygon (expanded to cover full ASU campus)
export const geofenceBoundary: [number, number][] = [
  [33.4280, -111.9420],  // NW corner
  [33.4280, -111.9260],  // NE corner
  [33.4130, -111.9260],  // SE corner
  [33.4130, -111.9420],  // SW corner
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

// Map center point - ASU Tempe Campus (centered on expanded campus)
export const mapCenter: [number, number] = [33.4200, -111.9340];
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
