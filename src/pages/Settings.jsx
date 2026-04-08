import { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import {
  Building2, Lock, Code2, Bell, Puzzle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BrandingSettings from '@/components/settings/BrandingSettings';
import SecurityCompliance from '@/components/settings/SecurityCompliance';
import APIWebhooks from '@/components/settings/APIWebhooks';
import WidgetSettings from '@/components/settings/WidgetSettings';
import IntegrationsMarketplace from '@/components/settings/IntegrationsMarketplace';

const SETTINGS_TABS = [
  { key: 'branding', label: 'Brand & White Label', icon: Building2 },
  { key: 'widget', label: 'Chat Widget', icon: Bell },
  { key: 'security', label: 'Security & Compliance', icon: Lock },
  { key: 'api', label: 'API & Webhooks', icon: Code2 },
  { key: 'integrations', label: 'Integrations', icon: Puzzle },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('branding');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { activeBrandId } = useBrand();

  const renderContent = () => {
    switch (activeTab) {
      case 'branding':
        return <BrandingSettings brandId={activeBrandId} onChangesMade={() => setHasUnsavedChanges(true)} />;
      case 'widget':
        return <WidgetSettings brandId={activeBrandId} onChangesMade={() => setHasUnsavedChanges(true)} />;
      case 'security':
        return <SecurityCompliance brandId={activeBrandId} onChangesMade={() => setHasUnsavedChanges(true)} />;
      case 'api':
        return <APIWebhooks brandId={activeBrandId} onChangesMade={() => setHasUnsavedChanges(true)} />;
      case 'integrations':
        return <IntegrationsMarketplace brandId={activeBrandId} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r overflow-y-auto p-6">
        <h3 className="font-bold mb-6">Settings</h3>
        <div className="space-y-1">
          {SETTINGS_TABS.map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all',
                activeTab === key
                  ? 'bg-white text-foreground shadow-sm border'
                  : 'text-muted-foreground hover:bg-white/50'
              )}
            >
              <TabIcon className="w-4 h-4" />
              <span>{label}</span>
              {activeTab === key && <ChevronRight className="ml-auto w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Unsaved Banner */}
        {hasUnsavedChanges && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-amber-800">You have unsaved changes</p>
            <div className="flex gap-2">
              <button className="text-sm text-amber-700 hover:text-amber-900 font-medium">Discard</button>
              <button className="text-sm bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-700">Save</button>
            </div>
          </div>
        )}
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}