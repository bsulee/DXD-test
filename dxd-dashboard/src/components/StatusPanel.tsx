import type { Drone, Alert } from '../data/mockData';
import { statusColors, severityColors } from '../data/mockData';

interface StatusPanelProps {
  drones: Drone[];
  alert: Alert | null;
  onDispatch: (droneId: string) => void;
  onDispatchManual: (droneId: string) => void;
  dispatchStatus: 'idle' | 'en_route' | 'on_scene';
}

// Battery indicator component
function BatteryIndicator({ level }: { level: number }) {
  const getColor = () => {
    if (level > 50) return 'bg-green-500';
    if (level > 20) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 lg:w-12 h-2.5 lg:h-3 bg-gray-700 rounded-sm overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${level}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8">{level}%</span>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: Drone['status'] }) {
  const color = statusColors[status];

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: color }}
      />
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color }}
      >
        {status}
      </span>
    </div>
  );
}

export default function StatusPanel({ drones, alert, onDispatch, onDispatchManual, dispatchStatus }: StatusPanelProps) {
  // Find nearest available drone to alert
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
  const alertColor = severityColors[alert?.severity || 'high'];

  return (
    <div className="h-full flex flex-col bg-[#12121a] lg:border-l border-t lg:border-t-0 border-gray-800 overflow-hidden">
      {/* Header - Hidden on mobile */}
      <div className="hidden lg:block p-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <h1 className="text-lg font-bold text-white tracking-wide">
            DXD COMMAND
          </h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">Drone Fleet Control System</p>
      </div>

      {/* Scrollable content area - everything scrolls together on mobile */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Alert Section */}
        {alert && (
          <div className="p-3 lg:p-4 border-b border-gray-800">
          <div
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: `${alertColor}15`,
              borderColor: alertColor,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 shrink-0"
                fill={alertColor}
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span
                className="text-sm font-bold uppercase"
                style={{ color: alertColor }}
              >
                {alert.severity} Priority Alert
              </span>
            </div>
            <p className="text-white text-sm font-medium">
              {alert.type.replace(/_/g, ' ').toUpperCase()}
            </p>
            <p className="text-gray-400 text-xs mt-1">{alert.locationName}</p>

            {nearestDrone && nearestDrone.status !== 'responding' && (
              <button
                onClick={() => onDispatch(nearestDrone.id)}
                className="mt-3 w-full min-h-[44px] py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                DISPATCH NEAREST ({nearestDrone.name.toUpperCase()})
              </button>
            )}

            {dispatchStatus === 'en_route' && (
              <div className="mt-3 text-center text-yellow-400 text-sm font-medium">
                Drone en route to location
              </div>
            )}
            {dispatchStatus === 'on_scene' && (
              <div className="mt-3 text-center text-green-400 text-sm font-medium">
                Drone on scene - investigating
              </div>
            )}
          </div>
        </div>
      )}

        {/* Drone List */}
        <div className="p-3 lg:p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Active Fleet ({drones.length})
          </h2>

          <div className="space-y-2 lg:space-y-3">
            {drones.map((drone) => {
              const canDispatch = alert &&
                drone.status !== 'responding' &&
                dispatchStatus === 'idle';

              return (
                <div
                  key={drone.id}
                  className="p-3 lg:p-3 rounded-lg bg-[#1a1a2e] border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${statusColors[drone.status]}20` }}
                      >
                        <svg
                          className="w-4 h-4 lg:w-5 lg:h-5"
                          fill={statusColors[drone.status]}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-white text-sm font-semibold">
                          {drone.name}
                        </div>
                        <div className="text-gray-500 text-xs">{drone.id}</div>
                      </div>
                    </div>
                    <StatusBadge status={drone.status} />
                  </div>

                  <div className="flex items-center justify-between">
                    <BatteryIndicator level={drone.battery} />
                    <div className="flex items-center gap-2">
                      {drone.speed > 0 && (
                        <span className="text-xs text-gray-400">
                          {drone.speed} km/h
                        </span>
                      )}
                      {canDispatch && (
                        <button
                          onClick={() => onDispatchManual(drone.id)}
                          className="min-h-[36px] min-w-[36px] lg:min-h-[40px] lg:min-w-[70px] px-2 lg:px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
                        >
                          <span className="hidden lg:inline">Dispatch</span>
                          <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer - Hidden on mobile */}
      <div className="hidden lg:block p-4 border-t border-gray-800 shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>DEUS X DEFENSE</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            System Online
          </span>
        </div>
      </div>
    </div>
  );
}
