import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Copy, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import QuickReplyForm from '@/components/quickreplies/QuickReplyForm';
import QuickReplyList from '@/components/quickreplies/QuickReplyList';

const categories = {
  order_updates: { label: 'Order Updates', color: 'bg-blue-100 text-blue-700' },
  shipping_info: { label: 'Shipping Info', color: 'bg-cyan-100 text-cyan-700' },
  account_management: { label: 'Account Mgmt', color: 'bg-purple-100 text-purple-700' },
  reminders: { label: 'Reminders', color: 'bg-amber-100 text-amber-700' },
  product_info: { label: 'Product Info', color: 'bg-green-100 text-green-700' },
  support: { label: 'Support', color: 'bg-slate-100 text-slate-700' },
  returns: { label: 'Returns', color: 'bg-orange-100 text-orange-700' },
  billing: { label: 'Billing', color: 'bg-red-100 text-red-700' },
};

export default function QuickReplies() {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['quick-replies'],
    queryFn: () => base44.entities.QuickReply.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.QuickReply.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quick-replies'] });
      toast({ title: 'Template deleted' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template) => {
      return base44.entities.QuickReply.create({
        name: `${template.name} (Copy)`,
        content: template.content,
        category: template.category,
        notes: template.notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quick-replies'] });
      toast({ title: 'Template duplicated' });
    },
  });

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Quick Replies & Templates</h1>
            <p className="text-sm text-muted-foreground">Manage pre-built message templates for fast customer responses</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Templates</p>
              <p className="text-2xl font-bold">{templates.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Templates</p>
              <p className="text-2xl font-bold">{templates.filter((t) => t.is_active).length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Uses</p>
              <p className="text-2xl font-bold">{templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form or List View */}
      {showForm ? (
        <QuickReplyForm
          template={editingTemplate}
          onClose={handleCloseForm}
          categories={categories}
        />
      ) : (
        <>
          {/* Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-input text-sm"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input text-sm"
              >
                <option value="all">All Categories</option>
                {Object.entries(categories).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New Template
            </Button>
          </div>

          {/* Templates List */}
          <QuickReplyList
            templates={filteredTemplates}
            categories={categories}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            onDuplicate={(template) => duplicateMutation.mutate(template)}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}