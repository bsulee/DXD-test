export interface SentryTower {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  detectionRadius: number; // in meters
  status: 'active' | 'alert' | 'offline';
  type: 'standard' | 'elevated' | 'mobile';
}

// Strategic tower placements - positioned near alert locations for detection
export const initialSentryTowers: SentryTower[] = [
  {
    id: 'ST-001',
    name: 'Engineering Watch',
    position: { lat: 33.4220, lng: -111.9295 },  // Near Engineering East alert
    detectionRadius: 100,
    status: 'active',
    type: 'elevated',
  },
  {
    id: 'ST-002',
    name: 'Stadium North',
    position: { lat: 33.4280, lng: -111.9340 },  // Near North Perimeter
    detectionRadius: 120,
    status: 'active',
    type: 'elevated',
  },
  {
    id: 'ST-003',
    name: 'Gammage Tower',
    position: { lat: 33.4150, lng: -111.9390 },  // Near Gammage alert
    detectionRadius: 80,
    status: 'active',
    type: 'standard',
  },
  {
    id: 'ST-004',
    name: 'Central Campus',
    position: { lat: 33.4165, lng: -111.9320 },  // Near Manzanita/Old Main
    detectionRadius: 90,
    status: 'active',
    type: 'standard',
  },
  {
    id: 'ST-005',
    name: 'West Gate',
    position: { lat: 33.4195, lng: -111.9440 },  // Near West Boundary
    detectionRadius: 100,
    status: 'active',
    type: 'elevated',
  },
  {
    id: 'ST-006',
    name: 'South Entry',
    position: { lat: 33.4130, lng: -111.9350 },  // Near South Entry
    detectionRadius: 90,
    status: 'active',
    type: 'standard',
  },
];
