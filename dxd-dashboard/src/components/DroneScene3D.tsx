import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Drone, Alert } from '../data/mockData';
import { geofenceBoundary, statusColors, mapCenter } from '../data/mockData';
import { campusBuildings } from '../data/buildings';
import type { Building } from '../data/buildings';

interface DroneScene3DProps {
  drones: Drone[];
  alert: Alert | null;
  onDispatch: (droneId: string) => void;
}

// Landing pads for idle drones (on top of buildings) - updated to new campus positions
const landingPads: Record<string, { lat: number; lng: number; buildingHeight: number; buildingName: string }> = {
  'DXD-002': {
    lat: 33.4197,      // Hayden Library position
    lng: -111.9342,
    buildingHeight: 8,
    buildingName: 'Hayden Library',
  },
  'DXD-004': {
    lat: 33.4178,      // Memorial Union position
    lng: -111.9362,
    buildingHeight: 6,
    buildingName: 'Memorial Union',
  },
};

// Convert lat/lng to 3D coordinates centered on map center
function toXZ(lat: number, lng: number) {
  const centerLat = mapCenter[0];
  const centerLng = mapCenter[1];
  const scale = 8000;
  return {
    x: (lng - centerLng) * scale,
    z: -(lat - centerLat) * scale, // Negative so north is "forward"
  };
}

// Smooth interpolation helper
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
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

// Drone 3D model with smooth movement and physics-based tilt
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
  const isLanded = drone.status === 'idle' && landingPad;

  // Color based on status - gray when landed
  const color = isLanded
    ? '#6b7280'
    : statusColors[drone.status];

  // Animation frame for hover and tilt
  useFrame((state) => {
    if (groupRef.current) {
      // Update position smoothly
      groupRef.current.position.x = x;
      groupRef.current.position.z = z;

      if (isLanded) {
        // Landed on building: no hover, no tilt, sitting on rooftop
        groupRef.current.position.y = landingPad.buildingHeight + 1;
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.z = 0;
        groupRef.current.rotation.y = 0;
      } else {
        // Flying: hover animation and tilt
        groupRef.current.position.y = 12 + Math.sin(state.clock.elapsedTime * 2 + drone.id.charCodeAt(4)) * 0.3;

        // Tilt based on velocity (lean into movement)
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
    if (bodyRef.current && !isLanded && Math.abs(velocity.x) < 0.05 && Math.abs(velocity.z) < 0.05) {
      bodyRef.current.rotation.y += 0.01;
    }
  });

  const initialY = isLanded ? landingPad.buildingHeight + 1 : 12;

  return (
    <group ref={groupRef} position={[x, initialY, z]}>
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

      {/* Center light */}
      <pointLight position={[0, 0, 0]} color={color} intensity={2} distance={8} />

      {/* Coverage circle on ground - only for flying drones */}
      {!isLanded && (
        <mesh position={[0, -11.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 4, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
      )}

      {/* Selection/nearest indicator */}
      {isNearest && (
        <mesh position={[0, isLanded ? -landingPad.buildingHeight : -11.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Drone status indicator above */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Landing pad indicator for grounded drones */}
      {isLanded && (
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[1, 1, 0.1, 16]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      )}
    </group>
  );
}

// Alert marker with light beam that goes above buildings
function AlertMarker({ alert }: { alert: Alert }) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { x, z } = toXZ(alert.lat, alert.lng);

  // Find if alert is near a building to position above it
  const nearbyBuilding = campusBuildings.find(b => {
    const dist = Math.sqrt(
      Math.pow(b.position.lat - alert.lat, 2) +
      Math.pow(b.position.lng - alert.lng, 2)
    );
    return dist < 0.0008;
  });

  const alertHeight = nearbyBuilding ? nearbyBuilding.height + 5 : 8;

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

// Ground plane with better contrast
function Ground() {
  return (
    <group>
      {/* Main ground plane - lighter color for contrast */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#3d5c3d" />
      </mesh>

      {/* Subtle grid for reference */}
      <gridHelper
        args={[300, 60, '#4a6b4a', '#4a6b4a']}
        position={[0, 0.01, 0]}
      />

      {/* Main roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[4, 300]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[300, 4]} />
        <meshStandardMaterial color="#555555" />
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

// Building mesh component with alert highlighting
function BuildingMesh({ building, isAlertActive }: { building: Building; isAlertActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { x, z } = toXZ(building.position.lat, building.position.lng);

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
      position={[x, building.height / 2, z]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[building.width, building.height, building.depth]} />
      <meshStandardMaterial
        color={isAlertActive ? '#ff4444' : building.color}
        emissive={isAlertActive ? '#ff0000' : '#000000'}
        emissiveIntensity={isAlertActive ? 0.5 : 0}
      />
    </mesh>
  );
}

// Campus buildings group with alert checking
function CampusBuildings({ currentAlert }: { currentAlert: Alert | null }) {
  return (
    <group>
      {campusBuildings.map(building => {
        // Check if this building has an active alert
        const isAlertActive = currentAlert &&
          Math.sqrt(
            Math.pow(building.position.lat - currentAlert.lat, 2) +
            Math.pow(building.position.lng - currentAlert.lng, 2)
          ) < 0.0008;

        return (
          <BuildingMesh
            key={building.id}
            building={building}
            isAlertActive={!!isAlertActive}
          />
        );
      })}
    </group>
  );
}

// Main component
export default function DroneScene3D({
  drones,
  alert,
  onDispatch
}: DroneScene3DProps) {
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
      <Canvas
        camera={{ position: [0, 80, 100], fov: 50 }}
        style={{ background: '#1a1a2e' }}
      >
        {/* Better lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[50, 100, 50]}
          intensity={1}
          castShadow
        />
        <directionalLight position={[-30, 50, -30]} intensity={0.3} />
        <hemisphereLight args={['#87CEEB', '#3d5c3d', 0.3]} />

        {/* Fog for atmosphere - adjusted for larger view */}
        <fog attach="fog" args={['#1a1a2e', 80, 200]} />

        {/* Scene elements */}
        <Ground />
        <Geofence />
        <CampusBuildings currentAlert={alert} />

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
          minDistance={20}
          maxDistance={100}
          enablePan={true}
          panSpeed={0.5}
          rotateSpeed={0.5}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
