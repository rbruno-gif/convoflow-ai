import { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { Layers, Settings, BarChart2, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';
import QueueDashboard from '@/components/queue/QueueDashboard';
import QueueSettingsPanel from '@/components/queue/QueueSettingsPanel';
import CallbackManager from '@/components/queue/CallbackManager';
import AssignmentFlowPanel from '@/components/queue/AssignmentFlowPanel';

const TABS = [
  { key: 'dashboard', label: 'Live Dashboard', icon: BarChart2 },
  { key: 'settings', label: 'Queue Settings', icon: Settings },
  { key: 'assignment', label: 'Assignment Flow', icon: Layers },
  { key: 'callbacks', label: 'Callbacks', icon: PhoneCall },
];

export default function QueueManagement() {
  const [tab, setTab] = useState('dashboard');
  const { activeBrandId, activeBrand } = useBrand();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}>
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Queue Management</h1>
              <p className="text-xs text-gray-400">{activeBrand?.name || 'All brands'} · Real-time flow control</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                tab === key ? 'text-white' : 'text-gray-500 hover:bg-gray-100')}
              style={tab === key ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'dashboard' && <QueueDashboard brandId={activeBrandId} />}
        {tab === 'settings' && <QueueSettingsPanel brandId={activeBrandId} />}
        {tab === 'assignment' && <AssignmentFlowPanel brandId={activeBrandId} />}
        {tab === 'callbacks' && <CallbackManager brandId={activeBrandId} />}
      </div>
    </div>
  );
}