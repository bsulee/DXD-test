import { useState, useEffect, useRef, useCallback } from 'react';
import DroneMap from './components/DroneMap';
import StatusPanel from './components/StatusPanel';
import ActivityLog from './components/ActivityLog';
import MetricsBar from './components/MetricsBar';
import type { Drone, Alert, LogEntry } from './data/mockData';
import { initialDrones, scriptedAlert } from './data/mockData';

interface Metrics {
  activeDrones: number;
  totalDrones: number;
  avgResponseTime: number;
  responseTimes: number[];
  alertsToday: number;
  coveragePercent: number;
}

function App() {
  // State for drones and alert
  const [drones, setDrones] = useState<Drone[]>(initialDrones);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [respondingDroneId, setRespondingDroneId] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [droneArrived, setDroneArrived] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'en_route' | 'on_scene'>('idle');
  const [metrics, setMetrics] = useState<Metrics>({
    activeDrones: initialDrones.filter(d => d.status !== 'idle').length,
    totalDrones: initialDrones.length,
    avgResponseTime: 0,
    responseTimes: [],
    alertsToday: Math.floor(Math.random() * 3) + 4, // Start with random 4-6
    coveragePercent: 98,
  });
  const [responseTimeFlash, setResponseTimeFlash] = useState(false);
  const dispatchStartTime = useRef<number | null>(null);

  // Track initial positions for patrol patterns
  const initialPositions = useRef(
    initialDrones.reduce((acc, drone) => {
      acc[drone.id] = { lat: drone.lat, lng: drone.lng };
      return acc;
    }, {} as Record<string, { lat: number; lng: number }>)
  );

  // Add log entry helper
  const addLogEntry = useCallback((type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
    };
    setLogEntries(prev => [...prev, entry]);
  }, []);

  // System online log on mount
  useEffect(() => {
    const activeDrones = initialDrones.filter(d => d.status !== 'idle').length;
    addLogEntry('system', `System online - ${activeDrones} drones active`);
  }, [addLogEntry]);

  // Show alert after 5 seconds
  useEffect(() => {
    const alertTimer = setTimeout(() => {
      setAlert({ ...scriptedAlert, timestamp: new Date() });
      addLogEntry('alert', '⚠ ALERT: Perimeter breach detected - Eastern sector');
      // Increment alerts today
      setMetrics(prev => ({ ...prev, alertsToday: prev.alertsToday + 1 }));
    }, 5000);

    return () => clearTimeout(alertTimer);
  }, [addLogEntry]);

  // Patrol logging every 10 seconds
  useEffect(() => {
    const patrolLogInterval = setInterval(() => {
      setDrones(currentDrones => {
        const patrollingDrones = currentDrones.filter(d => d.status === 'patrolling');
        if (patrollingDrones.length > 0) {
          // Pick a random patrolling drone to log
          const drone = patrollingDrones[Math.floor(Math.random() * patrollingDrones.length)];
          addLogEntry('patrol', `${drone.id} patrolling - ${drone.sector}`);
        }
        return currentDrones;
      });
    }, 10000);

    return () => clearInterval(patrolLogInterval);
  }, [addLogEntry]);

  // Drone movement simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now() / 1000;

      setDrones(prevDrones =>
        prevDrones.map(drone => {
          // If this drone is responding to an alert
          if (drone.status === 'responding' && alert) {
            const targetLat = alert.lat;
            const targetLng = alert.lng;

            // Calculate direction to target
            const dLat = targetLat - drone.lat;
            const dLng = targetLng - drone.lng;
            const distance = Math.sqrt(dLat * dLat + dLng * dLng);

            // If arrived at target
            if (distance < 0.0002) {
              // Log arrival only once
              if (!droneArrived) {
                setDroneArrived(true);
                setDispatchStatus('on_scene');
                setTimeout(() => {
                  addLogEntry('arrival', `${drone.id} on scene - investigating`);
                }, 0);
                // Clear status after 2 seconds
                setTimeout(() => {
                  setDispatchStatus('idle');
                }, 2000);

                // Calculate response time
                if (dispatchStartTime.current) {
                  const responseTime = Math.round((Date.now() - dispatchStartTime.current) / 1000);
                  setMetrics(prev => {
                    const newTimes = [...prev.responseTimes, responseTime];
                    const avgTime = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
                    return {
                      ...prev,
                      responseTimes: newTimes,
                      avgResponseTime: avgTime,
                    };
                  });
                  // Flash the response time
                  setResponseTimeFlash(true);
                  setTimeout(() => setResponseTimeFlash(false), 1000);
                  dispatchStartTime.current = null;
                }
              }
              return {
                ...drone,
                lat: targetLat,
                lng: targetLng,
                speed: 0,
              };
            }

            // Move towards target
            const speed = 0.0003; // Units per tick
            const ratio = speed / distance;

            return {
              ...drone,
              lat: drone.lat + dLat * ratio,
              lng: drone.lng + dLng * ratio,
              speed: 25,
              heading: Math.atan2(dLng, dLat) * (180 / Math.PI),
            };
          }

          // If drone is idle, don't move
          if (drone.status === 'idle') {
            return drone;
          }

          // If drone is returning to patrol start
          if (drone.status === 'returning') {
            const startPos = initialPositions.current[drone.id];
            const dLat = startPos.lat - drone.lat;
            const dLng = startPos.lng - drone.lng;
            const distance = Math.sqrt(dLat * dLat + dLng * dLng);

            if (distance < 0.0002) {
              return {
                ...drone,
                lat: startPos.lat,
                lng: startPos.lng,
                status: 'patrolling' as const,
                speed: 12,
              };
            }

            const speed = 0.0002;
            const ratio = speed / distance;

            return {
              ...drone,
              lat: drone.lat + dLat * ratio,
              lng: drone.lng + dLng * ratio,
              speed: 15,
            };
          }

          // Patrolling - circular pattern
          const startPos = initialPositions.current[drone.id];
          const offset = drone.id.charCodeAt(drone.id.length - 1) * 0.5; // Different offset per drone
          const radius = 0.0008;

          return {
            ...drone,
            lat: startPos.lat + Math.sin(time * 0.3 + offset) * radius,
            lng: startPos.lng + Math.cos(time * 0.3 + offset) * radius,
            heading: (time * 30 + offset * 60) % 360,
            battery: Math.max(20, drone.battery - 0.001), // Slow battery drain
          };
        })
      );
    }, 50); // 20fps for smooth movement

    return () => clearInterval(interval);
  }, [alert, droneArrived, addLogEntry]);

  // Handle dispatch
  const handleDispatch = (droneId: string) => {
    const drone = drones.find(d => d.id === droneId);
    if (drone) {
      addLogEntry('dispatch', `${drone.id} dispatched to alert location`);
    }

    setRespondingDroneId(droneId);
    setDispatchStatus('en_route');
    dispatchStartTime.current = Date.now(); // Record start time for response calculation

    setDrones(prevDrones =>
      prevDrones.map(drone => {
        if (drone.id === droneId) {
          return {
            ...drone,
            status: 'responding' as const,
            speed: 25,
          };
        }
        return drone;
      })
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a12] overflow-hidden">
      {/* Metrics Bar - Top */}
      <MetricsBar metrics={metrics} responseTimeFlash={responseTimeFlash} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section - Takes up most of the screen */}
        <div className="flex-1 relative">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-[#0a0a12] to-transparent p-4 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-2 bg-[#1a1a2e]/90 backdrop-blur px-4 py-2 rounded-lg border border-gray-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">LIVE</span>
              </div>
              <div className="bg-[#1a1a2e]/90 backdrop-blur px-4 py-2 rounded-lg border border-gray-800">
                <span className="text-gray-400 text-sm">
                  {drones.filter(d => d.status === 'patrolling').length} Patrolling |{' '}
                  {drones.filter(d => d.status === 'responding').length} Responding |{' '}
                  {drones.filter(d => d.status === 'idle').length} Idle
                </span>
              </div>
            </div>

            <div className="bg-[#1a1a2e]/90 backdrop-blur px-4 py-2 rounded-lg border border-gray-800 pointer-events-auto">
              <span className="text-gray-400 text-sm">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {alert && !respondingDroneId && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] animate-pulse">
            <div className="bg-red-600/90 backdrop-blur text-white px-6 py-3 rounded-lg shadow-lg shadow-red-600/30 border border-red-500">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-bold text-sm">PERIMETER BREACH DETECTED</div>
                  <div className="text-red-200 text-xs">Eastern sector - Click alert or panel to dispatch</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <DroneMap
          drones={drones}
          alert={alert}
          onDispatch={handleDispatch}
        />
      </div>

      {/* Status Panel + Activity Log - Right side */}
      <div className="w-80 h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          <StatusPanel
            drones={drones}
            alert={alert}
            onDispatch={handleDispatch}
            dispatchStatus={dispatchStatus}
          />
        </div>
        <ActivityLog entries={logEntries} />
        </div>
      </div>
    </div>
  );
}

export default App;
