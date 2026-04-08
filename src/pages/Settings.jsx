import { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { Settings as SettingsIcon, ShieldCheck, Palette, Zap, Mail, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import RoleManagement from '@/components/settings/RoleManagement';
import BrandingSettings from '@/components/settings/BrandingSettings';
import WidgetCustomization from '@/components/settings/WidgetCustomization';
import EmailSMSTemplates from '@/components/settings/EmailSMSTemplates';
import SecurityCompliance from '@/components/settings/SecurityCompliance';
import APIWebhooks from '@/components/settings/APIWebhooks';

const TABS = [
  { key: 'roles', label: 'Roles & Permissions', icon: ShieldCheck, color: '#6366f1' },
  { key: 'branding', label: 'Branding', icon: Palette, color: '#7c3aed' },
  { key: 'widget', label: 'Widget', icon: Zap, color: '#f59e0b' },
  { key: 'email-sms', label: 'Email & SMS', icon: Mail, color: '#ec4899' },
  { key: 'security', label: 'Security', icon: ShieldCheck, color: '#ef4444' },
  { key: 'api-webhooks', label: 'API & Webhooks', icon: Key, color: '#3b82f6' },
];

export default function Settings() {
  const [tab, setTab] = useState('roles');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const { activeBrandId, activeBrand } = useBrand();

  const currentTab = TABS.find(t => t.key === tab);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${currentTab?.color}20` }}>
            <SettingsIcon className="w-5 h-5" style={{ color: currentTab?.color }} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Settings</h1>
            <p className="text-xs text-gray-400">{activeBrand?.name || 'All brands'} · Brand configuration hub</p>
          </div>
          {unsavedChanges && (
            <span className="ml-auto text-[11px] px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" /> Unsaved changes
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                tab === key ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
              )}
              style={tab === key ? { background: color } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'roles' && <RoleManagement brandId={activeBrandId} onChangesDetected={setUnsavedChanges} />}
        {tab === 'branding' && <BrandingSettings brandId={activeBrandId} onChangesDetected={setUnsavedChanges} />}
        {tab === 'widget' && <WidgetCustomization brandId={activeBrandId} onChangesDetected={setUnsavedChanges} />}
        {tab === 'email-sms' && <EmailSMSTemplates brandId={activeBrandId} onChangesDetected={setUnsavedChanges} />}
        {tab === 'security' && <SecurityCompliance brandId={activeBrandId} onChangesDetected={setUnsavedChanges} />}
        {tab === 'api-webhooks' && <APIWebhooks brandId={activeBrandId} onChangesDetected={setUnsavedChanges} />}
      </div>
    </div>
  );
}