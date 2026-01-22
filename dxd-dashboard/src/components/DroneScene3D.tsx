import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Drone, Alert } from '../data/mockData';
import { geofenceBoundary, statusColors, mapCenter } from '../data/mockData';
import { useBuildings } from '../hooks/useBuildings';
import type { OSMBuilding } from '../data/fetchOSMBuildings';
import type { SentryTower } from '../data/sentryTowers';

interface DroneScene3DProps {
  drones: Drone[];
  alert: Alert | null;
  onDispatch: (droneId: string) => void;
  sentryTowers: SentryTower[];
}

// Scale factor for converting real-world meters to scene units
const SCENE_SCALE = 0.12;

// Landing pads for idle drones (on top of buildings)
const landingPads: Record<string, { lat: number; lng: number; buildingHeight: number; buildingName: string }> = {
  'DXD-002': {
    lat: 33.4197,
    lng: -111.9342,
    buildingHeight: 12 * SCENE_SCALE, // Hayden Library
    buildingName: 'Hayden Library',
  },
  'DXD-004': {
    lat: 33.4178,
    lng: -111.9362,
    buildingHeight: 10 * SCENE_SCALE, // Memorial Union
    buildingName: 'Memorial Union',
  },
};

// Convert lat/lng to 3D coordinates centered on map center
function toXZ(lat: number, lng: number) {
  const centerLat = mapCenter[0];
  const centerLng = mapCenter[1];

  // More accurate conversion using meters
  const latToMeters = 111000;
  const lonToMeters = 111000 * Math.cos(centerLat * Math.PI / 180);

  return {
    x: (lng - centerLng) * lonToMeters * SCENE_SCALE,
    z: -(lat - centerLat) * latToMeters * SCENE_SCALE,
  };
}

