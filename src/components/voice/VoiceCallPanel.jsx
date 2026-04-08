import { useState } from 'react';
import { Phone, Clock, MessageSquare, Volume2, Download } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function VoiceCallPanel({ call }) {
  const [agentNotes, setAgentNotes] = useState(call.agent_notes || '');
  const [showSave, setShowSave] = useState(false);

  const handleNotesSave = async () => {
    if (window.base44) {
      try {
        await window.base44.entities.VoiceCall.update(call.id, { agent_notes: agentNotes });
        setShowSave(false);
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    }
  };

  const statusColor = {
    completed: 'text-green-600 bg-green-50',
    voicemail: 'text-amber-600 bg-amber-50',
    failed: 'text-red-600 bg-red-50',
    in_progress: 'text-blue-600 bg-blue-50',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4 text-teal-600" />
            <p className="font-semibold text-gray-900">{call.customer_name}</p>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor[call.status] || 'text-gray-600 bg-gray-50'}`}>
              {call.status === 'completed' ? 'Completed' : call.status === 'voicemail' ? 'Voicemail' : call.status}
            </span>
          </div>
          <p className="text-xs text-gray-500">{call.customer_phone}</p>
          <p className="text-xs text-gray-400 mt-1">
            {call.created_date && formatDistanceToNow(new Date(call.created_date), { addSuffix: true })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{call.direction === 'inbound' ? '📱 Inbound' : '📞 Outbound'}</p>
          <p className="text-xs text-gray-500 mt-1">
            <Clock className="w-3 h-3 inline mr-1" />
            {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '—'}
          </p>
        </div>
      </div>

      {/* Issue & Type */}
      {call.issue_summary && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
          <p className="text-xs font-medium text-teal-700 mb-1">Call Reason</p>
          <p className="text-sm text-teal-900">{call.issue_summary}</p>
        </div>
      )}

      {/* Resolution Status */}
      <div className="grid grid-cols-2 gap-3">
        {call.resolved_by_ai && (
          <div className="bg-green-50 border border-green-100 rounded-lg p-2">
            <p className="text-[10px] text-green-700 font-semibold">✓ Resolved by AI</p>
          </div>
        )}
        {call.transferred_to_agent && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
            <p className="text-[10px] text-blue-700 font-semibold">→ Transferred to Agent</p>
          </div>
        )}
        {call.campaign_outcome && (
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-2">
            <p className="text-[10px] text-purple-700 font-semibold capitalize">{call.campaign_outcome}</p>
          </div>
        )}
        {call.csat_score && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-2">
            <p className="text-[10px] text-amber-700 font-semibold">CSAT: {call.csat_score}/5</p>
          </div>
        )}
      </div>

      {/* Recording & Transcript */}
      {call.recording_url && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Recording</p>
          <audio
            controls
            className="w-full rounded-lg border border-gray-200"
            src={call.recording_url}
          />
          <a
            href={call.recording_url}
            download
            className="text-xs text-teal-600 hover:underline mt-2 flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Download Recording
          </a>
        </div>
      )}

      {call.transcript && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Transcript
          </p>
          <div className="bg-gray-50 rounded-xl p-3 max-h-48 overflow-y-auto border border-gray-100">
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">{call.transcript}</p>
          </div>
        </div>
      )}

      {/* Agent Notes */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Agent Notes</p>
        <textarea
          value={agentNotes}
          onChange={e => {
            setAgentNotes(e.target.value);
            setShowSave(true);
          }}
          rows={3}
          placeholder="Add your notes about this call..."
          className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
        />
        {showSave && (
          <button
            onClick={handleNotesSave}
            className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-medium"
          >
            Save Notes
          </button>
        )}
      </div>
    </div>
  );
}