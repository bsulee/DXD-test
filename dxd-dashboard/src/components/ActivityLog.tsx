import { useEffect, useRef } from 'react';
import type { LogEntry } from '../data/mockData';
import { logTypeColors } from '../data/mockData';

interface ActivityLogProps {
  entries: LogEntry[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getTypeLabel(type: LogEntry['type']): string {
  return type.toUpperCase();
}

export default function ActivityLog({ entries }: ActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="flex flex-col bg-[#0f0f1a] border-t border-gray-800">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-2">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Activity Log
        </span>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="h-[200px] overflow-y-auto font-mono text-xs p-2 space-y-1"
      >
        {entries.length === 0 ? (
          <div className="text-gray-600 text-center py-4">
            No activity yet...
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-start gap-2 py-1 animate-fade-in"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Timestamp */}
              <span className="text-gray-500 shrink-0">
                {formatTime(entry.timestamp)}
              </span>

              {/* Type badge */}
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase"
                style={{
                  backgroundColor: `${logTypeColors[entry.type]}20`,
                  color: logTypeColors[entry.type],
                }}
              >
                {getTypeLabel(entry.type)}
              </span>

              {/* Message */}
              <span className="text-gray-300 break-words">
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
