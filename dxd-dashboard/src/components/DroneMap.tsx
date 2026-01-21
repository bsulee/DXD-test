import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import type { Drone, Alert } from '../data/mockData';
import { mapCenter, mapZoom, statusColors, severityColors, geofenceBoundary, isInsideGeofence } from '../data/mockData';

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error - Leaflet icon default fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface DroneMapProps {
  drones: Drone[];
  alert: Alert | null;
  onDispatch: (droneId: string) => void;
}

// Create custom drone icon
const createDroneIcon = (status: Drone['status']) => {
  const color = statusColors[status];
  return L.divIcon({
    className: 'drone-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="#ffffff" stroke-width="1.5" fill="${color}"/>
          <circle cx="12" cy="12" r="3" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Create custom alert icon
const createAlertIcon = (severity: Alert['severity'], isExternal: boolean) => {
  const color = isExternal ? '#f59e0b' : severityColors[severity]; // Orange for external, normal color for internal
  return L.divIcon({
    className: 'alert-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.3"/>
          <circle cx="12" cy="12" r="6" fill="${color}" opacity="0.6"/>
          <circle cx="12" cy="12" r="3" fill="${color}"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Component to update map view when drone positions change
function MapUpdater({ drones }: { drones: Drone[] }) {
  useMap();

  useEffect(() => {
    // Map updates automatically as drone positions change
    // Could optionally fit bounds here if needed
  }, [drones]);

  return null;
}

export default function DroneMap({ drones, alert, onDispatch }: DroneMapProps) {
  // Find nearest drone to alert
  const findNearestDrone = (): Drone | null => {
    if (!alert) return null;

    const availableDrones = drones.filter(d => d.status !== 'responding');
    if (availableDrones.length === 0) return null;

    return availableDrones.reduce((nearest, drone) => {
      const currentDistance = Math.sqrt(
        Math.pow(drone.lat - alert.lat, 2) +
        Math.pow(drone.lng - alert.lng, 2)
      );
      const nearestDistance = Math.sqrt(
        Math.pow(nearest.lat - alert.lat, 2) +
        Math.pow(nearest.lng - alert.lng, 2)
      );
      return currentDistance < nearestDistance ? drone : nearest;
    });
  };

  const nearestDrone: Drone | null = alert ? findNearestDrone() : null;
  const isAlertExternal = alert ? !isInsideGeofence(alert.lat, alert.lng) : false;

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapUpdater drones={drones} />

      {/* Geofence boundary polygon */}
      <Polygon
        positions={geofenceBoundary}
        pathOptions={{
          color: '#dc2626',
          fillColor: '#dc2626',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '10, 10',
        }}
      />

      {/* Drone coverage circles */}
      {drones.map((drone) => (
        <Circle
          key={`coverage-${drone.id}`}
          center={[drone.lat, drone.lng]}
          radius={100}
          pathOptions={{
            color: statusColors[drone.status],
            fillColor: statusColors[drone.status],
            fillOpacity: 0.15,
            weight: 1,
          }}
        />
      ))}

      {/* Drone markers */}
      {drones.map((drone) => (
        <Marker
          key={drone.id}
          position={[drone.lat, drone.lng]}
          icon={createDroneIcon(drone.status)}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold text-gray-900">{drone.name} ({drone.id})</div>
              <div className="text-gray-600">
                Status: <span style={{ color: statusColors[drone.status] }}>{drone.status}</span>
              </div>
              <div className="text-gray-600">Battery: {drone.battery}%</div>
              <div className="text-gray-600">Speed: {drone.speed} km/h</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Alert marker */}
      {alert && (
        <Marker
          position={[alert.lat, alert.lng]}
          icon={createAlertIcon(alert.severity, isAlertExternal)}
        >
          <Popup>
            <div className="text-sm">
              <div className={`font-bold ${isAlertExternal ? 'text-amber-600' : 'text-red-600'}`}>
                {isAlertExternal ? '⚠ EXTERNAL THREAT' : alert.type.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-gray-600">{alert.description}</div>
              <div className="text-gray-600 mt-1">
                Severity: <span className="font-semibold" style={{ color: isAlertExternal ? '#f59e0b' : severityColors[alert.severity] }}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              {isAlertExternal && (
                <div className="text-amber-600 text-xs mt-1 font-medium">
                  Outside secured perimeter
                </div>
              )}
              {nearestDrone && nearestDrone.status !== 'responding' && (
                <button
                  onClick={() => onDispatch(nearestDrone.id)}
                  className={`mt-2 px-3 py-1 text-white rounded text-xs font-semibold transition-colors ${
                    isAlertExternal
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Dispatch {nearestDrone.name}
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
