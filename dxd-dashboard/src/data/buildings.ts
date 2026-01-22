// Comprehensive ASU Tempe Campus Buildings
// Based on actual campus layout

export interface Building {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  width: number;
  depth: number;
  height: number;
  color: string;
}

// Color palette for variety
const COLORS = {
  brick: '#8B4513',
  tan: '#D2B48C',
  sandstone: '#C2B280',
  gray: '#708090',
  darkGray: '#4A4A4A',
  cream: '#FFFDD0',
  terracotta: '#E2725B',
  brown: '#964B00',
};

export const campusBuildings: Building[] = [
  // === CENTRAL CAMPUS ===
  {
    id: 'hayden-library',
    name: 'Hayden Library',
    position: { lat: 33.4197, lng: -111.9342 },
    width: 15,
    depth: 20,
    height: 8,
    color: COLORS.brick,
  },
  {
    id: 'noble-library',
    name: 'Noble Library',
    position: { lat: 33.4182, lng: -111.9342 },
    width: 12,
    depth: 15,
    height: 6,
    color: COLORS.sandstone,
  },
  {
    id: 'old-main',
    name: 'Old Main',
    position: { lat: 33.4181, lng: -111.9326 },
    width: 12,
    depth: 8,
    height: 10,
    color: COLORS.brick,
  },
  {
    id: 'memorial-union',
    name: 'Memorial Union (MU)',
    position: { lat: 33.4178, lng: -111.9362 },
    width: 18,
    depth: 14,
    height: 6,
    color: COLORS.tan,
  },
  {
    id: 'student-services',
    name: 'Student Services',
    position: { lat: 33.4170, lng: -111.9348 },
    width: 14,
    depth: 10,
    height: 5,
    color: COLORS.cream,
  },

  // === WEST CAMPUS ===
  {
    id: 'gammage',
    name: 'Gammage Auditorium',
    position: { lat: 33.4140, lng: -111.9405 },
    width: 16,
    depth: 16,
    height: 6,
    color: COLORS.terracotta,
  },
  {
    id: 'music-building',
    name: 'Music Building',
    position: { lat: 33.4155, lng: -111.9395 },
    width: 12,
    depth: 18,
    height: 5,
    color: COLORS.sandstone,
  },
  {
    id: 'art-museum',
    name: 'ASU Art Museum',
    position: { lat: 33.4165, lng: -111.9388 },
    width: 10,
    depth: 10,
    height: 5,
    color: COLORS.gray,
  },

  // === ENGINEERING / SCIENCE ===
  {
    id: 'engineering-center-a',
    name: 'Engineering Center A',
    position: { lat: 33.4215, lng: -111.9320 },
    width: 12,
    depth: 10,
    height: 7,
    color: COLORS.darkGray,
  },
  {
    id: 'engineering-center-b',
    name: 'Engineering Center B',
    position: { lat: 33.4215, lng: -111.9290 },
    width: 12,
    depth: 10,
    height: 7,
    color: COLORS.darkGray,
  },
  {
    id: 'goldwater-center',
    name: 'Goldwater Center',
    position: { lat: 33.4225, lng: -111.9305 },
    width: 14,
    depth: 8,
    height: 6,
    color: COLORS.tan,
  },
  {
    id: 'physical-sciences',
    name: 'Physical Sciences',
    position: { lat: 33.4205, lng: -111.9360 },
    width: 18,
    depth: 12,
    height: 6,
    color: COLORS.sandstone,
  },
  {
    id: 'life-sciences-a',
    name: 'Life Sciences A',
    position: { lat: 33.4195, lng: -111.9372 },
    width: 10,
    depth: 12,
    height: 5,
    color: COLORS.cream,
  },
  {
    id: 'life-sciences-b',
    name: 'Life Sciences B',
    position: { lat: 33.4195, lng: -111.9395 },
    width: 10,
    depth: 12,
    height: 5,
    color: COLORS.cream,
  },

  // === ATHLETIC FACILITIES ===
  {
    id: 'sun-devil-stadium',
    name: 'Sun Devil Stadium',
    position: { lat: 33.4270, lng: -111.9320 },
    width: 22,
    depth: 18,
    height: 12,
    color: COLORS.darkGray,
  },
  {
    id: 'wells-fargo-arena',
    name: 'Wells Fargo Arena',
    position: { lat: 33.4248, lng: -111.9365 },
    width: 14,
    depth: 14,
    height: 8,
    color: COLORS.gray,
  },
  {
    id: 'sun-devil-fitness',
    name: 'Sun Devil Fitness',
    position: { lat: 33.4240, lng: -111.9335 },
    width: 12,
    depth: 16,
    height: 5,
    color: COLORS.tan,
  },
  {
    id: 'packard-stadium',
    name: 'Packard Stadium',
    position: { lat: 33.4255, lng: -111.9295 },
    width: 14,
    depth: 14,
    height: 4,
    color: COLORS.sandstone,
  },

  // === NORTH CAMPUS ===
  {
    id: 'business-admin',
    name: 'Business Administration',
    position: { lat: 33.4228, lng: -111.9360 },
    width: 14,
    depth: 10,
    height: 6,
    color: COLORS.brick,
  },
  {
    id: 'mccord-hall',
    name: 'McCord Hall',
    position: { lat: 33.4235, lng: -111.9385 },
    width: 12,
    depth: 8,
    height: 7,
    color: COLORS.tan,
  },
  {
    id: 'computing-commons',
    name: 'Computing Commons',
    position: { lat: 33.4200, lng: -111.9320 },
    width: 10,
    depth: 10,
    height: 4,
    color: COLORS.cream,
  },

  // === RESIDENCE HALLS ===
  {
    id: 'manzanita-hall',
    name: 'Manzanita Hall',
    position: { lat: 33.4160, lng: -111.9310 },
    width: 20,
    depth: 8,
    height: 10,
    color: COLORS.tan,
  },
  {
    id: 'palo-verde-east',
    name: 'Palo Verde East',
    position: { lat: 33.4150, lng: -111.9285 },
    width: 10,
    depth: 14,
    height: 8,
    color: COLORS.sandstone,
  },
  {
    id: 'palo-verde-west',
    name: 'Palo Verde West',
    position: { lat: 33.4150, lng: -111.9325 },
    width: 10,
    depth: 14,
    height: 8,
    color: COLORS.sandstone,
  },
  {
    id: 'hassayampa',
    name: 'Hassayampa',
    position: { lat: 33.4145, lng: -111.9355 },
    width: 18,
    depth: 12,
    height: 6,
    color: COLORS.cream,
  },

  // === ADDITIONAL BUILDINGS ===
  {
    id: 'social-sciences',
    name: 'Social Sciences',
    position: { lat: 33.4188, lng: -111.9310 },
    width: 14,
    depth: 10,
    height: 5,
    color: COLORS.brick,
  },
  {
    id: 'language-lit',
    name: 'Language & Literature',
    position: { lat: 33.4188, lng: -111.9380 },
    width: 12,
    depth: 14,
    height: 5,
    color: COLORS.sandstone,
  },
  {
    id: 'discovery-hall',
    name: 'Discovery Hall',
    position: { lat: 33.4210, lng: -111.9345 },
    width: 10,
    depth: 12,
    height: 4,
    color: COLORS.cream,
  },
  {
    id: 'fulton-center',
    name: 'Fulton Center',
    position: { lat: 33.4218, lng: -111.9280 },
    width: 14,
    depth: 10,
    height: 6,
    color: COLORS.gray,
  },
  {
    id: 'brickyard',
    name: 'Brickyard',
    position: { lat: 33.4165, lng: -111.9330 },
    width: 10,
    depth: 8,
    height: 4,
    color: COLORS.terracotta,
  },
];

