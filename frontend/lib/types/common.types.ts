// ============================================================
// COMMON TYPES
// Shared across booking and search
// ============================================================

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Passengers {
  adults: number;
  children: number;
  youths?: number;
  seniors?: number;
}

export interface Station {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone?: string;
}

export interface Price {
  amount: number;
  currency: string;
}

export interface TimeDisplayInfo {
  time: string;
  timezone: string;
  offset: string;
}
