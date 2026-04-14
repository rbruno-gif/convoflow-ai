import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Instagram, Plus, Trash2, Edit2, Copy, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

const WEBHOOK_BASE = `${window.location.origin.includes('localhost') ? 'https://your-app.base44.app' : window.location.origin}/api/functions/instagramWebhook`;

const emptyForm = { account_name: '', ig_account_id: '', fb_page_id: '', fb_page_name: '', page_access_token: '', verify_token: '', is_active: true };

export default function InstagramManager({ brandId }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState(null);
  const [igAccounts, setIgAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const fetchIgAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await base44.functions.invoke('getInstagramAccounts', {});
      setIgAccounts(res.data?.accounts || []);
    } catch (e) {
      console.error('Could not fetch IG accounts:', e.message);
    }
    setLoadingAccounts(false);
  };

  const { data: accounts = [] } = useQuery({
    queryKey: ['instagram-accounts', brandId],
    queryFn: () => brandId
      ? base44.entities.InstagramAccount.filter({ brand_id: brandId }, '-created_date', 50)
      : base44.entities.InstagramAccount.list('-created_date', 50),
  });

  const openNew = () => {
    fetchIgAccounts();
    const verify = Math.random().toString(36).substring(2, 12);
    setEditing(null);
    setForm({ ...emptyForm, verify_token: verify });
    setShowForm(true);
  };

  const openEdit = (account) => {
    setEditing(account.id);
    setForm({ ...account });
    setShowForm(true);
  };

  const cancel = () => { setShowForm(false); setEditing(null); setForm(emptyForm); };

  const save = async () => {
    if (!form.account_name || !form.ig_account_id || !form.fb_page_id || !form.page_access_token) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    const payload = brandId ? { ...form, brand_id: brandId } : { ...form };
    if (editing) {
      await base44.entities.InstagramAccount.update(editing, payload);
      toast({ title: 'Instagram account updated' });
    } else {
      await base44.entities.InstagramAccount.create(payload);
      toast({ title: 'Instagram account connected!' });
    }
    qc.invalidateQueries({ queryKey: ['instagram-accounts', brandId] });
    cancel();
  };

  const deleteAccount = async (id) => {
    await base44.entities.InstagramAccount.delete(id);
    qc.invalidateQueries({ queryKey: ['instagram-accounts', brandId] });
    toast({ title: 'Account removed' });
  };

  const toggleActive = async (account) => {
    await base44.entities.InstagramAccount.update(account.id, { is_active: !account.is_active });
    qc.invalidateQueries({ queryKey: ['instagram-accounts', brandId] });
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
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <CardTitle className="text-base">Instagram DMs</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected · DMs sync to inbox
              </p>
            </div>
          </div>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Account
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {showForm && (
          <div className="border rounded-xl p-4 bg-muted/30 space-y-3">
            <h4 className="text-sm font-semibold">{editing ? 'Edit Account' : 'Connect Instagram Business Account'}</h4>

            {/* Auto-detect from connected FB pages */}
            <div className="space-y-1">
              <Label className="text-xs">Auto-detect from your Facebook Pages</Label>
              <div className="flex gap-2">
                <select
                  className="flex-1 text-sm border border-input rounded-md px-3 py-2 bg-background"
                  disabled={loadingAccounts}
                  onChange={e => {
                    const selected = igAccounts.find(a => a.ig_account_id === e.target.value);
                    if (selected) setForm(f => ({
                      ...f,
                      ig_account_id: selected.ig_account_id,
                      fb_page_id: selected.fb_page_id,
                      fb_page_name: selected.fb_page_name,
                      page_access_token: selected.page_access_token,
                      account_name: f.account_name || selected.ig_username || selected.fb_page_name,
                    }));
                  }}
                  defaultValue=""
                >
                  <option value="">
                    {loadingAccounts ? 'Loading accounts…' : igAccounts.length ? 'Choose an Instagram account…' : 'No linked accounts found — fill manually'}
                  </option>
                  {igAccounts.map(a => (
                    <option key={a.ig_account_id} value={a.ig_account_id}>
                      @{a.ig_username} (via {a.fb_page_name})
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="icon" onClick={fetchIgAccounts} disabled={loadingAccounts}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAccounts ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Or fill in manually below. Instagram must be linked to a Facebook Page.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Account Name / Username *</Label>
                <Input placeholder="e.g. @mybrand" value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Instagram Account ID *</Label>
                <Input placeholder="Numeric IG Business Account ID" value={form.ig_account_id} onChange={e => setForm(f => ({ ...f, ig_account_id: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Facebook Page ID *</Label>
                <Input placeholder="Linked FB Page ID" value={form.fb_page_id} onChange={e => setForm(f => ({ ...f, fb_page_id: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Facebook Page Name</Label>
                <Input placeholder="e.g. My Brand Page" value={form.fb_page_name} onChange={e => setForm(f => ({ ...f, fb_page_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Page Access Token *</Label>
              <Input type="password" placeholder="EAAxxxxxxx…" value={form.page_access_token} onChange={e => setForm(f => ({ ...f, page_access_token: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Verify Token (auto-generated)</Label>
              <div className="flex gap-2">
                <Input value={form.verify_token} onChange={e => setForm(f => ({ ...f, verify_token: e.target.value }))} />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(form.verify_token)}><Copy className="w-3.5 h-3.5" /></Button>
              </div>
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-xs text-pink-800 space-y-1">
              <p className="font-semibold">Webhook Setup in Meta Developer Console:</p>
              <p>1. Go to your Meta App → Add Product → <strong>Instagram</strong></p>
              <p>2. Under Webhooks, set Callback URL to:</p>
              <p className="font-mono break-all bg-white rounded px-2 py-1">{WEBHOOK_BASE}</p>
              <p>3. Set Verify Token to the value above, subscribe to <strong>messages</strong></p>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-pink-700 mt-1" onClick={() => copyToClipboard(WEBHOOK_BASE)}>
                <Copy className="w-3 h-3 mr-1" /> Copy Webhook URL
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>
              <Button size="sm" onClick={save}>Save Account</Button>
            </div>
          </div>
        )}

        {accounts.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">No Instagram accounts connected yet. Click "Add Account" to get started.</p>
        ) : (
          accounts.map(account => (
            <div key={account.id} className="border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                  <Instagram className="w-4 h-4 text-pink-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{account.account_name}</p>
                    {account.fb_page_name && <span className="text-xs text-muted-foreground truncate">· via {account.fb_page_name}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">IG ID: {account.ig_account_id}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={account.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {account.is_active ? 'Active' : 'Paused'}
                  </Badge>
                  <Switch checked={account.is_active} onCheckedChange={() => toggleActive(account)} className="scale-75" />
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setExpanded(expanded === account.id ? null : account.id)}>
                    {expanded === account.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(account)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => deleteAccount(account.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {expanded === account.id && (
                <div className="border-t bg-muted/20 p-3 text-xs space-y-1.5 text-muted-foreground">
                  <div className="flex gap-2 items-center">
                    <span className="font-medium text-foreground w-24">Webhook URL</span>
                    <span className="font-mono truncate flex-1">{WEBHOOK_BASE}</span>
                    <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => copyToClipboard(WEBHOOK_BASE)}><Copy className="w-3 h-3" /></Button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-medium text-foreground w-24">Verify Token</span>
                    <span className="font-mono flex-1">{account.verify_token}</span>
                    <Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => copyToClipboard(account.verify_token)}><Copy className="w-3 h-3" /></Button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="font-medium text-foreground w-24">FB Page ID</span>
                    <span className="font-mono flex-1">{account.fb_page_id}</span>
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