import type { Drone, Alert } from '../data/mockData';
import { statusColors, severityColors } from '../data/mockData';

interface StatusPanelProps {
  drones: Drone[];
  alert: Alert | null;
  onDispatch: (droneId: string) => void;
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
      <div className="w-12 h-3 bg-gray-700 rounded-sm overflow-hidden">
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

export default function StatusPanel({ drones, alert, onDispatch }: StatusPanelProps) {
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

  return (
    <div className="h-full flex flex-col bg-[#12121a] border-l border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <h1 className="text-lg font-bold text-white tracking-wide">
            DXD COMMAND
          </h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">Drone Fleet Control System</p>
      </div>

      {/* Alert Section */}
      {alert && (
        <div className="p-4 border-b border-gray-800">
          <div
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: `${severityColors[alert.severity]}15`,
              borderColor: severityColors[alert.severity],
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5"
                fill={severityColors[alert.severity]}
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
                style={{ color: severityColors[alert.severity] }}
              >
                {alert.severity} Priority Alert
              </span>
            </div>
            <p className="text-white text-sm font-medium">
              {alert.type.replace(/_/g, ' ').toUpperCase()}
            </p>
            <p className="text-gray-400 text-xs mt-1">{alert.description}</p>

            {nearestDrone && nearestDrone.status !== 'responding' && (
              <button
                onClick={() => onDispatch(nearestDrone.id)}
                className="mt-3 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                DISPATCH {nearestDrone.name.toUpperCase()}
              </button>
            )}

            {drones.some(d => d.status === 'responding') && (
              <div className="mt-3 text-center text-green-400 text-sm font-medium">
                Drone en route to location
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drone List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Active Fleet ({drones.length})
        </h2>

        <div className="space-y-3">
          {drones.map((drone) => (
            <div
              key={drone.id}
              className="p-3 rounded-lg bg-[#1a1a2e] border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${statusColors[drone.status]}20` }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={statusColors[drone.status]}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" />
                    </svg>
                  </div>
                  <div>
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
                {drone.speed > 0 && (
                  <span className="text-xs text-gray-400">
                    {drone.speed} km/h
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
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
