// Simple building definitions for ASU campus
// Each building is just a box with position, size, and color

export interface Building {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  width: number;   // x-axis (east-west)
  depth: number;   // z-axis (north-south)
  height: number;  // y-axis (vertical)
  color: string;
}

export const campusBuildings: Building[] = [
  {
    id: 'hayden',
    name: 'Hayden Library',
    position: { lat: 33.4242, lng: -111.9281 },
    width: 8,
    depth: 12,
    height: 6,
    color: '#8B4513', // Brown
  },
  {
    id: 'old-main',
    name: 'Old Main',
    position: { lat: 33.4255, lng: -111.9325 },
    width: 10,
    depth: 6,
    height: 8,
    color: '#CD853F', // Tan
  },
  {
    id: 'memorial-union',
    name: 'Memorial Union',
    position: { lat: 33.4218, lng: -111.9346 },
    width: 14,
    depth: 10,
    height: 5,
    color: '#A0522D', // Sienna
  },
  {
    id: 'stadium',
    name: 'Sun Devil Stadium',
    position: { lat: 33.4265, lng: -111.9400 },
    width: 20,
    depth: 16,
    height: 10,
    color: '#4A4A4A', // Dark gray
  },
  {
    id: 'wells-fargo',
    name: 'Wells Fargo Arena',
    position: { lat: 33.4250, lng: -111.9420 },
    width: 12,
    depth: 12,
    height: 7,
    color: '#5A5A5A', // Gray
  },
  {
    id: 'gammage',
    name: 'Gammage Auditorium',
    position: { lat: 33.4235, lng: -111.9360 },
    width: 10,
    depth: 10,
    height: 4,
    color: '#DEB887', // Burlywood
  },
];
