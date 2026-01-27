'use client';

import { Info, AlertTriangle, AlertCircle, Check, X } from 'lucide-react';
import type { Alert } from '@/lib/types/common.types';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: Check,
};

const styleMap = {
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-800',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-500',
    text: 'text-amber-800',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    text: 'text-red-800',
  },
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    text: 'text-green-800',
  },
};

export function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((alert) => {
        const Icon = iconMap[alert.type];
        const styles = styleMap[alert.type];

        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${styles.bg}`}
            role="alert"
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 ${styles.icon}`} />
              <span className={`text-sm ${styles.text}`}>{alert.message}</span>
              {alert.action && (
                <button
                  onClick={alert.action.onClick}
                  className="ml-2 text-sm font-medium underline hover:no-underline"
                >
                  {alert.action.label}
                </button>
              )}
            </div>
            {alert.dismissible && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 hover:bg-white/50 rounded transition-colors"
                aria-label="Kapat"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AlertBanner;
