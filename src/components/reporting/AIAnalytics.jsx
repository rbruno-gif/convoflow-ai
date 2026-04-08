import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, CheckCircle, XCircle, ArrowRight, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { filterByDateRange } from './DateRangeFilter';
import MetricCard from './MetricCard';

export default function AIAnalytics({ brandId, dateRange }) {
  const { data: allConvos = [] } = useQuery({
    queryKey: ['rep-convos', brandId],
    queryFn: () => brandId
      ? base44.entities.Conversation.filter({ brand_id: brandId }, '-created_date', 1000)
      : base44.entities.Conversation.list('-created_date', 1000),
  });
  const { data: allMessages = [] } = useQuery({
    queryKey: ['rep-msgs', brandId],
    queryFn: () => base44.entities.Message.list('-timestamp', 2000),
  });
  const { data: allFAQs = [] } = useQuery({
    queryKey: ['rep-faqs', brandId],
    queryFn: () => brandId
      ? base44.entities.FAQ.filter({ brand_id: brandId, is_active: true })
      : base44.entities.FAQ.filter({ is_active: true }),
  });

  const convos = filterByDateRange(allConvos, 'created_date', dateRange);
  const total = convos.length;
  const aiOnly = convos.filter(c => c.mode === 'ai' && c.status === 'resolved').length;
  const handedOff = convos.filter(c => c.status === 'human_requested' || (c.mode === 'human' && c.ai_resolution_attempted)).length;
  const containmentRate = total > 0 ? Math.round((aiOnly / total) * 100) : 0;
  const handoffRate = total > 0 ? Math.round((handedOff / total) * 100) : 0;

  // AI messages only
  const aiMessages = allMessages.filter(m =>
    m.sender_type === 'ai' &&
    (!brandId || allConvos.find(c => c.id === m.conversation_id)?.brand_id === brandId)
  );

  // Estimate top answered — FAQs with highest usage count
  const topAnswered = allFAQs.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 10);

  // Unanswerable estimate — conversations where AI handed off after attempting
  const unansweredConvos = convos
    .filter(c => c.ai_resolution_attempted && c.mode === 'human')
    .slice(0, 10);

  // KB coverage estimate
  const uniqueIntents = [...new Set(convos.map(c => c.intent).filter(Boolean))];
  const coveredIntents = uniqueIntents.filter(intent =>
    allFAQs.some(f => f.category && (f.question?.toLowerCase().includes(intent.replace(/_/g, ' ')) || intent.includes(f.category)))
  );
  const coverageScore = uniqueIntents.length > 0 ? Math.round((coveredIntents.length / uniqueIntents.length) * 100) : 0;

  const pieData = [
    { name: 'AI Resolved', value: Math.max(1, aiOnly) },
    { name: 'Handed to Human', value: Math.max(1, handedOff) },
    { name: 'Other', value: Math.max(1, total - aiOnly - handedOff) },
  ];

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Containment Rate" value={`${containmentRate}%`} icon={Bot} color="#7c3aed" bg="rgba(124,58,237,0.1)" sub="AI fully resolved" />
        <MetricCard label="Handoff Rate" value={`${handoffRate}%`} icon={ArrowRight} color="#f59e0b" bg="rgba(245,158,11,0.1)" sub="Transferred to human" />
        <MetricCard label="AI Responses" value={aiMessages.length} icon={CheckCircle} color="#10b981" bg="rgba(16,185,129,0.1)" sub={`${dateRange}-day period`} />
        <MetricCard label="KB Coverage" value={`${coverageScore}%`} icon={BookOpen} color="#0891b2" bg="rgba(8,145,178,0.1)" sub="FAQ match estimate" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Containment donut */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">AI Resolution Breakdown</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  <Cell fill="#7c3aed" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {[{ label: 'AI Resolved', color: '#7c3aed', value: aiOnly }, { label: 'Handed to Human', color: '#f59e0b', value: handedOff }, { label: 'Other/Active', color: '#e5e7eb', value: total - aiOnly - handedOff }].map(d => (
                <div key={d.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-gray-600">{d.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{Math.max(0, d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KB coverage */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Knowledge Base Coverage</h3>
          <div className="flex flex-col items-center justify-center h-40">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0891b2" strokeWidth="3"
                  strokeDasharray={`${coverageScore} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{coverageScore}%</span>
                <span className="text-[10px] text-gray-400">coverage</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">{allFAQs.length} FAQs · {uniqueIntents.length} detected intents</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top answered */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-4">Top 10 Answered by AI</h3>
          {topAnswered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No FAQ data available</p>
          ) : (
            <div className="space-y-2">
              {topAnswered.map((faq, i) => (
                <div key={faq.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-green-50 border border-green-100">
                  <span className="w-5 h-5 rounded-full bg-green-200 text-green-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{faq.question}</p>
                    <p className="text-[10px] text-gray-400">{faq.usage_count || 0} uses · {faq.category}</p>
                  </div>
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Could not answer */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-sm text-gray-800 mb-1">AI Could Not Answer (Gaps)</h3>
          <p className="text-xs text-gray-400 mb-4">Conversations where AI attempted but handed off — add FAQs for these topics</p>
          {unansweredConvos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No gaps detected — great KB coverage!</p>
          ) : (
            <div className="space-y-2">
              {unansweredConvos.map((c, i) => (
                <div key={c.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-red-50 border border-red-100">
                  <span className="w-5 h-5 rounded-full bg-red-200 text-red-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{c.last_message || 'No message recorded'}</p>
                    <p className="text-[10px] text-gray-400">{c.intent?.replace(/_/g, ' ')} · {c.customer_name}</p>
                  </div>
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}