import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { FileText, Download, Mail, Clock, CheckCircle, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { filterByDateRange } from './DateRangeFilter';

const REPORT_TYPES = ['Conversation Summary', 'Ticket Report', 'Agent Performance', 'AI Analytics', 'CSAT Report', 'Full Overview'];

export default function ReportsExport({ brandId, dateRange }) {
  const { activeBrand, brands } = useBrand();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [selectedType, setSelectedType] = useState('Full Overview');
  const [emailTo, setEmailTo] = useState('');
  const [schedule, setSchedule] = useState('');
  const [reportHistory, setReportHistory] = useState([
    { id: 1, name: 'Full Overview — March 2026', brand: activeBrand?.name || 'All brands', date: '2026-03-31', type: 'PDF', size: '142 KB' },
    { id: 2, name: 'Ticket Report — March 2026', brand: activeBrand?.name || 'All brands', date: '2026-03-31', type: 'CSV', size: '28 KB' },
  ]);

  const { data: convos = [] } = useQuery({
    queryKey: ['rep-convos', brandId],
    queryFn: () => brandId
      ? base44.entities.Conversation.filter({ brand_id: brandId }, '-created_date', 500)
      : base44.entities.Conversation.list('-created_date', 500),
  });
  const { data: tickets = [] } = useQuery({
    queryKey: ['rep-tickets', brandId],
    queryFn: () => brandId
      ? base44.entities.Ticket.filter({ brand_id: brandId }, '-created_date', 500)
      : base44.entities.Ticket.list('-created_date', 500),
  });

  const filteredConvos = filterByDateRange(convos, 'created_date', dateRange);
  const filteredTickets = filterByDateRange(tickets, 'created_date', dateRange);

  const exportCSV = () => {
    setGenerating(true);
    setTimeout(() => {
      const rows = [
        ['Report', selectedType],
        ['Brand', activeBrand?.name || 'All brands'],
        ['Date Range', `Last ${dateRange} days`],
        ['Generated', format(new Date(), 'yyyy-MM-dd HH:mm')],
        [],
        ['CONVERSATIONS'],
        ['Customer', 'Status', 'Mode', 'Channel', 'Intent', 'Date'],
        ...filteredConvos.map(c => [c.customer_name, c.status, c.mode, c.channel || 'chat', c.intent || '', c.created_date ? format(new Date(c.created_date), 'yyyy-MM-dd') : '']),
        [],
        ['TICKETS'],
        ['Customer', 'Title', 'Status', 'Priority', 'Agent', 'CSAT', 'Date'],
        ...filteredTickets.map(t => [t.customer_name, t.title, t.status, t.priority, t.assigned_agent || '', t.csat_score || '', t.created_date ? format(new Date(t.created_date), 'yyyy-MM-dd') : '']),
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `u2c-report-${activeBrand?.slug || 'all'}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      setGenerating(false);
      setGenerated(true);
      const newReport = {
        id: Date.now(),
        name: `${selectedType} — ${format(new Date(), 'MMMM yyyy')}`,
        brand: activeBrand?.name || 'All brands',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'CSV',
        size: `${Math.round((csv.length / 1024))} KB`,
      };
      setReportHistory(h => [newReport, ...h]);
      setTimeout(() => setGenerated(false), 3000);
    }, 1000);
  };

  const sendEmail = async () => {
    if (!emailTo.trim()) return;
    setGenerating(true);
    const resolved = filteredConvos.filter(c => c.status === 'resolved').length;
    const resRate = filteredConvos.length > 0 ? Math.round((resolved / filteredConvos.length) * 100) : 0;
    const openTickets = filteredTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

    await base44.integrations.Core.SendEmail({
      to: emailTo,
      subject: `U2C Command Center — ${selectedType} (Last ${dateRange} days)`,
      body: `
<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 24px; border-radius: 12px; color: white; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 22px;">U2C Command Center</h1>
    <p style="margin: 4px 0 0; opacity: 0.8;">${selectedType} · Last ${dateRange} days</p>
    <p style="margin: 4px 0 0; opacity: 0.7; font-size: 13px;">Brand: ${activeBrand?.name || 'All brands'}</p>
  </div>
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center;">
      <p style="font-size: 28px; font-weight: bold; margin: 0; color: #7c3aed;">${filteredConvos.length}</p>
      <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">Conversations</p>
    </div>
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center;">
      <p style="font-size: 28px; font-weight: bold; margin: 0; color: #10b981;">${resRate}%</p>
      <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">Resolution Rate</p>
    </div>
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center;">
      <p style="font-size: 28px; font-weight: bold; margin: 0; color: #ef4444;">${openTickets}</p>
      <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">Open Tickets</p>
    </div>
  </div>
  <p style="color: #6b7280; font-size: 13px; text-align: center;">Report generated on ${format(new Date(), 'MMMM d, yyyy')} · U2C Command Center</p>
</div>`,
    });
    setGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Report builder */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-600" /> Generate Report
        </h3>
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Report Type</label>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
              className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
              {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Brand</label>
            <div className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 bg-gray-50 text-gray-700">
              {activeBrand?.name || 'All brands (Super Admin View)'}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all"
            style={{ background: generated ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            {generated ? <><CheckCircle className="w-4 h-4" /> Downloaded!</> : generating ? 'Generating...' : <><Download className="w-4 h-4" /> Export CSV</>}
          </button>
        </div>
      </div>

      {/* Email report */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-teal-600" /> Email Report
        </h3>
        <div className="flex gap-3">
          <input value={emailTo} onChange={e => setEmailTo(e.target.value)}
            placeholder="manager@u2cgroup.com"
            className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <button onClick={sendEmail} disabled={generating || !emailTo.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)' }}>
            <Mail className="w-4 h-4" /> Send Now
          </button>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-100">
          <p className="text-xs text-teal-700 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <strong>Scheduled Reports:</strong> Set up automated weekly/monthly reports in Settings → Notifications.
          </p>
        </div>
      </div>

      {/* Report history */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" /> Report History
        </h3>
        {reportHistory.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No reports generated yet</p>
        ) : (
          <div className="space-y-2">
            {reportHistory.map(r => (
              <div key={r.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: r.type === 'PDF' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }}>
                  <FileText className="w-4 h-4" style={{ color: r.type === 'PDF' ? '#ef4444' : '#10b981' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{r.name}</p>
                  <p className="text-[11px] text-gray-400">{r.brand} · {r.date} · {r.size}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: r.type === 'PDF' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: r.type === 'PDF' ? '#ef4444' : '#10b981' }}>
                  {r.type}
                </span>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}