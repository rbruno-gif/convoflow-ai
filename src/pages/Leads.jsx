import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, Plus, Download, Phone, Mail, Globe, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import LeadDetailPanel from '@/components/leads/LeadDetailPanel';
import NewLeadModal from '@/components/leads/NewLeadModal';

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  qualified: 'bg-green-100 text-green-700',
  disqualified: 'bg-red-100 text-red-700',
  converted: 'bg-emerald-100 text-emerald-700',
};

const sourceIcons = {
  chat: '💬', popup: '🪟', form: '📋', facebook: '📘', instagram: '📸', whatsapp: '📱', other: '🔗',
};

export default function Leads() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200),
  });

  const filtered = leads.filter(l => {
    const matchSearch = !search ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.company?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchSource = filterSource === 'all' || l.source === filterSource;
    return matchSearch && matchStatus && matchSource;
  });

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Date']];
    filtered.forEach(l => rows.push([l.name, l.email || '', l.phone || '', l.company || '', l.source || '', l.status || '', l.created_date ? format(new Date(l.created_date), 'yyyy-MM-dd') : '']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
    toast({ title: 'Leads exported' });
  };

  const selectedLead = leads.find(l => l.id === selected);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Lead Generation</h1>
              <p className="text-sm text-muted-foreground">{filtered.length} leads</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCSV} className="gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
              <Button onClick={() => setShowNew(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Add Lead
              </Button>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {['new', 'contacted', 'qualified', 'disqualified', 'converted'].map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {['chat', 'popup', 'form', 'facebook', 'instagram', 'whatsapp', 'other'].map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No leads found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(lead => (
                <Card
                  key={lead.id}
                  onClick={() => setSelected(lead.id)}
                  className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${selected === lead.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {lead.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg" title={lead.source}>{sourceIcons[lead.source] || '🔗'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status] || 'bg-muted text-muted-foreground'}`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                    <p className="font-semibold text-sm">{lead.name}</p>
                    {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
                    <div className="mt-2 space-y-1">
                      {lead.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</p>}
                      {lead.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</p>}
                      {lead.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.location}</p>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">
                      {lead.created_date ? format(new Date(lead.created_date), 'MMM d, yyyy') : ''}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelected(null)}
          onUpdate={() => qc.invalidateQueries({ queryKey: ['leads'] })}
        />
      )}

      {showNew && (
        <NewLeadModal
          onClose={() => setShowNew(false)}
          onCreate={() => { qc.invalidateQueries({ queryKey: ['leads'] }); setShowNew(false); }}
        />
      )}
    </div>
  );
}