// Smooth interpolation helper
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// Hook for smooth altitude transitions (takeoff/landing)
function useSmoothAltitude(
  targetAltitude: number,
  speed: number = 0.08
): { altitude: number; isTransitioning: boolean } {
  const [currentAltitude, setCurrentAltitude] = useState(targetAltitude);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAltitude(current => {
        const diff = targetAltitude - current;
        const transitioning = Math.abs(diff) > 0.5;
        setIsTransitioning(transitioning);

        if (Math.abs(diff) < 0.1) return targetAltitude;
        return current + diff * speed;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [targetAltitude, speed]);

  return { altitude: currentAltitude, isTransitioning };
}

// Hook for smooth drone position with velocity tracking
function useSmoothPosition(
  targetLat: number,
  targetLng: number,
  speed: number = 0.08
) {
  const [smoothPos, setSmoothPos] = useState({ lat: targetLat, lng: targetLng });
  const [velocity, setVelocity] = useState({ x: 0, z: 0 });
  const prevPosRef = useRef({ lat: targetLat, lng: targetLng });

  useEffect(() => {
    const interval = setInterval(() => {
      setSmoothPos(prev => {
        const newLat = lerp(prev.lat, targetLat, speed);
        const newLng = lerp(prev.lng, targetLng, speed);

        // Calculate velocity for tilt effect
        setVelocity({
          x: (newLng - prev.lng) * 10000,
          z: (newLat - prev.lat) * 10000,
        });

        prevPosRef.current = { lat: newLat, lng: newLng };
        return { lat: newLat, lng: newLng };
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [targetLat, targetLng, speed]);

  return { smoothPos, velocity };
}

// Drone 3D model with smooth movement, takeoff/landing, and physics-based tilt
function DroneMarker({
  drone,
  isNearest,
  onClick
}: {
  drone: Drone;
  isNearest: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  // Smooth position interpolation
  const { smoothPos, velocity } = useSmoothPosition(
    drone.lat,
    drone.lng,
    0.08
  );

  const { x, z } = toXZ(smoothPos.lat, smoothPos.lng);

  // Check if drone should be landed on a building
  const landingPad = landingPads[drone.id];
  const shouldBeLanded = drone.status === 'idle' && landingPad;

  // Target altitude based on status
  const targetAltitude = shouldBeLanded
    ? landingPad.buildingHeight + 1  // On rooftop
    : 15;                             // Flying height

  // Smooth altitude transition for takeoff/landing
  const { altitude: currentAltitude, isTransitioning } = useSmoothAltitude(targetAltitude, 0.06);

  // Is actually on the ground (within 0.5 of landing height)?
  const isLanded = shouldBeLanded && Math.abs(currentAltitude - (landingPad.buildingHeight + 1)) < 0.5;

  // Color based on status
  const color = isLanded
    ? '#6b7280'
    : statusColors[drone.status];

  // Animation frame for hover and tilt
  useFrame((state) => {
    if (groupRef.current) {
      // Update horizontal position smoothly
      groupRef.current.position.x = x;
      groupRef.current.position.z = z;

      // Update vertical position with smooth altitude + hover
      const hoverOffset = isLanded ? 0 : Math.sin(state.clock.elapsedTime * 2 + drone.id.charCodeAt(4)) * 0.3;
      groupRef.current.position.y = currentAltitude + hoverOffset;

      if (isLanded) {
        // Landed on building: no tilt
        groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, 0, 0.1);
        groupRef.current.rotation.z = lerp(groupRef.current.rotation.z, 0, 0.1);
        groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, 0, 0.05);
      } else if (isTransitioning) {
        // Taking off or landing: slight wobble, level out
        groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, 0, 0.1) + Math.sin(state.clock.elapsedTime * 8) * 0.03;
        groupRef.current.rotation.z = lerp(groupRef.current.rotation.z, 0, 0.1) + Math.cos(state.clock.elapsedTime * 8) * 0.03;
      } else {
        // Flying: tilt based on velocity (lean into movement)
        const tiltX = velocity.z * 0.15;
        const tiltZ = -velocity.x * 0.15;

        // Clamp tilt to reasonable values
        const maxTilt = 0.4;
        const clampedTiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX));
        const clampedTiltZ = Math.max(-maxTilt, Math.min(maxTilt, tiltZ));

        // Smooth tilt transition
        groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, clampedTiltX, 0.1);
        groupRef.current.rotation.z = lerp(groupRef.current.rotation.z, clampedTiltZ, 0.1);

        // Face direction of travel (if moving significantly)
        if (Math.abs(velocity.x) > 0.05 || Math.abs(velocity.z) > 0.05) {
          const targetHeading = Math.atan2(velocity.x, velocity.z);
          groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, targetHeading, 0.05);
        }
      }
    }

    // Slow rotation for the body when stationary and flying
    if (bodyRef.current && !isLanded && !isTransitioning && Math.abs(velocity.x) < 0.05 && Math.abs(velocity.z) < 0.05) {
      bodyRef.current.rotation.y += 0.01;
    }
  });

  // Distance from ground for ground-based effects
  const distanceFromGround = currentAltitude;

  return (
    <group ref={groupRef} position={[x, currentAltitude, z]}>
      {/* Drone body - hexagonal shape */}
      <mesh ref={bodyRef} onClick={onClick}>
        <cylinderGeometry args={[0.8, 1, 1.5, 6]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Rotor arms - 4 small cylinders */}
      {[[0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]].map(([rx, rz], i) => (
        <mesh key={i} position={[rx, 0.2, rz]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 8]} />
          <meshStandardMaterial color="#333" metalness={0.5} />
        </mesh>
      ))}

      {/* Rotor blur effect - visible when flying or transitioning */}
      {(!isLanded || isTransitioning) && [[0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]].map(([rx, rz], i) => (
        <mesh key={`blur-${i}`} position={[rx, 0.25, rz]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 16]} />
          <meshBasicMaterial color="#888" transparent opacity={isTransitioning ? 0.5 : 0.3} />
        </mesh>
      ))}

      {/* Center light */}
      <pointLight position={[0, 0, 0]} color={color} intensity={2} distance={8} />

      {/* Coverage circle on ground - only for flying drones, scaled by altitude */}
      {!isLanded && (
        <mesh position={[0, -distanceFromGround + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 4, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
      )}

      {/* Selection/nearest indicator */}
      {isNearest && (
        <mesh position={[0, -distanceFromGround + 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Drone status indicator above */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Landing pad indicator - always on the building for drones with landing pads */}
      {landingPad && (
        <mesh position={[0, landingPad.buildingHeight + 0.15 - currentAltitude, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.2, 16]} />
          <meshBasicMaterial color={isLanded ? '#444' : '#666'} transparent opacity={isLanded ? 0.8 : 0.4} />
        </mesh>
      )}
    </group>
  );
}

// Alert marker with light beam that goes above buildings
function AlertMarker({ alert, buildings }: { alert: Alert; buildings: OSMBuilding[] }) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { x, z } = toXZ(alert.lat, alert.lng);

  // Find if alert is near a building to position above it
  const nearbyBuilding = buildings.find(b => {
    const dist = Math.sqrt(
      Math.pow(b.lat - alert.lat, 2) +
      Math.pow(b.lng - alert.lng, 2)
    );
    return dist < 0.0003;
  });

  const alertHeight = nearbyBuilding ? nearbyBuilding.height * SCENE_SCALE + 3 : 5;

  // Pulse animation
  useFrame((state) => {
    if (pulseRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      pulseRef.current.scale.set(scale, scale, scale);
    }
    if (beamRef.current) {
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
    if (ringRef.current) {
      const ringScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
      ringRef.current.scale.set(ringScale, ringScale, 1);
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Vertical light beam from ground to sky */}
      <mesh ref={beamRef} position={[0, 25, 0]}>
        <cylinderGeometry args={[0.5, 2, 50, 8]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.4} />
      </mesh>

      {/* Floating alert sphere above building */}
      <mesh ref={pulseRef} position={[0, alertHeight, 0]}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Alert light */}
      <pointLight position={[0, alertHeight, 0]} color="#ff0000" intensity={8} distance={30} />

      {/* Ground ring */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 32]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.6} />
      </mesh>

      {/* Pulsing outer ring */}
      <mesh ref={ringRef} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5, 7, 32]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Stylized campus ground with walkways, roads, and grass
function Ground() {
  return (
    <group>
      {/* Base ground - campus grass green */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#4a6741" />
      </mesh>

      {/* North-South walkways */}
      {[-60, -30, 0, 30, 60].map((xPos, i) => (
        <mesh key={`ns-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[xPos, 0.01, 0]}>
          <planeGeometry args={[2.5, 200]} />
          <meshStandardMaterial color="#c4b5a0" />
        </mesh>
      ))}

      {/* East-West walkways */}
      {[-60, -30, 0, 30, 60].map((zPos, i) => (
        <mesh key={`ew-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, zPos]}>
          <planeGeometry args={[200, 2.5]} />
          <meshStandardMaterial color="#c4b5a0" />
        </mesh>
      ))}

      {/* Main perimeter roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 90]}>
        <planeGeometry args={[200, 5]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -90]}>
        <planeGeometry args={[200, 5]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[90, 0.02, 0]}>
        <planeGeometry args={[5, 180]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-90, 0.02, 0]}>
        <planeGeometry args={[5, 180]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Grass quad areas between buildings */}
      {[
        { x: -45, z: -45 },
        { x: 45, z: -45 },
        { x: -45, z: 45 },
        { x: 45, z: 45 },
        { x: 0, z: 0 },
        { x: -15, z: 15 },
        { x: 15, z: -15 },
      ].map((pos, i) => (
        <mesh key={`quad-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[pos.x, 0.015, pos.z]}>
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial color="#5a7a51" />
        </mesh>
      ))}

      {/* Plaza areas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0.02, -45]}>
        <planeGeometry args={[25, 20]} />
        <meshStandardMaterial color="#b8a892" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, 0.02, 30]}>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial color="#b8a892" />
      </mesh>
    </group>
  );
}

// Geofence boundary visualization
function Geofence() {
  // Create points for the boundary line
  const linePoints: [number, number, number][] = geofenceBoundary.map(([lat, lng]) => {
    const { x, z } = toXZ(lat, lng);
    return [x, 0.3, z] as [number, number, number];
  });
  // Close the loop
  const firstPoint = linePoints[0];
  linePoints.push(firstPoint);

  // Create vertical posts at corners
  const posts = geofenceBoundary.map(([lat, lng], i) => {
    const { x, z } = toXZ(lat, lng);
    return (
      <mesh key={i} position={[x, 2, z]}>
        <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
        <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
      </mesh>
    );
  });

  return (
    <group>
      {/* Boundary line using drei Line */}
      <Line
        points={linePoints}
        color="#dc2626"
        lineWidth={2}
      />

      {/* Corner posts */}
      {posts}

      {/* Ground fill for geofence area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[
          Math.abs(toXZ(0, geofenceBoundary[0][1]).x - toXZ(0, geofenceBoundary[1][1]).x),
          Math.abs(toXZ(geofenceBoundary[0][0], 0).z - toXZ(geofenceBoundary[2][0], 0).z)
        ]} />
        <meshBasicMaterial color="#dc2626" transparent opacity={0.05} />
      </mesh>
    </group>
  );
}

// OSM Building mesh component with alert highlighting
function OSMBuildingMesh({ building, isAlertActive }: { building: OSMBuilding; isAlertActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { x, z } = toXZ(building.lat, building.lng);

  // Scale building dimensions
  const width = building.width * SCENE_SCALE;
  const depth = building.depth * SCENE_SCALE;
  const height = building.height * SCENE_SCALE;

  // Pulse effect when alert is active at this building
  useFrame((state) => {
    if (meshRef.current && isAlertActive) {
      const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.5;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[x, height / 2, z]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color={isAlertActive ? '#ff4444' : building.color}
        emissive={isAlertActive ? '#ff0000' : '#000000'}
        emissiveIntensity={isAlertActive ? 0.5 : 0}
      />
    </mesh>
  );
}

// Campus buildings group with OSM data
function CampusBuildings({
  buildings,
  currentAlert
}: {
  buildings: OSMBuilding[];
  currentAlert: Alert | null;
}) {
  return (
    <group>
      {buildings.map(building => {
        // Check if this building has an active alert
        const isAlertActive = currentAlert &&
          Math.sqrt(
            Math.pow(building.lat - currentAlert.lat, 2) +
            Math.pow(building.lng - currentAlert.lng, 2)
          ) < 0.0003;

        return (
          <OSMBuildingMesh
            key={building.id}
            building={building}
            isAlertActive={!!isAlertActive}
          />
        );
      })}
    </group>
  );
}

// Sentry Tower 3D component
function SentryTowerMesh({ tower }: { tower: SentryTower }) {
  const groupRef = useRef<THREE.Group>(null);
  const cameraHeadRef = useRef<THREE.Group>(null);
  const { x, z } = toXZ(tower.position.lat, tower.position.lng);

  const towerHeight = tower.type === 'elevated' ? 8 : 5;
  const detectionRadiusScaled = tower.detectionRadius * SCENE_SCALE;

  // Rotation animation for the camera head
  useFrame((state) => {
    if (cameraHeadRef.current) {
      cameraHeadRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.8;
    }
  });

  // Color based on status
  const statusColor = tower.status === 'alert'
    ? '#ff0000'
    : tower.status === 'active'
      ? '#00ff00'
      : '#666666';

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      {/* Tower base */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1, 1.2, 0.6, 8]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Tower pole */}
      <mesh position={[0, towerHeight / 2, 0]}>
        <cylinderGeometry args={[0.2, 0.3, towerHeight, 8]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* Camera platform */}
      <mesh position={[0, towerHeight, 0]}>
        <boxGeometry args={[1.2, 0.3, 1.2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Camera head (rotates) */}
      <group ref={cameraHeadRef} position={[0, towerHeight + 0.6, 0]}>
        {/* Camera body */}
        <mesh position={[0, 0, 0.3]}>
          <boxGeometry args={[0.6, 0.5, 0.9]} />
          <meshStandardMaterial color="#222222" />
        </mesh>

        {/* Camera lens */}
        <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>

        {/* Lens glass */}
        <mesh position={[0, 0, 0.91]}>
          <circleGeometry args={[0.15, 16]} />
          <meshStandardMaterial color="#4444ff" emissive="#4444ff" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Status light */}
      <mesh position={[0, towerHeight + 1.2, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={tower.status === 'alert' ? 1.5 : 0.8}
        />
      </mesh>
      <pointLight
        position={[0, towerHeight + 1.2, 0]}
        color={statusColor}
        intensity={tower.status === 'alert' ? 3 : 1}
        distance={5}
      />

      {/* Detection radius visualization (ground ring) */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[detectionRadiusScaled - 0.3, detectionRadiusScaled, 64]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={tower.status === 'alert' ? 0.4 : 0.2}
        />
      </mesh>

      {/* Detection radius fill */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[detectionRadiusScaled, 64]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={tower.status === 'alert' ? 0.1 : 0.03}
        />
      </mesh>
    </group>
  );
}

// Main component
export default function DroneScene3D({
  drones,
  alert,
  onDispatch,
  sentryTowers
}: DroneScene3DProps) {
  // Load buildings from OSM with fallback
  const { buildings, isLoading, source } = useBuildings();

  // Find nearest available drone to alert
  const findNearestDroneId = (): string | null => {
    if (!alert) return null;

    const availableDrones = drones.filter(d => d.status !== 'responding');
    if (availableDrones.length === 0) return null;

    const nearest = availableDrones.reduce((nearest, drone) => {
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

    return nearest.id;
  };

  const nearestDroneId = findNearestDroneId();

  return (
    <div className="w-full h-full relative">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded z-10 text-sm">
          Loading campus data...
        </div>
      )}

      {/* Data source indicator */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
        Buildings: {source} ({buildings.length})
      </div>

      <Canvas
        camera={{ position: [0, 60, 80], fov: 50 }}
        style={{ background: '#1a1a2e' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[50, 100, 50]}
          intensity={1}
          castShadow
        />
        <directionalLight position={[-30, 50, -30]} intensity={0.3} />
        <hemisphereLight args={['#87CEEB', '#4a6741', 0.3]} />

        {/* Fog for atmosphere */}
        <fog attach="fog" args={['#1a1a2e', 60, 180]} />

        {/* Scene elements */}
        <Ground />
        <Geofence />
        <CampusBuildings buildings={buildings} currentAlert={alert} />

        {/* Sentry Towers */}
        {sentryTowers.map(tower => (
          <SentryTowerMesh key={tower.id} tower={tower} />
        ))}

        {/* Drones */}
        {drones.map(drone => (
          <DroneMarker
            key={drone.id}
            drone={drone}
            isNearest={alert !== null && drone.id === nearestDroneId && drone.status !== 'responding'}
            onClick={() => {
              if (alert && drone.status !== 'responding') {
                onDispatch(drone.id);
              }
            }}
          />
        ))}

        {/* Alert */}
        {alert && <AlertMarker alert={alert} buildings={buildings} />}

        {/* Camera controls */}
        <OrbitControls
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          minDistance={15}
          maxDistance={150}
          enablePan={true}
          panSpeed={0.5}
          rotateSpeed={0.5}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
