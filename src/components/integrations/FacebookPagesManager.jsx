import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Facebook, Plus, Trash2, Edit2, Copy, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

const WEBHOOK_BASE = `${window.location.origin.includes('localhost') ? 'https://your-app.base44.app' : window.location.origin}/api/functions/metaWebhook`;

const emptyForm = { page_name: '', page_id: '', page_access_token: '', company: '', verify_token: '', is_active: true };

export default function FacebookPagesManager({ brandId }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState(null);
  const [fbPages, setFbPages] = useState([]);
  const [loadingFbPages, setLoadingFbPages] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const fetchFbPages = async () => {
    setLoadingFbPages(true);
    try {
      const res = await base44.functions.invoke('getFacebookPages', {});
      setFbPages(res.data?.pages || []);
    } catch (e) {
      console.error('Could not fetch FB pages:', e.message);
    }
    setLoadingFbPages(false);
  };



  const { data: pages = [] } = useQuery({
    queryKey: ['facebook-pages', brandId],
    queryFn: () => brandId
      ? base44.entities.FacebookPage.filter({ brand_id: brandId }, '-created_date', 50)
      : base44.entities.FacebookPage.list('-created_date', 50),
  });

  const openNew = () => {
    fetchFbPages();
    const verify = Math.random().toString(36).substring(2, 12);
    setEditing(null);
    setForm({ ...emptyForm, verify_token: verify });
    setShowForm(true);
  };

  const openEdit = (page) => {
    setEditing(page.id);
    setForm({ ...page });
    setShowForm(true);
  };

  const cancel = () => { setShowForm(false); setEditing(null); setForm(emptyForm); };

  const save = async () => {
    if (!form.page_name || !form.page_id || !form.page_access_token) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    if (editing) {
      await base44.entities.FacebookPage.update(editing, form);
      toast({ title: 'Page updated' });
    } else {
      const payload = brandId ? { ...form, webhook_url: WEBHOOK_BASE, brand_id: brandId } : { ...form, webhook_url: WEBHOOK_BASE };
      await base44.entities.FacebookPage.create(payload);
      toast({ title: 'Facebook page added!' });
    }
    qc.invalidateQueries({ queryKey: ['facebook-pages', brandId] });
    cancel();
  };

  const deletePage = async (id) => {
    await base44.entities.FacebookPage.delete(id);
    qc.invalidateQueries({ queryKey: ['facebook-pages', brandId] });
    toast({ title: 'Page removed' });
  };

  const toggleActive = async (page) => {
    await base44.entities.FacebookPage.update(page.id, { is_active: !page.is_active });
    qc.invalidateQueries({ queryKey: ['facebook-pages', brandId] });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Facebook className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Facebook Pages</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pages.length} page{pages.length !== 1 ? 's' : ''} connected · Messages sync to inbox
              </p>
            </div>
          </div>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Page
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {showForm && (
          <div className="border rounded-xl p-4 bg-muted/30 space-y-3">
            <h4 className="text-sm font-semibold">{editing ? 'Edit Page' : 'Connect New Facebook Page'}</h4>

            {/* Facebook Page Dropdown */}
            <div className="space-y-1">
              <Label className="text-xs">Select from your Facebook Pages</Label>
              <div className="flex gap-2">
                <select
                  className="flex-1 text-sm border border-input rounded-md px-3 py-2 bg-background"
                  disabled={loadingFbPages}
                  onChange={e => {
                    const selected = fbPages.find(p => p.id === e.target.value);
                    if (selected) setForm(f => ({ ...f, page_id: selected.id, page_name: f.page_name || selected.name, page_access_token: selected.access_token || f.page_access_token }));
                  }}
                  defaultValue=""
                >
                  <option value="">{loadingFbPages ? 'Loading pages…' : fbPages.length ? 'Choose a page…' : 'No pages found — fill manually below'}</option>
                  {fbPages.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </select>
                <Button variant="outline" size="icon" onClick={fetchFbPages} disabled={loadingFbPages}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingFbPages ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Or fill in manually below</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Page Name *</Label>
                <Input placeholder="e.g. Acme Store" value={form.page_name} onChange={e => setForm(f => ({ ...f, page_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Company / Brand</Label>
                <Input placeholder="e.g. Acme Corp" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Page ID *</Label>
              <Input placeholder="Facebook Page ID (numeric)" value={form.page_id} onChange={e => setForm(f => ({ ...f, page_id: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Page Access Token *</Label>
              <Input type="password" placeholder="EAAxxxxxxx..." value={form.page_access_token} onChange={e => setForm(f => ({ ...f, page_access_token: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Verify Token (auto-generated)</Label>
              <div className="flex gap-2">
                <Input value={form.verify_token} onChange={e => setForm(f => ({ ...f, verify_token: e.target.value }))} />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(form.verify_token)}><Copy className="w-3.5 h-3.5" /></Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
              <p className="font-semibold">Webhook Setup in Meta Developer Console:</p>
              <p>1. Go to your Meta App → Webhooks → Add Subscription</p>
              <p>2. Set Callback URL to: <span className="font-mono break-all">{WEBHOOK_BASE}</span></p>
              <p>3. Set Verify Token to the value above</p>
              <p>4. Subscribe to: <strong>messages</strong>, <strong>messaging_postbacks</strong></p>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-blue-700 mt-1" onClick={() => copyToClipboard(WEBHOOK_BASE)}>
                <Copy className="w-3 h-3 mr-1" /> Copy Webhook URL
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>
              <Button size="sm" onClick={save}>Save Page</Button>
            </div>
          </div>
        )}

        {pages.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">No pages connected yet. Click "Add Page" to get started.</p>
        ) : (
          pages.map(page => (
            <div key={page.id} className="border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Facebook className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{page.page_name}</p>
                    {page.company && <span className="text-xs text-muted-foreground truncate">· {page.company}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">ID: {page.page_id}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={page.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {page.is_active ? 'Active' : 'Paused'}
                  </Badge>
                  <Switch checked={page.is_active} onCheckedChange={() => toggleActive(page)} className="scale-75" />
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setExpanded(expanded === page.id ? null : page.id)}>
                    {expanded === page.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(page)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => deletePage(page.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {expanded === page.id && (
                <div className="border-t bg-muted/20 p-3 text-xs space-y-1.5 text-muted-foreground">
                  <div className="flex gap-2 items-center">
                    <span className="font-medium text-foreground w-24">Webhook URL</span>
                    <span className="font-mono truncate flex-1">{WEBHOOK_BASE}</span>
                    <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => copyToClipboard(WEBHOOK_BASE)}><Copy className="w-3 h-3" /></Button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-medium text-foreground w-24">Verify Token</span>
                    <span className="font-mono flex-1">{page.verify_token}</span>
                    <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => copyToClipboard(page.verify_token)}><Copy className="w-3 h-3" /></Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}