// Alert locations - positioned away from drone patrol/idle positions
// Avoids: DXD-001 (33.4265, -111.9325), DXD-002 idle (33.4197, -111.9342),
//         DXD-003 (33.4188, -111.9345), DXD-004 idle (33.4178, -111.9362)
export const alertLocations = [
  // Inside geofence - away from drone positions
  { lat: 33.4215, lng: -111.9290, name: 'Engineering East', inside: true },
  { lat: 33.4155, lng: -111.9395, name: 'Gammage Auditorium', inside: true },
  { lat: 33.4160, lng: -111.9310, name: 'Manzanita Hall', inside: true },
  { lat: 33.4230, lng: -111.9380, name: 'Business Complex', inside: true },
  { lat: 33.4145, lng: -111.9355, name: 'Hassayampa', inside: true },
  { lat: 33.4181, lng: -111.9326, name: 'Old Main', inside: true },
  // Outside geofence (perimeter alerts)
  { lat: 33.4290, lng: -111.9350, name: 'North Perimeter', inside: false },
  { lat: 33.4120, lng: -111.9350, name: 'South Entry', inside: false },
  { lat: 33.4200, lng: -111.9450, name: 'West Boundary', inside: false },
  { lat: 33.4200, lng: -111.9240, name: 'East Boundary', inside: false },
];
