import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, Loader2, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export default function ImportFromWebsite({ onImported }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const extract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setExtracted([]);
    setSelected(new Set());

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Visit the following website and extract ALL information, content, policies, product details, FAQs, shipping info, return policies, contact details, pricing, and any other useful information from it.
URL: ${url}

Be thorough and comprehensive — extract EVERYTHING you can find on the page.
Convert all the information into Q&A format for a customer support AI agent.
For each entry, pick the most relevant category from: shipping, returns, payment, products, orders, general.
Do not limit yourself — extract as many entries as needed to capture ALL the information on the page.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          entries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                answer: { type: 'string' },
                category: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const entries = response?.entries || [];
    setExtracted(entries);
    setSelected(new Set(entries.map((_, i) => i)));
    setLoading(false);

    if (entries.length === 0) {
      toast({ title: 'No entries found', description: 'Try a different URL or page.', variant: 'destructive' });
    }
  };

  const toggleSelect = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const saveSelected = async () => {
    setSaving(true);
    const toSave = extracted.filter((_, i) => selected.has(i));
    for (const entry of toSave) {
      await base44.entities.FAQ.create({
        question: entry.question,
        answer: entry.answer,
        category: ['shipping', 'returns', 'payment', 'products', 'orders', 'general'].includes(entry.category)
          ? entry.category
          : 'general',
        is_active: true,
        usage_count: 0,
      });
    }
    setSaving(false);
    toast({ title: `${toSave.length} FAQ entries added!` });
    setExtracted([]);
    setSelected(new Set());
    setUrl('');
    onImported?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="https://yourstore.com/faq"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && extract()}
          />
        </div>
        <Button onClick={extract} disabled={loading || !url.trim()} className="gap-2 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          {loading ? 'Scanning...' : 'Scan Website'}
        </Button>
      </div>

      {extracted.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{extracted.length} entries found — select which to import</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelected(new Set(extracted.map((_, i) => i)))}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelected(new Set())}>
                Deselect all
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {extracted.map((entry, i) => (
              <Card
                key={i}
                onClick={() => toggleSelect(i)}
                className={`border cursor-pointer transition-colors ${selected.has(i) ? 'border-primary bg-accent/30' : 'border-border opacity-60'}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${selected.has(i) ? 'bg-primary text-primary-foreground' : 'border border-input'}`}>
                      {selected.has(i) && <Check className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium leading-snug">{entry.question}</p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">{entry.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{entry.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            className="w-full gap-2"
            onClick={saveSelected}
            disabled={saving || selected.size === 0}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Saving...' : `Add ${selected.size} selected entries to Knowledge Base`}
          </Button>
        </div>
      )}
    </div>
  );
}