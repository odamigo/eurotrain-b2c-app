'use client';

import { Globe } from 'lucide-react';

interface TimeDisplayProps {
  time: string; // ISO 8601 datetime
  timezone?: string; // e.g., 'Europe/Paris'
  showTimezone?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-semibold',
  xl: 'text-2xl font-bold',
};

export function formatTimeWithTimezone(
  dateStr: string,
  timezone?: string
): { time: string; tz: string; offset: string } {
  try {
    const date = new Date(dateStr);
    
    // Format time in the specified timezone
    const time = date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone || undefined,
    });

    // Get timezone abbreviation
    let tz = '';
    if (timezone) {
      const parts = timezone.split('/');
      tz = parts[parts.length - 1]?.substring(0, 3).toUpperCase() || '';
    }

    // Calculate UTC offset
    const offsetMinutes = date.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const offsetSign = offsetMinutes <= 0 ? '+' : '-';
    const offset = `UTC${offsetSign}${offsetHours}`;

    return { time, tz, offset };
  } catch {
    // Fallback: extract time from ISO string
    return {
      time: dateStr.substring(11, 16) || '--:--',
      tz: '',
      offset: '',
    };
  }
}

export function TimeDisplay({
  time,
  timezone,
  showTimezone = false,
  size = 'lg',
  className = '',
}: TimeDisplayProps) {
  const { time: formattedTime, offset } = formatTimeWithTimezone(time, timezone);

  return (
    <div className={`${className}`}>
      <div className={`text-slate-800 ${sizeClasses[size]}`}>
        {formattedTime}
      </div>
      {showTimezone && offset && (
        <div className="flex items-center gap-0.5 text-[10px] text-blue-500 mt-0.5">
          <Globe className="w-3 h-3" />
          <span>{offset}</span>
        </div>
      )}
    </div>
  );
}

export default TimeDisplay;
