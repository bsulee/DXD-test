import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import type { Drone, Alert } from '../data/mockData';
import { geofenceBoundary, statusColors, mapCenter } from '../data/mockData';
import { useBuildings } from '../hooks/useBuildings';
import type { OSMBuilding, OSMRoad } from '../data/fetchOSMBuildings';
import type { SentryTower } from '../data/sentryTowers';

interface DroneScene3DProps {
  drones: Drone[];
  alert: Alert | null;
  onDispatch: (droneId: string) => void;
  sentryTowers: SentryTower[];
}

// Scale factor for converting real-world meters to scene units
const SCENE_SCALE = 0.12;

// Throttled animation helper - runs callback at specified FPS
const useThrottledFrame = (callback: (state: { clock: { elapsedTime: number } }) => void, fps: number = 30) => {
  const lastTime = useRef(0);
  const interval = 1000 / fps;

  useFrame((state) => {
    const now = state.clock.elapsedTime * 1000;
    if (now - lastTime.current >= interval) {
      lastTime.current = now;
      callback(state);
    }
  });
};

// Landing pads for idle drones (on top of buildings)
const landingPads: Record<string, { lat: number; lng: number; buildingHeight: number; buildingName: string }> = {
  'DXD-002': {
    lat: 33.4215,
    lng: -111.9285,
    buildingHeight: 10 * SCENE_SCALE,
    buildingName: 'Fulton Center',
  },
  'DXD-004': {
    lat: 33.4178,
    lng: -111.9361,
    buildingHeight: 10 * SCENE_SCALE,
    buildingName: 'Memorial Union',
  },
};

// Convert lat/lng to 3D coordinates centered on map center
function toXZ(lat: number, lng: number) {
  const centerLat = mapCenter[0];
  const centerLng = mapCenter[1];
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
function useSmoothAltitude(targetAltitude: number, speed: number = 0.08) {
  const [currentAltitude, setCurrentAltitude] = useState(targetAltitude);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAltitude(current => {
        const diff = targetAltitude - current;
        setIsTransitioning(Math.abs(diff) > 0.5);
        if (Math.abs(diff) < 0.1) return targetAltitude;
        return current + diff * speed;
      });
    }, 32); // Reduced from 16ms to 32ms

    return () => clearInterval(interval);
  }, [targetAltitude, speed]);

  return { altitude: currentAltitude, isTransitioning };
}

// Hook for smooth drone position with velocity tracking
function useSmoothPosition(targetLat: number, targetLng: number, speed: number = 0.08) {
  const [smoothPos, setSmoothPos] = useState({ lat: targetLat, lng: targetLng });
  const [velocity, setVelocity] = useState({ x: 0, z: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setSmoothPos(prev => {
        const newLat = lerp(prev.lat, targetLat, speed);
        const newLng = lerp(prev.lng, targetLng, speed);
        setVelocity({
          x: (newLng - prev.lng) * 10000,
          z: (newLat - prev.lat) * 10000,
        });
        return { lat: newLat, lng: newLng };
      });
    }, 32); // Reduced from 16ms to 32ms

    return () => clearInterval(interval);
  }, [targetLat, targetLng, speed]);

  return { smoothPos, velocity };
}

