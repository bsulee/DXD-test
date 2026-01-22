// OpenStreetMap building data fetcher for ASU campus

export interface OSMBuilding {
  id: number;
  name: string;
  lat: number;
  lng: number;
  width: number;
  depth: number;
  height: number;
  color: string;
}

// ASU Campus bounding box
const BOUNDS = {
  south: 33.4130,
  north: 33.4280,
  west: -111.9450,
  east: -111.9250,
};

// Overpass API query for buildings in ASU area
const OVERPASS_QUERY = `
[out:json][timeout:25];
(
  way["building"](${BOUNDS.south},${BOUNDS.west},${BOUNDS.north},${BOUNDS.east});
  relation["building"](${BOUNDS.south},${BOUNDS.west},${BOUNDS.north},${BOUNDS.east});
);
out body;
>;
out skel qt;
`;

// Color palette based on building type
const BUILDING_COLORS: Record<string, string> = {
  university: '#8B4513',
  college: '#8B4513',
  school: '#A0522D',
  library: '#CD853F',
  dormitory: '#D2B48C',
  residential: '#DEB887',
  sports_centre: '#4A4A4A',
  stadium: '#3A3A3A',
  parking: '#555555',
  commercial: '#708090',
  retail: '#778899',
  default: '#B8860B',
};

function getBuildingColor(tags: Record<string, string>): string {
  if (tags.building && BUILDING_COLORS[tags.building]) {
    return BUILDING_COLORS[tags.building];
  }
  if (tags.amenity && BUILDING_COLORS[tags.amenity]) {
    return BUILDING_COLORS[tags.amenity];
  }
  return BUILDING_COLORS.default;
}

function estimateHeight(tags: Record<string, string>): number {
  // Use actual height if available
  if (tags.height) {
    const h = parseFloat(tags.height);
    if (!isNaN(h)) return h;
  }

  // Use building:levels if available (assume 4m per level)
  if (tags['building:levels']) {
    const levels = parseInt(tags['building:levels']);
    if (!isNaN(levels)) return levels * 4;
  }

  // Estimate based on building type
  const type = tags.building || '';
  if (type === 'stadium') return 15;
  if (type === 'sports_centre') return 10;
  if (type === 'dormitory' || type === 'residential') return 12;
  if (type === 'university' || type === 'college') return 8;
  if (type === 'parking') return 6;

  // Default height
  return 6;
}

interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
}

export async function fetchOSMBuildings(): Promise<OSMBuilding[]> {
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse nodes into a lookup map
    const nodes: Record<number, { lat: number; lon: number }> = {};
    data.elements.forEach((el: OSMElement) => {
      if (el.type === 'node' && el.lat !== undefined && el.lon !== undefined) {
        nodes[el.id] = { lat: el.lat, lon: el.lon };
      }
    });

    // Parse ways (buildings)
    const buildings: OSMBuilding[] = [];

    data.elements.forEach((el: OSMElement) => {
      if (el.type === 'way' && el.tags?.building && el.nodes) {
        const nodeCoords = el.nodes
          .map((nodeId: number) => nodes[nodeId])
          .filter((n): n is { lat: number; lon: number } => n !== undefined);

        if (nodeCoords.length < 3) return;

        // Calculate centroid
        const centroid = nodeCoords.reduce(
          (acc, n) => ({
            lat: acc.lat + n.lat / nodeCoords.length,
            lon: acc.lon + n.lon / nodeCoords.length,
          }),
          { lat: 0, lon: 0 }
        );

        // Calculate bounding box for width/depth
        const lats = nodeCoords.map((n) => n.lat);
        const lons = nodeCoords.map((n) => n.lon);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        // Convert to approximate meters (rough conversion for Arizona)
        const latToMeters = 111000; // ~111km per degree latitude
        const lonToMeters = 111000 * Math.cos(centroid.lat * Math.PI / 180);

        const width = (maxLon - minLon) * lonToMeters;
        const depth = (maxLat - minLat) * latToMeters;

        // Skip tiny buildings
        if (width < 5 || depth < 5) return;

        buildings.push({
          id: el.id,
          name: el.tags.name || `Building ${el.id}`,
          lat: centroid.lat,
          lng: centroid.lon,
          width: Math.min(width, 100), // Cap at 100m
          depth: Math.min(depth, 100),
          height: estimateHeight(el.tags),
          color: getBuildingColor(el.tags),
        });
      }
    });

    console.log(`Loaded ${buildings.length} buildings from OSM`);
    return buildings;

  } catch (error) {
    console.error('Failed to fetch OSM buildings:', error);
    return [];
  }
}
