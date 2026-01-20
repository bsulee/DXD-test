interface Metrics {
  activeDrones: number;
  totalDrones: number;
  avgResponseTime: number;
  alertsToday: number;
  coveragePercent: number;
}

interface MetricsBarProps {
  metrics: Metrics;
  responseTimeFlash: boolean;
}

export default function MetricsBar({ metrics, responseTimeFlash }: MetricsBarProps) {
  return (
    <div className="w-full h-[50px] bg-[#1e1e2e] border-b border-gray-800 flex items-center justify-around px-4">
      {/* Active Drones */}
      <div className="flex items-center gap-3 px-4 border-r border-gray-700">
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Active</span>
          <span className="text-white font-bold">
            {metrics.activeDrones}/{metrics.totalDrones} <span className="text-gray-400 font-normal text-xs">Online</span>
          </span>
        </div>
      </div>

      {/* Avg Response Time */}
      <div className="flex items-center gap-3 px-4 border-r border-gray-700">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Avg Response</span>
          <span className={`font-bold transition-colors duration-300 ${responseTimeFlash ? 'text-green-400' : 'text-white'}`}>
            {metrics.avgResponseTime}s
          </span>
        </div>
      </div>

      {/* Alerts Today */}
      <div className="flex items-center gap-3 px-4 border-r border-gray-700">
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Alerts Today</span>
          <span className="text-white font-bold">{metrics.alertsToday}</span>
        </div>
      </div>

      {/* Coverage Status */}
      <div className="flex items-center gap-3 px-4">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Coverage</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{metrics.coveragePercent}%</span>
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${metrics.coveragePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