// Drone 3D model - optimized with meshBasicMaterial
const DroneMarker = React.memo(function DroneMarker({
  drone,
  isNearest,
  onClick
}: {
  drone: Drone;
  isNearest: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const { smoothPos, velocity } = useSmoothPosition(drone.lat, drone.lng, 0.08);
  const { x, z } = toXZ(smoothPos.lat, smoothPos.lng);

  const landingPad = landingPads[drone.id];
  const shouldBeLanded = drone.status === 'idle' && landingPad;
  const targetAltitude = shouldBeLanded ? landingPad.buildingHeight + 1 : 15;
  const { altitude: currentAltitude, isTransitioning } = useSmoothAltitude(targetAltitude, 0.06);
  const isLanded = shouldBeLanded && Math.abs(currentAltitude - (landingPad.buildingHeight + 1)) < 0.5;

  const color = isLanded ? '#6b7280' : statusColors[drone.status];

  // Throttled animation at 30fps
  useThrottledFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x = x;
      groupRef.current.position.z = z;

      const hoverOffset = isLanded ? 0 : Math.sin(state.clock.elapsedTime * 2 + drone.id.charCodeAt(4)) * 0.3;
      groupRef.current.position.y = currentAltitude + hoverOffset;

      if (isLanded) {
        groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, 0, 0.1);
        groupRef.current.rotation.z = lerp(groupRef.current.rotation.z, 0, 0.1);
      } else if (!isTransitioning) {
        const tiltX = Math.max(-0.4, Math.min(0.4, velocity.z * 0.15));
        const tiltZ = Math.max(-0.4, Math.min(0.4, -velocity.x * 0.15));
        groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, tiltX, 0.1);
        groupRef.current.rotation.z = lerp(groupRef.current.rotation.z, tiltZ, 0.1);

        if (Math.abs(velocity.x) > 0.05 || Math.abs(velocity.z) > 0.05) {
          const targetHeading = Math.atan2(velocity.x, velocity.z);
          groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, targetHeading, 0.05);
        }
      }
    }
  }, 30);

  return (
    <group ref={groupRef} position={[x, currentAltitude, z]}>
      {/* Drone body - simplified */}
      <mesh onClick={onClick}>
        <cylinderGeometry args={[0.8, 1, 1.5, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Rotor arms - reduced segments */}
      {[[0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]].map(([rx, rz], i) => (
        <mesh key={i} position={[rx, 0.2, rz]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 6]} />
          <meshBasicMaterial color="#333" />
        </mesh>
      ))}

      {/* Rotor blur - visible when flying */}
      {(!isLanded || isTransitioning) && [[0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]].map(([rx, rz], i) => (
        <mesh key={`blur-${i}`} position={[rx, 0.25, rz]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 8]} />
          <meshBasicMaterial color="#888" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Coverage circle on ground */}
      {!isLanded && (
        <mesh position={[0, -currentAltitude + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 4, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
      )}

      {/* Selection indicator */}
      {isNearest && (
        <mesh position={[0, -currentAltitude + 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Status indicator */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.3, 6, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
});

// Simplified Alert Marker
const AlertMarker = React.memo(function AlertMarker({ alert }: { alert: Alert }) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const { x, z } = toXZ(alert.lat, alert.lng);

  useThrottledFrame((state) => {
    if (pulseRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      pulseRef.current.scale.set(scale, scale, scale);
    }
  }, 30);

  return (
    <group position={[x, 0, z]}>
      {/* Simple beam */}
      <mesh position={[0, 25, 0]}>
        <cylinderGeometry args={[0.5, 1, 50, 6]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
      </mesh>

      {/* Floating sphere */}
      <mesh ref={pulseRef} position={[0, 8, 0]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      {/* Ground ring */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 16]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
      </mesh>
    </group>
  );
});

// Simple ground plane
const Ground = React.memo(function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[600, 600]} />
      <meshBasicMaterial color="#3D3D3D" />
    </mesh>
  );
});

// INSTANCED ROADS - renders all road segments efficiently
const OSMRoads = React.memo(function OSMRoads({ roads }: { roads: OSMRoad[] }) {
  // Group road segments by color for instancing
  const roadsByColor = useMemo(() => {
    const groups: Record<string, { x: number; z: number; length: number; angle: number; width: number }[]> = {};

    roads.forEach(road => {
      const points = road.points.map(p => toXZ(p.lat, p.lng));
      const scaledWidth = road.width * SCENE_SCALE;
      const roadColor = road.type === 'primary' ? '#2A2A2A' :
                        road.type === 'secondary' ? '#2F2F2F' :
                        road.type === 'footway' || road.type === 'path' ? '#4A4A4A' :
                        '#3A3A3A';

      if (!groups[roadColor]) groups[roadColor] = [];

      for (let i = 0; i < points.length - 1; i++) {
        const point = points[i];
        const nextPoint = points[i + 1];
        const dx = nextPoint.x - point.x;
        const dz = nextPoint.z - point.z;
        const length = Math.sqrt(dx * dx + dz * dz);

        if (length > 0.1) {  // Skip tiny segments
          groups[roadColor].push({
            x: (point.x + nextPoint.x) / 2,
            z: (point.z + nextPoint.z) / 2,
            length: length + 0.1,
            angle: Math.atan2(dx, dz),
            width: scaledWidth,
          });
        }
      }
    });

    return groups;
  }, [roads]);

  return (
    <group>
      {Object.entries(roadsByColor).map(([color, segments]) => (
        <Instances key={color} limit={segments.length}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={color} />

          {segments.map((seg, i) => (
            <Instance
              key={i}
              position={[seg.x, 0.05, seg.z]}
              rotation={[-Math.PI / 2, 0, seg.angle]}
              scale={[seg.width, seg.length, 1]}
            />
          ))}
        </Instances>
      ))}
    </group>
  );
});

// Geofence - simplified
const Geofence = React.memo(function Geofence() {
  const linePoints: [number, number, number][] = useMemo(() => {
    const points = geofenceBoundary.map(([lat, lng]) => {
      const { x, z } = toXZ(lat, lng);
      return [x, 2, z] as [number, number, number];
    });
    points.push(points[0]);
    return points;
  }, []);

  const posts = useMemo(() => {
    return geofenceBoundary.map(([lat, lng], i) => {
      const { x, z } = toXZ(lat, lng);
      return { x, z, key: i };
    });
  }, []);

  return (
    <group>
      <Line points={linePoints} color="#ff3333" lineWidth={2} />

      {posts.map(({ x, z, key }) => (
        <mesh key={key} position={[x, 5, z]}>
          <cylinderGeometry args={[0.3, 0.3, 10, 6]} />
          <meshBasicMaterial color="#ff3333" />
        </mesh>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[
          Math.abs(toXZ(0, geofenceBoundary[0][1]).x - toXZ(0, geofenceBoundary[1][1]).x),
          Math.abs(toXZ(geofenceBoundary[0][0], 0).z - toXZ(geofenceBoundary[2][0], 0).z)
        ]} />
        <meshBasicMaterial color="#ff3333" transparent opacity={0.03} />
      </mesh>
    </group>
  );
});

// INSTANCED BUILDINGS - renders all buildings in ~10-15 draw calls instead of 879
const InstancedBuildings = React.memo(function InstancedBuildings({
  buildings
}: {
  buildings: OSMBuilding[];
}) {
  // Group buildings by color for efficient instancing
  const buildingsByColor = useMemo(() => {
    const groups: Record<string, OSMBuilding[]> = {};
    buildings.forEach(b => {
      if (!groups[b.color]) groups[b.color] = [];
      groups[b.color].push(b);
    });
    return groups;
  }, [buildings]);

  return (
    <group>
      {Object.entries(buildingsByColor).map(([color, colorBuildings]) => (
        <Instances key={color} limit={colorBuildings.length}>
          <boxGeometry />
          <meshBasicMaterial color={color} />

          {colorBuildings.map(building => {
            const { x, z } = toXZ(building.lat, building.lng);
            const width = Math.max(building.width * SCENE_SCALE, 1);
            const depth = Math.max(building.depth * SCENE_SCALE, 1);
            const heightVar = 1 + (building.id % 10) * 0.02;
            const height = Math.max(building.height * SCENE_SCALE * heightVar, 0.5);

            return (
              <Instance
                key={building.id}
                position={[x, height / 2, z]}
                scale={[width, height, depth]}
              />
            );
          })}
        </Instances>
      ))}
    </group>
  );
});

// Simplified Sentry Tower
const SentryTowerMesh = React.memo(function SentryTowerMesh({ tower }: { tower: SentryTower }) {
  const cameraHeadRef = useRef<THREE.Group>(null);
  const { x, z } = toXZ(tower.position.lat, tower.position.lng);

  const towerHeight = tower.type === 'elevated' ? 8 : 5;
  const detectionRadiusScaled = tower.detectionRadius * SCENE_SCALE;

  const statusColor = tower.status === 'alert' ? '#ff0000' :
                      tower.status === 'active' ? '#00ff00' : '#666666';

  useThrottledFrame((state) => {
    if (cameraHeadRef.current) {
      cameraHeadRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.8;
    }
  }, 20);

  return (
    <group position={[x, 0, z]}>
      {/* Base */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1, 1.2, 0.6, 6]} />
        <meshBasicMaterial color="#444444" />
      </mesh>

      {/* Pole */}
      <mesh position={[0, towerHeight / 2, 0]}>
        <cylinderGeometry args={[0.2, 0.3, towerHeight, 6]} />
        <meshBasicMaterial color="#666666" />
      </mesh>

      {/* Platform */}
      <mesh position={[0, towerHeight, 0]}>
        <boxGeometry args={[1.2, 0.3, 1.2]} />
        <meshBasicMaterial color="#333333" />
      </mesh>

      {/* Camera head */}
      <group ref={cameraHeadRef} position={[0, towerHeight + 0.6, 0]}>
        <mesh position={[0, 0, 0.3]}>
          <boxGeometry args={[0.6, 0.5, 0.9]} />
          <meshBasicMaterial color="#222222" />
        </mesh>
        <mesh position={[0, 0, 0.91]}>
          <circleGeometry args={[0.15, 8]} />
          <meshBasicMaterial color="#4444ff" />
        </mesh>
      </group>

      {/* Status light */}
      <mesh position={[0, towerHeight + 1.2, 0]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Detection radius ring */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[detectionRadiusScaled - 0.3, detectionRadiusScaled, 24]} />
        <meshBasicMaterial color={statusColor} transparent opacity={tower.status === 'alert' ? 0.4 : 0.2} />
      </mesh>
    </group>
  );
});

// Main component
export default function DroneScene3D({
  drones,
  alert,
  onDispatch,
  sentryTowers
}: DroneScene3DProps) {
  const { buildings, roads, isLoading, source } = useBuildings();

  const nearestDroneId = useMemo(() => {
    if (!alert) return null;
    const availableDrones = drones.filter(d => d.status !== 'responding');
    if (availableDrones.length === 0) return null;

    const nearest = availableDrones.reduce((nearest, drone) => {
      const currentDist = Math.pow(drone.lat - alert.lat, 2) + Math.pow(drone.lng - alert.lng, 2);
      const nearestDist = Math.pow(nearest.lat - alert.lat, 2) + Math.pow(nearest.lng - alert.lng, 2);
      return currentDist < nearestDist ? drone : nearest;
    });
    return nearest.id;
  }, [alert, drones]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded z-10 text-sm">
          Loading campus data...
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
        {source}: {buildings.length} buildings, {roads.length} roads
      </div>

      <Canvas
        camera={{ position: [0, 150, 180], fov: 45 }}
        dpr={1}
        gl={{
          antialias: false,
          powerPreference: 'high-performance'
        }}
        performance={{ min: 0.5 }}
      >
        {/* Minimal lighting - meshBasicMaterial doesn't need complex lighting */}
        <ambientLight intensity={0.8} />

        {/* Simplified grid */}
        <gridHelper args={[400, 30, '#3A3A3A', '#3A3A3A']} position={[0, -0.4, 0]} />

        {/* Scene elements */}
        <Ground />
        <OSMRoads roads={roads} />
        <Geofence />
        <InstancedBuildings buildings={buildings} />

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
        {alert && <AlertMarker alert={alert} />}

        {/* Camera controls */}
        <OrbitControls
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 8}
          minDistance={50}
          maxDistance={400}
          enablePan={true}
          panSpeed={0.5}
          rotateSpeed={0.5}
          enableDamping={true}
          dampingFactor={0.05}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
