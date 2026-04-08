import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Building2, ToggleRight, ToggleLeft, MessageSquare, Users, Globe, Bot, Plug, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';
import BrandSettingsPanel from '@/components/brands/BrandSettingsPanel';
import NewBrandWizard from '@/components/brands/NewBrandWizard';

export default function Brands() {
  const [selected, setSelected] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const qc = useQueryClient();

  const { data: brands = [], refetch } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.filter({ is_archived: false }, '-created_date', 100),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations-all'],
    queryFn: () => base44.entities.Conversation.list('-created_date', 500),
  });

  const convoCountByBrand = conversations.reduce((acc, c) => {
    if (c.brand_id) acc[c.brand_id] = (acc[c.brand_id] || 0) + 1;
    return acc;
  }, {});

  const handleToggle = async (brand) => {
    await base44.entities.Brand.update(brand.id, { is_active: !brand.is_active });
    refetch();
  };

  const handleArchive = async (brandId) => {
    await base44.entities.Brand.update(brandId, { is_archived: true });
    refetch();
    if (selected?.id === brandId) setSelected(null);
  };

  const selectedBrand = brands.find(b => b.id === selected?.id);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Brand Grid */}
      <div className={`${selectedBrand ? 'w-80 shrink-0' : 'flex-1'} flex flex-col bg-gray-50 border-r border-gray-100 overflow-hidden`}>
        <div className="p-5 bg-white border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">Brands</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">{brands.length} brand{brands.length !== 1 ? 's' : ''} total</p>
          </div>
          <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowWizard(true)}>
            <Plus className="w-3.5 h-3.5" /> New Brand
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {brands.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No brands yet</p>
              <p className="text-xs mt-1">Create your first brand to get started</p>
              <Button className="mt-4 gap-1.5" size="sm" onClick={() => setShowWizard(true)}>
                <Plus className="w-3.5 h-3.5" /> Create Brand
              </Button>
            </div>
          ) : (
            <div className={`grid gap-3 ${selectedBrand ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {brands.map(brand => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  convos={convoCountByBrand[brand.id] || 0}
                  selected={selected?.id === brand.id}
                  onClick={() => setSelected(brand)}
                  onToggle={() => handleToggle(brand)}
                  compact={!!selectedBrand}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Brand Settings */}
      {selectedBrand && (
        <div className="flex-1 overflow-y-auto bg-white">
          <BrandSettingsPanel
            brand={selectedBrand}
            onClose={() => setSelected(null)}
            onSave={async (data) => {
              await base44.entities.Brand.update(selectedBrand.id, data);
              refetch();
              setSelected({ ...selectedBrand, ...data });
            }}
            onArchive={() => handleArchive(selectedBrand.id)}
          />
        </div>
      )}

      {/* New Brand Wizard */}
      {showWizard && (
        <NewBrandWizard
          onClose={() => setShowWizard(false)}
          onCreate={async (data) => {
            await base44.entities.Brand.create(data);
            refetch();
            setShowWizard(false);
          }}
        />
      )}
    </div>
  );
}

function BrandCard({ brand, convos, selected, onClick, onToggle, compact }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border cursor-pointer transition-all duration-150 hover:shadow-md ${
        selected ? 'border-violet-400 shadow-md ring-2 ring-violet-100' : 'border-gray-100 shadow-sm'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <BrandAvatar brand={brand} size={compact ? 32 : 40} />
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="shrink-0 ml-2"
        >
          {brand.is_active
            ? <ToggleRight className="w-5 h-5 text-green-500" />
            : <ToggleLeft className="w-5 h-5 text-gray-300" />}
        </button>
      </div>

      <p className="font-semibold text-gray-900 text-sm truncate">{brand.name}</p>
      <p className="text-[11px] text-gray-400 truncate">{brand.slug}</p>

      {!compact && (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <MessageSquare className="w-3 h-3" /> {convos}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Users className="w-3 h-3" /> {brand.assigned_agents?.length || 0}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${brand.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={`text-[10px] font-medium ${brand.is_active ? 'text-green-600' : 'text-gray-400'}`}>
              {brand.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}