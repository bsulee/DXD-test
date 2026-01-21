import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Drone, Alert } from '../data/mockData';
import { geofenceBoundary, statusColors, mapCenter } from '../data/mockData';

interface DroneScene3DProps {
  drones: Drone[];
  alert: Alert | null;
  onDispatch: (droneId: string) => void;
}

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

// Drone 3D model (hexagonal prism shape like the 2D icon)
function DroneMarker({
  drone,
  isNearest,
  onClick
}: {
  drone: Drone;
  isNearest: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { x, z } = toXZ(drone.lat, drone.lng);
  const color = statusColors[drone.status];

  // Gentle hover animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 3 + Math.sin(state.clock.elapsedTime * 2 + drone.id.charCodeAt(4)) * 0.3;
      // Rotate slowly
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Drone body - hexagonal shape */}
      <mesh ref={meshRef} onClick={onClick}>
        <cylinderGeometry args={[0.8, 1, 1.5, 6]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Center light */}
      <pointLight position={[0, 3, 0]} color={color} intensity={2} distance={8} />

      {/* Coverage circle on ground */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 4, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Selection/nearest indicator */}
      {isNearest && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Drone name label (simple indicator) */}
      <mesh position={[0, 5.5, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// Alert marker (pulsing red sphere)
function AlertMarker({ alert }: { alert: Alert }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { x, z } = toXZ(alert.lat, alert.lng);

  // Pulse animation
  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      meshRef.current.scale.set(scale, scale, scale);
    }
    if (ringRef.current) {
      const ringScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
      ringRef.current.scale.set(ringScale, ringScale, 1);
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Alert sphere */}
      <mesh ref={meshRef} position={[0, 2, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#dc2626"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Alert light */}
      <pointLight position={[0, 2, 0]} color="#dc2626" intensity={5} distance={20} />

      {/* Pulsing ground ring */}
      <mesh ref={ringRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 4, 32]} />
        <meshBasicMaterial color="#dc2626" transparent opacity={0.5} />
      </mesh>

      {/* Inner ground circle */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshBasicMaterial color="#dc2626" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// Ground plane with satellite texture (or fallback color)
function Ground() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/asu-campus.jpg',
      (loadedTexture) => {
        loadedTexture.anisotropy = 16;
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        console.log('Satellite texture not found, using fallback color');
      }
    );
  }, []);

  return (
    <>
      {/* Main ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        {texture ? (
          <meshStandardMaterial map={texture} />
        ) : (
          <meshStandardMaterial color="#1a472a" />
        )}
      </mesh>
      {/* Grid overlay - only show if no texture */}
      {!texture && (
        <gridHelper
          args={[200, 50, '#1a3a1a', '#152515']}
          position={[0, 0.02, 0]}
        />
      )}
    </>
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
        camera={{ position: [0, 50, 50], fov: 50 }}
        style={{ background: '#050a05' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[30, 50, 30]} intensity={0.6} />
        <directionalLight position={[-20, 30, -20]} intensity={0.3} color="#4080ff" />

        {/* Fog for atmosphere */}
        <fog attach="fog" args={['#050a05', 60, 150]} />

        {/* Scene elements */}
        <Ground />
        <Geofence />

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
