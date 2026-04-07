import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, Save, Upload, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const defaultSettings = {
  privacy_policy_url: '',
  terms_of_service_url: '',
  data_deletion_url: '',
  app_icon_url: '',
};

export default function AppSettings() {
  const [form, setForm] = useState(defaultSettings);
  const [settingsId, setSettingsId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [iconUploaded, setIconUploaded] = useState(false);
  const qc = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => base44.entities.WidgetSettings.list(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      const s = settings[0];
      setSettingsId(s.id);
      setForm({
        privacy_policy_url: s.privacy_policy_url || '',
        terms_of_service_url: s.terms_of_service_url || '',
        data_deletion_url: s.data_deletion_url || '',
        app_icon_url: s.app_icon_url || '',
      });
    }
  }, [settings]);

  const save = async () => {
    if (settingsId) {
      await base44.entities.WidgetSettings.update(settingsId, form);
    } else {
      const created = await base44.entities.WidgetSettings.create(form);
      setSettingsId(created.id);
    }
    qc.invalidateQueries({ queryKey: ['app-settings'] });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, app_icon_url: result.file_url }));
    setUploading(false);
    setIconUploaded(true);
    setTimeout(() => setIconUploaded(false), 3000);
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">App Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your app's legal URLs and branding</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Legal URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Privacy Policy URL</Label>
              <p className="text-xs text-muted-foreground">Used in login dialog and app details</p>
              <Input placeholder="https://example.com/privacy" value={form.privacy_policy_url} onChange={e => set('privacy_policy_url', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Terms of Service URL</Label>
              <p className="text-xs text-muted-foreground">Used in login dialog and app details</p>
              <Input placeholder="https://example.com/terms" value={form.terms_of_service_url} onChange={e => set('terms_of_service_url', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">User Data Deletion URL</Label>
              <p className="text-xs text-muted-foreground">Instructions for users to request data deletion</p>
              <Input placeholder="https://example.com/delete-data" value={form.data_deletion_url} onChange={e => set('data_deletion_url', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">App Icon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">App Icon (1024 × 1024)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {form.app_icon_url ? (
                  <div className="space-y-3">
                    <img src={form.app_icon_url} alt="App icon" className="w-24 h-24 rounded-lg mx-auto object-cover" />
                    {iconUploaded && (
                      <div className="flex items-center justify-center gap-1.5 text-green-600 text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Icon uploaded successfully
                      </div>
                    )}
                    <label>
                      <input type="file" accept="image/*" onChange={handleIconUpload} disabled={uploading} className="hidden" />
                      <span className="text-sm text-primary hover:underline cursor-pointer">
                        {uploading ? 'Uploading...' : 'choose a different file'}
                      </span>
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleIconUpload} disabled={uploading} className="hidden" />
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Drop icon here or click to upload</p>
                      <p className="text-xs text-muted-foreground">Recommended: 1024 × 1024px</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={save} className="gap-2 w-full" variant={saved ? 'outline' : 'default'}>
          {saved
            ? <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-green-600">Saved successfully</span></>
            : <><Save className="w-4 h-4" /> Save Settings</>
          }
        </Button>
      </div>
    </div>
  );
}
