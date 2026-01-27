'use client';

import { Zap } from 'lucide-react';
import { TIME_FILTERS, SORT_OPTIONS } from '@/lib/constants/search.constants';

interface FilterBarProps {
  selectedTimeFilters: string[];
  onTimeFilterToggle: (filterId: string) => void;
  showDirectOnly: boolean;
  onDirectOnlyToggle: () => void;
  directCount: number;
  sortBy: string;
  onSortChange: (sortId: string) => void;
}

export function FilterBar({
  selectedTimeFilters,
  onTimeFilterToggle,
  showDirectOnly,
  onDirectOnlyToggle,
  directCount,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Time Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {TIME_FILTERS.map(filter => (
          <button
            key={filter.id}
            onClick={() => onTimeFilterToggle(filter.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedTimeFilters.includes(filter.id)
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            }`}
          >
            {filter.icon} {filter.shortLabel}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-slate-200 hidden sm:block" />

      {/* Direct Only Toggle */}
      <button
        onClick={onDirectOnlyToggle}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
          showDirectOnly
            ? 'bg-green-600 text-white'
            : 'bg-white border border-slate-200 text-slate-600 hover:border-green-300'
        }`}
      >
        <Zap className="w-4 h-4" />
        <span>Sadece Direkt</span>
        <span className={`px-1.5 py-0.5 rounded text-xs ${
          showDirectOnly ? 'bg-green-500' : 'bg-slate-100 text-slate-500'
        }`}>
          {directCount}
        </span>
      </button>

      {/* Sort */}
      <div className="ml-auto">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default FilterBar;
