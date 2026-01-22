export interface SentryTower {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  detectionRadius: number; // in meters
  status: 'active' | 'alert' | 'offline';
  type: 'standard' | 'elevated' | 'mobile';
}

// Strategic tower placements around ASU campus
export const initialSentryTowers: SentryTower[] = [
  {
    id: 'ST-001',
    name: 'Library Watch',
    position: { lat: 33.4190, lng: -111.9340 },
    detectionRadius: 80,
    status: 'active',
    type: 'elevated',
  },
  {
    id: 'ST-002',
    name: 'Stadium North',
    position: { lat: 33.4275, lng: -111.9325 },
    detectionRadius: 100,
    status: 'active',
    type: 'elevated',
  },
  {
    id: 'ST-003',
    name: 'Memorial Gate',
    position: { lat: 33.4170, lng: -111.9362 },
    detectionRadius: 70,
    status: 'active',
    type: 'standard',
  },
  {
    id: 'ST-004',
    name: 'Engineering Plaza',
    position: { lat: 33.4218, lng: -111.9300 },
    detectionRadius: 75,
    status: 'active',
    type: 'standard',
  },
  {
    id: 'ST-005',
    name: 'West Campus Entry',
    position: { lat: 33.4150, lng: -111.9400 },
    detectionRadius: 90,
    status: 'active',
    type: 'elevated',
  },
  {
    id: 'ST-006',
    name: 'Residence Quad',
    position: { lat: 33.4155, lng: -111.9305 },
    detectionRadius: 70,
    status: 'active',
    type: 'standard',
  },
];
