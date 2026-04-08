import { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { Phone, Radio, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import AutocallsSettingsPanel from '@/components/voice/AutocallsSettingsPanel';
import VoiceAnalytics from '@/components/voice/VoiceAnalytics';

const TABS = [
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'analytics', label: 'Analytics', icon: Radio },
];

export default function Voice() {
  const [tab, setTab] = useState('settings');
  const { activeBrandId, activeBrand } = useBrand();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,184,0.1)' }}>
            <Phone className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Voice Integration</h1>
            <p className="text-xs text-gray-400">{activeBrand?.name || 'All brands'} · Autocalls.ai</p>
          </div>
        </div>
        <div className="flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                tab === key ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
              )}
              style={tab === key ? { background: 'linear-gradient(135deg, #14b8a6, #0891b2)' } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'settings' && <AutocallsSettingsPanel brandId={activeBrandId} />}
        {tab === 'analytics' && <VoiceAnalytics brandId={activeBrandId} />}
      </div>
    </div>
  );
}