import { useState, useEffect, useRef, useCallback } from 'react';
import DroneScene3D from './components/DroneScene3D';
import StatusPanel from './components/StatusPanel';
import ActivityLog from './components/ActivityLog';
import MetricsBar from './components/MetricsBar';
import type { Drone, Alert, LogEntry } from './data/mockData';
import { initialDrones, generateAlert } from './data/mockData';

interface Metrics {
  activeDrones: number;
  totalDrones: number;
  avgResponseTime: number;
  responseTimes: number[];
  alertsToday: number;
}

// Build version for debugging deployments
const BUILD_VERSION = 'v3.0.0-' + new Date().toISOString().slice(0, 10);

function App() {
  // State for drones and alert
  const [drones, setDrones] = useState<Drone[]>(initialDrones);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [respondingDroneId, setRespondingDroneId] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [droneArrived, setDroneArrived] = useState(false);
  const [alertResolved, setAlertResolved] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'en_route' | 'on_scene'>('idle');
  const [metrics, setMetrics] = useState<Metrics>({
    activeDrones: initialDrones.filter(d => d.status !== 'idle').length,
    totalDrones: initialDrones.length,
    avgResponseTime: -1, // -1 indicates no responses yet
    responseTimes: [],
    alertsToday: Math.floor(Math.random() * 3) + 4, // Start with random 4-6
  });
  const [responseTimeFlash, setResponseTimeFlash] = useState(false);
  const dispatchStartTime = useRef<number | null>(null);

  // Drone patrol configurations - 2 patrolling, 2 idle (landed on buildings)
  const droneConfigs: Record<string, {
    mode: 'patrol' | 'idle';
    centerLat?: number;
    centerLng?: number;
    radius?: number;
    speed?: number;
    offset?: number;
    lat?: number;
    lng?: number;
  }> = {
    'DXD-001': {
      mode: 'patrol',
      centerLat: 33.4265,
      centerLng: -111.9325,
      radius: 0.0012,
      speed: 0.1,
      offset: 0,
    },
    'DXD-002': {
      mode: 'idle',
      // Landing pad: Hayden Library rooftop
      lat: 33.4197,
      lng: -111.9342,
    },
    'DXD-003': {
      mode: 'patrol',
      centerLat: 33.4188,
      centerLng: -111.9345,
      radius: 0.001,
      speed: 0.08,
      offset: Math.PI,
    },
    'DXD-004': {
      mode: 'idle',
      // Landing pad: Memorial Union rooftop
      lat: 33.4178,
      lng: -111.9362,
    },
  };

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

  // Single alert generation - only when no current alert
  useEffect(() => {
    if (alert !== null) return; // Don't generate if alert exists

    const delay = alertResolved ? 8000 : 5000; // Longer delay after resolution
    const timer = setTimeout(() => {
      const newAlert = generateAlert();
      setAlert(newAlert);
      setAlertResolved(false);
      addLogEntry('alert', `⚠ ALERT: ${newAlert.type.replace(/_/g, ' ')} - ${newAlert.locationName}`);
      setMetrics(prev => ({ ...prev, alertsToday: prev.alertsToday + 1 }));
    }, delay);

    return () => clearTimeout(timer);
  }, [alert, alertResolved, addLogEntry]);

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
                  addLogEntry('arrival', `${drone.id} on scene at ${alert.locationName} - investigating`);
                }, 0);

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

                // Clear alert after drone arrives (with small delay)
                setTimeout(() => {
                  setAlert(null);
                  setAlertResolved(true);
                  setRespondingDroneId(null);
                  setDispatchStatus('idle');
                  setDroneArrived(false);
                  // Return drone to patrolling
                  setDrones(prev => prev.map(d =>
                    d.id === drone.id ? { ...d, status: 'returning' as const, speed: 15 } : d
                  ));
                }, 2000);
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

          // Get drone config
          const config = droneConfigs[drone.id];
          if (!config) return drone;

          // If drone is returning to patrol position
          if (drone.status === 'returning') {
            const targetLat = config.mode === 'patrol' ? config.centerLat! : config.lat!;
            const targetLng = config.mode === 'patrol' ? config.centerLng! : config.lng!;
            const dLat = targetLat - drone.lat;
            const dLng = targetLng - drone.lng;
            const distance = Math.sqrt(dLat * dLat + dLng * dLng);

            if (distance < 0.0002) {
              return {
                ...drone,
                lat: targetLat,
                lng: targetLng,
                status: config.mode === 'patrol' ? 'patrolling' as const : 'idle' as const,
                speed: config.mode === 'patrol' ? 12 : 0,
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

          // Idle drones stay in place
          if (config.mode === 'idle') {
            return {
              ...drone,
              status: 'idle' as const,
              lat: config.lat!,
              lng: config.lng!,
              speed: 0,
            };
          }

          // Patrolling drones - slow circular pattern
          const angle = (time * config.speed! + config.offset!) % (Math.PI * 2);
          return {
            ...drone,
            status: 'patrolling' as const,
            lat: config.centerLat! + Math.sin(angle) * config.radius!,
            lng: config.centerLng! + Math.cos(angle) * config.radius!,
            heading: (angle * 180 / Math.PI) % 360,
            speed: 12,
            battery: Math.max(20, drone.battery - 0.001),
          };
        })
      );
    }, 50); // 20fps for smooth movement

    return () => clearInterval(interval);
  }, [alert, droneArrived, addLogEntry]);

  // Handle dispatch - supports both nearest and specific drone
  const handleDispatch = (droneId: string, isManual: boolean = false) => {
    const drone = drones.find(d => d.id === droneId);

    if (drone && alert) {
      if (isManual) {
        addLogEntry('dispatch', `${drone.id} manually dispatched to ${alert.locationName}`);
      } else {
        addLogEntry('dispatch', `${drone.id} dispatched to ${alert.locationName}`);
      }
    }

    setRespondingDroneId(droneId);
    setDispatchStatus('en_route');
    setDroneArrived(false);
    dispatchStartTime.current = Date.now();

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
      {/* Metrics Bar - Top - Full width */}
      <MetricsBar metrics={metrics} responseTimeFlash={responseTimeFlash} />

      {/* Main Content - Responsive layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map Section - Full width on mobile, 70% on desktop */}
        <div className="h-[50vh] lg:h-full lg:flex-1 relative">
          {/* Top bar overlay */}
          <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-[#0a0a12] to-transparent p-2 lg:p-4 pointer-events-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 bg-[#1a1a2e]/90 backdrop-blur px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg border border-gray-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs lg:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:block bg-[#1a1a2e]/90 backdrop-blur px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg border border-gray-800">
                  <span className="text-gray-400 text-xs lg:text-sm">
                    {drones.filter(d => d.status === 'patrolling').length} Patrolling |{' '}
                    {drones.filter(d => d.status === 'responding').length} Responding |{' '}
                    {drones.filter(d => d.status === 'idle').length} Idle
                  </span>
                </div>
              </div>

              <div className="bg-[#1a1a2e]/90 backdrop-blur px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg border border-gray-800 pointer-events-auto">
                <span className="text-gray-400 text-xs lg:text-sm">
                  {new Date().toLocaleTimeString()}
                </span>
                <span className="hidden sm:inline text-gray-600 text-xs ml-2">{BUILD_VERSION}</span>
              </div>
            </div>
          </div>

          {/* Alert Banner - Responsive */}
          {alert && !respondingDroneId && (
            <div className="absolute top-14 lg:top-20 left-1/2 -translate-x-1/2 z-[1000] animate-pulse w-[90%] sm:w-auto">
              <div className="bg-red-600/90 backdrop-blur text-white px-4 py-2 lg:px-6 lg:py-3 rounded-lg shadow-lg shadow-red-600/30 border border-red-500">
                <div className="flex items-center gap-2 lg:gap-3">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="min-w-0">
                    <div className="font-bold text-xs lg:text-sm truncate">{alert.type.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-red-200 text-xs truncate">{alert.locationName} - Dispatch drone</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3D Scene */}
          <DroneScene3D
            drones={drones}
            alert={alert}
            onDispatch={(droneId) => handleDispatch(droneId, false)}
          />
        </div>

        {/* Status Panel + Activity Log - Full width on mobile, 30% on desktop */}
        <div className="flex-1 lg:flex-none lg:w-80 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden min-h-0">
            <StatusPanel
              drones={drones}
              alert={alert}
              onDispatch={(droneId) => handleDispatch(droneId, false)}
              onDispatchManual={(droneId) => handleDispatch(droneId, true)}
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
