import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Plus, Edit2, Trash2, Download, CheckCircle2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import KBEntryForm from '@/components/kb/KBEntryForm';

export default function KnowledgeBase() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [editingEntry, setEditingEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { activeBrandId } = useBrand();
  const qc = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['knowledge-base', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.KnowledgeBase.filter({ brand_id: activeBrandId }, '-updated_date', 200)
      : [],
  });

  const filtered = entries.filter(e => {
    const matchSearch = !search || 
      e.question?.toLowerCase().includes(search.toLowerCase()) ||
      e.answer?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchSource = filterSource === 'all' || e.source === filterSource;
    return matchSearch && matchStatus && matchSource;
  });

  const handleDelete = async (id) => {
    if (confirm('Delete this KB entry?')) {
      await base44.entities.KnowledgeBase.delete(id);
      qc.invalidateQueries({ queryKey: ['knowledge-base', activeBrandId] });
    }
  };

  const handleApproveAll = async () => {
    const drafts = entries.filter(e => e.status === 'draft');
    for (const entry of drafts) {
      await base44.entities.KnowledgeBase.update(entry.id, {
        status: 'approved',
        approved_at: new Date().toISOString(),
      });
    }
    qc.invalidateQueries({ queryKey: ['knowledge-base', activeBrandId] });
  };

  const statusColors = {
    draft: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">{entries.length} total entries</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleApproveAll}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve All Drafts
          </Button>
          <Button
            onClick={() => { setEditingEntry(null); setShowForm(true); }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Search questions or answers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="scraped">Scraped</SelectItem>
            <SelectItem value="imported">Imported</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No KB entries found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => (
            <div key={entry.id} className="bg-card border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{entry.question}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[entry.status]}`}>
                      {entry.status}
                    </span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      {entry.source}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {entry.answer}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Used {entry.usage_count} times</span>
                    {entry.source_url && (
                      <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {entry.source_url}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setEditingEntry(entry); setShowForm(true); }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <KBEntryForm
          brandId={activeBrandId}
          entry={editingEntry}
          onClose={() => { setShowForm(false); setEditingEntry(null); }}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ['knowledge-base', activeBrandId] });
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}