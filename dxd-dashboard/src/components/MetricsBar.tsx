interface Metrics {
  activeDrones: number;
  totalDrones: number;
  avgResponseTime: number;
  alertsToday: number;
}

interface MetricsBarProps {
  metrics: Metrics;
  responseTimeFlash: boolean;
}

export default function MetricsBar({ metrics, responseTimeFlash }: MetricsBarProps) {
  return (
    <div className="w-full h-[44px] lg:h-[50px] bg-[#1e1e2e] border-b border-gray-800 flex items-center justify-around px-2 lg:px-4">
      {/* Active Drones */}
      <div className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 border-r border-gray-700">
        <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-green-500 rounded-full animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-wide">Active</span>
          <span className="text-white font-bold text-sm lg:text-base">
            {metrics.activeDrones}/{metrics.totalDrones}
          </span>
        </div>
      </div>

      {/* Avg Response Time */}
      <div className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 border-r border-gray-700">
        <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex flex-col">
          <span className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-wide">Response</span>
          <span className={`font-bold text-sm lg:text-base transition-colors duration-300 ${responseTimeFlash ? 'text-green-400' : 'text-white'}`}>
            {metrics.avgResponseTime < 0 ? '--' : `${Math.round(metrics.avgResponseTime)}s`}
          </span>
        </div>
      </div>

      {/* Alerts Today */}
      <div className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4">
        <svg className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex flex-col">
          <span className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-wide">Alerts</span>
          <span className="text-white font-bold text-sm lg:text-base">{metrics.alertsToday}</span>
        </div>
      </div>
    </div>
  );
}
