import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const PRESETS = [
  { label: 'Today', value: '1' },
  { label: '7 Days', value: '7' },
  { label: '30 Days', value: '30' },
  { label: '90 Days', value: '90' },
];

export default function DateRangeFilter({ value, onChange }) {
  const selected = PRESETS.find(p => p.value === value) || PRESETS[2];

  return (
    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
      <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1" />
      {PRESETS.map(p => (
        <button key={p.value} onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${value === p.value ? 'bg-white shadow-sm text-violet-700 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - parseInt(days));
  return { start, end };
}

export function filterByDateRange(items, dateField, days) {
  const { start } = getDateRange(days);
  return items.filter(item => {
    const d = item[dateField] ? new Date(item[dateField]) : null;
    return d && d >= start;
  });
}