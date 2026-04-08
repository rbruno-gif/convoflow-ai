import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Code, Eye, Save, CheckCircle, Copy, Palette, Bot, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WidgetBuilder() {
  const { activeBrandId, activeBrand } = useBrand();
  const qc = useQueryClient();
  const [tab, setTab] = useState('customize');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [form, setForm] = useState({
    chatbot_name: 'Support Bot',
    greeting_message: 'Hi! How can I help you today?',
    primary_color: '#7c3aed',
    widget_position: 'bottom-right',
    show_branding: true,
    offline_message: 'We are currently offline. Leave a message!',
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['widget-settings', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.WidgetSettings.filter({ brand_id: activeBrandId })
      : base44.entities.WidgetSettings.list(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      const s = settings[0];
      setSettingsId(s.id);
      setForm({
        chatbot_name: s.chatbot_name || 'Support Bot',
        greeting_message: s.greeting_message || '',
        primary_color: s.primary_color || '#7c3aed',
        widget_position: s.widget_position || 'bottom-right',
        show_branding: s.show_branding !== false,
        offline_message: s.offline_message || '',
      });
    }
  }, [settings]);

  const save = async () => {
    const payload = activeBrandId ? { ...form, brand_id: activeBrandId } : form;
    if (settingsId) await base44.entities.WidgetSettings.update(settingsId, payload);
    else await base44.entities.WidgetSettings.create(payload);
    qc.invalidateQueries({ queryKey: ['widget-settings', activeBrandId] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const snippet = `<!-- ${activeBrand?.name || 'Brand'} Chat Widget -->
<script>
  window.U2CWidgetConfig = {
    brandId: "${activeBrandId || 'YOUR_BRAND_ID'}",
    botName: "${form.chatbot_name}",
    greeting: "${form.greeting_message}",
    color: "${form.primary_color}",
    position: "${form.widget_position}"
  };
</script>
<script async src="https://cdn.u2ccommandcenter.com/widget.js"></script>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeBrandId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Select a brand to configure its widget</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Config panel */}
      <div className="w-96 shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Widget Builder</h1>
              <p className="text-xs text-gray-400">{activeBrand?.name}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {['customize', 'embed'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                  tab === t ? 'text-white' : 'text-gray-500 hover:bg-gray-100')}
                style={tab === t ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}>
                {t === 'customize' ? <><Palette className="w-3.5 h-3.5 inline mr-1" />Customize</> : <><Code className="w-3.5 h-3.5 inline mr-1" />Embed Code</>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'customize' ? (
            <div className="space-y-4">
              <Field label="Bot Name">
                <input value={form.chatbot_name} onChange={e => setForm(f => ({ ...f, chatbot_name: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </Field>
              <Field label="Greeting Message">
                <textarea value={form.greeting_message} onChange={e => setForm(f => ({ ...f, greeting_message: e.target.value }))}
                  rows={2} className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
              </Field>
              <Field label="Offline Message">
                <textarea value={form.offline_message} onChange={e => setForm(f => ({ ...f, offline_message: e.target.value }))}
                  rows={2} className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
              </Field>
              <Field label="Primary Color">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" />
                  <input value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                    className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              </Field>
              <Field label="Widget Position">
                <div className="grid grid-cols-2 gap-2">
                  {['bottom-right', 'bottom-left'].map(pos => (
                    <button key={pos} onClick={() => setForm(f => ({ ...f, widget_position: pos }))}
                      className={cn('py-2 rounded-lg text-xs font-medium border transition-all',
                        form.widget_position === pos ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                      {pos === 'bottom-right' ? '↘ Bottom Right' : '↙ Bottom Left'}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Show Branding</span>
                <button onClick={() => setForm(f => ({ ...f, show_branding: !f.show_branding }))}
                  className={cn('w-11 h-6 rounded-full transition-colors relative', form.show_branding ? 'bg-violet-600' : 'bg-gray-200')}>
                  <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.show_branding ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Paste this snippet before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag on your website.</p>
              <div className="bg-gray-900 rounded-xl p-4 relative">
                <pre className="text-[11px] text-green-400 whitespace-pre-wrap font-mono leading-relaxed">{snippet}</pre>
                <button onClick={copySnippet}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: copied ? '#10b981' : 'rgba(255,255,255,0.1)', color: 'white' }}>
                  {copied ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-1">Brand ID</p>
                <code className="text-xs text-blue-600 break-all">{activeBrandId}</code>
              </div>
            </div>
          )}
        </div>

        {tab === 'customize' && (
          <div className="p-4 border-t border-gray-100">
            <button onClick={save}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Widget</>}
            </button>
          </div>
        )}
      </div>

      {/* Live preview */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
        <div className="relative w-full max-w-sm">
          <p className="text-xs text-gray-400 text-center mb-4 font-medium uppercase tracking-wider">Live Preview</p>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="px-5 py-4 text-white flex items-center gap-3" style={{ background: form.primary_color }}>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{form.chatbot_name || 'Support Bot'}</p>
                <p className="text-[11px] opacity-80">● Online</p>
              </div>
            </div>
            {/* Messages */}
            <div className="p-4 space-y-3 bg-gray-50" style={{ minHeight: 200 }}>
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: form.primary_color }}>
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm max-w-[80%]">
                  <p className="text-xs text-gray-800">{form.greeting_message || 'Hi! How can I help?'}</p>
                </div>
              </div>
            </div>
            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2">
              <input placeholder="Type a message..." className="flex-1 text-xs rounded-xl border border-gray-200 px-3 py-2 focus:outline-none" readOnly />
              <button className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: form.primary_color }}>
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}