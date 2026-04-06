import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryColors = {
  shipping: 'bg-cyan-100 text-cyan-700',
  returns: 'bg-amber-100 text-amber-700',
  payment: 'bg-orange-100 text-orange-700',
  products: 'bg-purple-100 text-purple-700',
  orders: 'bg-blue-100 text-blue-700',
  general: 'bg-slate-100 text-slate-700',
};

export default function FAQApprovals() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [adminNotes, setAdminNotes] = useState({});

  const { data: suggestions = [] } = useQuery({
    queryKey: ['faq-suggestions'],
    queryFn: () => base44.entities.FAQSuggestion.list('-created_date', 200),
  });

  const pending = suggestions.filter((s) => s.status === 'pending');
  const approved = suggestions.filter((s) => s.status === 'approved');
  const rejected = suggestions.filter((s) => s.status === 'rejected');

  const approve = async (suggestion) => {
    await base44.entities.FAQSuggestion.update(suggestion.id, {
      status: 'approved',
      admin_notes: adminNotes[suggestion.id] || '',
      approved_at: new Date().toISOString(),
    });

    // Optionally create FAQ from approved suggestion
    await base44.entities.FAQ.create({
      question: suggestion.question,
      answer: suggestion.answer,
      category: suggestion.category,
      keywords: [],
      is_active: true,
    });

    qc.invalidateQueries({ queryKey: ['faq-suggestions'] });
    qc.invalidateQueries({ queryKey: ['faqs'] });
    toast({ title: 'Suggestion approved and added to FAQs', open: true });
  };

  const reject = async (suggestion) => {
    await base44.entities.FAQSuggestion.update(suggestion.id, {
      status: 'rejected',
      admin_notes: adminNotes[suggestion.id] || 'Not approved',
    });

    qc.invalidateQueries({ queryKey: ['faq-suggestions'] });
    toast({ title: 'Suggestion rejected', open: true });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">FAQ Suggestions & Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and approve FAQ suggestions from team members and customers</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold mt-1">{pending.length}</p>
              </div>
              <Clock className="w-10 h-10 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{approved.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 opacity-20 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold mt-1 text-red-600">{rejected.length}</p>
              </div>
              <XCircle className="w-10 h-10 opacity-20 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Pending Approval</h2>
          <div className="space-y-4">
            {pending.map((s) => (
              <Card key={s.id} className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{s.question}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-2">
                        Suggested by {s.suggested_by} • {s.source}
                      </p>
                    </div>
                    <Badge className={cn('text-xs', categoryColors[s.category] || categoryColors.general)}>
                      {s.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-background/50 p-3 rounded border text-sm">
                    {s.answer}
                  </div>

                  <Textarea
                    placeholder="Admin notes (optional)..."
                    value={adminNotes[s.id] || ''}
                    onChange={(e) => setAdminNotes({ ...adminNotes, [s.id]: e.target.value })}
                    rows={2}
                    className="text-xs"
                  />

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reject(s)}
                      className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => approve(s)} className="gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Approve & Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {approved.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-green-600">Approved</h2>
          <div className="space-y-2">
            {approved.map((s) => (
              <div key={s.id} className="p-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{s.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.admin_notes}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">Approved</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejected.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-red-600">Rejected</h2>
          <div className="space-y-2">
            {rejected.map((s) => (
              <div key={s.id} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{s.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.admin_notes}</p>
                  </div>
                  <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}