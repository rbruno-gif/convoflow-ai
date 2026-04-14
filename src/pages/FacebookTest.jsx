import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Facebook, Send, CheckCircle, XCircle, Loader2, ShieldCheck, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FacebookTest() {
  const [tab, setTab] = useState('message');

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1877F2' }}>
          <Facebook className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Facebook Integration Tests</h1>
          <p className="text-sm text-gray-500">Verify Messenger sending and permission scopes</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('message')}
          className={`flex-1 text-sm font-medium py-2 px-4 rounded-lg transition-colors ${tab === 'message' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Send Test Message
        </button>
        <button
          onClick={() => setTab('permissions')}
          className={`flex-1 text-sm font-medium py-2 px-4 rounded-lg transition-colors ${tab === 'permissions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Permission Tests
        </button>
      </div>

      {tab === 'message' ? <SendMessageTab /> : <PermissionsTab />}
    </div>
  );
}

function SendMessageTab() {
  const [psid, setPsid] = useState('');
  const [message, setMessage] = useState('Test message from ConvoFlow ✅');
  const [pageId, setPageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { data: pages = [] } = useQuery({
    queryKey: ['fb-pages-test'],
    queryFn: () => base44.entities.FacebookPage.filter({ is_active: true }),
  });

  const sendTest = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke('testSendFbMessage', {
      psid: psid.trim(),
      page_id: pageId || undefined,
      message: message.trim(),
    });
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="space-y-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Facebook Page</label>
        <select
          value={pageId}
          onChange={e => setPageId(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Auto-detect (first page)</option>
          {pages.map(p => (
            <option key={p.id} value={p.page_id}>{p.page_name} — {p.page_id}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
          Recipient PSID <span className="normal-case font-normal text-gray-400">(Facebook user's Page-Scoped ID)</span>
        </label>
        <input
          value={psid}
          onChange={e => setPsid(e.target.value)}
          placeholder="e.g. 7890123456789012"
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </div>

      <Button onClick={sendTest} disabled={loading || !psid.trim()} className="w-full gap-2" style={{ background: '#1877F2' }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? 'Sending...' : 'Send Test Message'}
      </Button>

      {result && (
        <div className={`rounded-2xl border p-5 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            <p className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? '✅ Message sent successfully!' : '❌ Failed to send'}
            </p>
          </div>
          {result.page_used && (
            <p className="text-sm text-green-700 mb-1">Page: <strong>{result.page_used.name}</strong> ({result.page_used.id})</p>
          )}
          {result.error && <p className="text-sm text-red-700">{JSON.stringify(result.error)}</p>}
          <details className="mt-3">
            <summary className="text-xs text-gray-500 cursor-pointer">Raw response</summary>
            <pre className="text-[11px] mt-2 overflow-auto bg-white rounded-lg p-3 border border-gray-200">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

function PermissionsTab() {
  const [userToken, setUserToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runTests = async () => {
    setLoading(true);
    setResults(null);
    const res = await base44.functions.invoke('testMetaEmailProfile', {
      user_access_token: userToken.trim() || undefined,
    });
    setResults(res.data?.results || res.data);
    setLoading(false);
  };

  const PermResult = ({ icon: Icon, label, data }) => {
    if (!data) return null;
    const ok = data.success;
    return (
      <div className={`rounded-xl border p-4 ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${ok ? 'text-green-600' : 'text-red-500'}`} />
          <span className={`text-sm font-semibold ${ok ? 'text-green-800' : 'text-red-700'}`}>{label}</span>
          {ok ? <CheckCircle className="w-4 h-4 text-green-600 ml-auto" /> : <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
        </div>
        {ok && data.data && (
          <pre className="text-[11px] bg-white rounded-lg p-2 border border-green-200 overflow-auto">
            {JSON.stringify(data.data, null, 2)}
          </pre>
        )}
        {!ok && data.error && <p className="text-xs text-red-600 mt-1">{data.error}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> For Meta App Review</p>
        <p className="text-xs">Paste a <strong>User Access Token</strong> (with <code className="bg-blue-100 rounded px-1">email</code> and <code className="bg-blue-100 rounded px-1">public_profile</code> scopes) from the <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noreferrer" className="underline font-medium">Graph API Explorer</a>. This proves the permissions work end-to-end for the App Review team.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
            User Access Token <span className="normal-case font-normal text-gray-400">(required for email + public_profile)</span>
          </label>
          <textarea
            value={userToken}
            onChange={e => setUserToken(e.target.value)}
            placeholder="EAA... (User Access Token from Graph API Explorer)"
            rows={3}
            className="w-full text-xs font-mono border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <p className="text-[11px] text-gray-400 mt-1">Leave blank to use the app's Page Access Token (may not return email/public_profile for page tokens).</p>
        </div>

        <Button onClick={runTests} disabled={loading} className="w-full gap-2" style={{ background: '#1877F2' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {loading ? 'Testing...' : 'Run Permission Tests'}
        </Button>
      </div>

      {results && (
        <div className="space-y-3">
          <PermResult icon={User} label="public_profile" data={results.public_profile} />
          <PermResult icon={Mail} label="email" data={results.email} />
          {results.pages_profiles && (
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700 mb-1">Pages ({results.pages_profiles.pages_count})</p>
              {(results.pages_profiles.pages || []).map(p => (
                <p key={p.id} className="text-xs text-gray-500">{p.name} — {p.id} ({p.category})</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}