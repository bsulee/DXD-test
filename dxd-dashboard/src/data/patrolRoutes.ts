// ASU Campus patrol routes
export const patrolRoutes: Record<string, { lat: number; lng: number; name: string }[]> = {
  'DXD-001': [
    { lat: 33.4242, lng: -111.9281, name: 'Hayden Library' },
    { lat: 33.4260, lng: -111.9300, name: 'Noble Library' },
    { lat: 33.4255, lng: -111.9325, name: 'Old Main' },
    { lat: 33.4240, lng: -111.9310, name: 'Computing Commons' },
  ],
  'DXD-002': [
    { lat: 33.4218, lng: -111.9346, name: 'Memorial Union' },
    { lat: 33.4225, lng: -111.9380, name: 'Danforth Chapel' },
    { lat: 33.4245, lng: -111.9390, name: 'Music Building' },
    { lat: 33.4235, lng: -111.9360, name: 'Gammage' },
  ],
  'DXD-003': [
    { lat: 33.4270, lng: -111.9350, name: 'Sun Devil Stadium North' },
    { lat: 33.4265, lng: -111.9400, name: 'Wells Fargo Arena' },
    { lat: 33.4250, lng: -111.9420, name: 'Parking West' },
    { lat: 33.4260, lng: -111.9370, name: 'Stadium Loop' },
  ],
};

export const alertLocations = [
  { lat: 33.4242, lng: -111.9281, name: 'Hayden Library', inside: true },
  { lat: 33.4218, lng: -111.9346, name: 'Memorial Union', inside: true },
  { lat: 33.4255, lng: -111.9325, name: 'Old Main', inside: true },
  { lat: 33.4203, lng: -111.9290, name: 'University Drive', inside: false },
  { lat: 33.4280, lng: -111.9450, name: 'Rural Road', inside: false },
];
