import { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { Zap, Users, Mail, Hash, TrendingUp, Layout, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import FlowList from '@/components/flows/FlowList';
import FlowBuilder from '@/components/flows/FlowBuilder';
import SubscriberManager from '@/components/flows/SubscriberManager';
import SequenceManager from '@/components/flows/SequenceManager';
import BroadcastManager from '@/components/flows/BroadcastManager';
import KeywordManager from '@/components/flows/KeywordManager';
import GrowthTools from '@/components/flows/GrowthTools';
import FlowAnalytics from '@/components/flows/FlowAnalytics';

const TABS = [
  { key: 'flows', label: 'Flows', icon: Zap },
  { key: 'subscribers', label: 'Subscribers', icon: Users },
  { key: 'sequences', label: 'Sequences', icon: Layout },
  { key: 'broadcasts', label: 'Broadcasts', icon: Mail },
  { key: 'keywords', label: 'Keywords', icon: Hash },
  { key: 'growth', label: 'Growth Tools', icon: TrendingUp },
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
];

export default function Flows() {
  const [tab, setTab] = useState('flows');
  const [editingFlow, setEditingFlow] = useState(null);
  const { activeBrandId, activeBrand } = useBrand();

  if (editingFlow) {
    return <FlowBuilder flow={editingFlow} brandId={activeBrandId} onBack={() => setEditingFlow(null)} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Automation & Marketing Engine</h1>
            <p className="text-xs text-gray-400">{activeBrand?.name || 'All brands'} · ManyChat-style flow builder</p>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                tab === key ? 'text-white' : 'text-gray-500 hover:bg-gray-100')}
              style={tab === key ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'flows' && <FlowList brandId={activeBrandId} onEdit={setEditingFlow} />}
        {tab === 'subscribers' && <SubscriberManager brandId={activeBrandId} />}
        {tab === 'sequences' && <SequenceManager brandId={activeBrandId} />}
        {tab === 'broadcasts' && <BroadcastManager brandId={activeBrandId} />}
        {tab === 'keywords' && <KeywordManager brandId={activeBrandId} />}
        {tab === 'growth' && <GrowthTools brandId={activeBrandId} />}
        {tab === 'analytics' && <FlowAnalytics brandId={activeBrandId} />}
      </div>
    </div>
  );
}