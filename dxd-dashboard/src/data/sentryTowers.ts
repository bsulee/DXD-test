export interface SentryTower {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  detectionRadius: number; // in meters
  status: 'active' | 'alert' | 'offline';
  type: 'standard' | 'elevated' | 'mobile';
}

// Strategic tower placements - positioned inside campus perimeter
// Campus bounds: Lat 33.414-33.426, Lng -111.940 to -111.927
export const initialSentryTowers: SentryTower[] = [
  {
    id: 'ST-001',
    name: 'Engineering Watch',
    position: { lat: 33.4215, lng: -111.9290 },  // Near Fulton/Engineering
    detectionRadius: 100,
    status: 'active',
    type: 'elevated',
  },
  {
    id: 'ST-002',
    name: 'Stadium Tower',
    position: { lat: 33.4250, lng: -111.9340 },  // Near Sun Devil Stadium
    detectionRadius: 120,
    status: 'active',
    type: 'elevated',
  },
  {
    id: 'ST-003',
    name: 'Gammage Tower',
    position: { lat: 33.4155, lng: -111.9385 },  // Near Gammage Auditorium
    detectionRadius: 80,
    status: 'active',
    type: 'standard',
  },
  {
    id: 'ST-004',
    name: 'Central Campus',
    position: { lat: 33.4180, lng: -111.9340 },  // Near Hayden Library
    detectionRadius: 90,
    status: 'active',
    type: 'standard',
  },
  {
    id: 'ST-005',
    name: 'Science Complex',
    position: { lat: 33.4190, lng: -111.9380 },  // Near Biodesign/Life Sciences
    detectionRadius: 100,
    status: 'active',
    type: 'elevated',
  },
  {
    id: 'ST-006',
    name: 'Residential South',
    position: { lat: 33.4148, lng: -111.9320 },  // Near Barrett/Hassayampa
    detectionRadius: 90,
    status: 'active',
    type: 'standard',
  },
];
