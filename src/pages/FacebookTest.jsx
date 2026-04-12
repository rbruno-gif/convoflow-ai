import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Facebook, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FacebookTest() {
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
    try {
      const res = await base44.functions.invoke('testSendFbMessage', {
        psid: psid.trim(),
        page_id: pageId || undefined,
        message: message.trim(),
      });
      setResult(res.data);
    } catch (e) {
      setResult({ success: false, error: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1877F2' }}>
          <Facebook className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Facebook Messenger Test</h1>
          <p className="text-sm text-gray-500">Send a test message to verify your integration</p>
        </div>
      </div>

      <div className="space-y-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {/* Page selector */}
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

        {/* PSID */}
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
          <p className="text-[11px] text-gray-400 mt-1">Find this in the Inbox → Contact Info → PSID field of an existing conversation</p>
        </div>

        {/* Message */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>

        <Button
          onClick={sendTest}
          disabled={loading || !psid.trim()}
          className="w-full gap-2"
          style={{ background: '#1877F2' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? 'Sending...' : 'Send Test Message'}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className={`mt-5 rounded-2xl border p-5 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.success
              ? <CheckCircle className="w-5 h-5 text-green-600" />
              : <XCircle className="w-5 h-5 text-red-600" />}
            <p className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? '✅ Message sent successfully!' : '❌ Failed to send'}
            </p>
          </div>
          {result.page_used && (
            <p className="text-sm text-green-700 mb-1">Page used: <strong>{result.page_used.name}</strong> ({result.page_used.id})</p>
          )}
          {result.error && <p className="text-sm text-red-700">{result.error}</p>}
          <details className="mt-3">
            <summary className="text-xs text-gray-500 cursor-pointer">Raw response</summary>
            <pre className="text-[11px] mt-2 overflow-auto bg-white rounded-lg p-3 border border-gray-200">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}