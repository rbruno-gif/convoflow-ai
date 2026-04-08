import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({ label, value, sub, icon: Icon, color = '#7c3aed', bg = 'rgba(124,58,237,0.1)', change, suffix = '' }) {
  const isPositive = change > 0;
  const isNeutral = change === 0 || change === undefined;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${isNeutral ? 'text-gray-400' : isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change !== undefined && !isNeutral && `${Math.abs(change)}%`}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}{suffix}</p>
      <p className="text-xs font-semibold text-gray-700 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}